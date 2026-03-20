// ==============================================================================
// 📄 파일 경로 : frontend/src/services/ProjectService.js
// 🎯 주요 역할 : 백엔드와 통신하며, 파일을 R2 클라우드에 직접 업로드하는 API 계층
// ==============================================================================

import axios from 'axios';
import useCustomizerStore from '../store/useCustomizerStore';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api/projects' : '/api/projects';

// ⭐ [트래픽 방어] 지문(Fingerprint) 기반 전역 캐시
// { "프로젝트ID_파일명_용량_수정시간": "최종 클라우드 URL" }
const globalFingerprintCache = {}; 

// ⭐ 픽스 1: 파일 내용 기반 지문 생성 (projectId를 추가하여 프로젝트 간 충돌 방지)
const getFileFingerprint = (file, projectId) => {
    if (!file) return "no_file_" + Date.now();
    
    // 파일명, 크기, 수정시간을 조합해 지문 생성 (속성이 없어도 터지지 않게 방어)
    const name = file.name || "unknown";
    const size = file.size || 0;
    const lastModified = file.lastModified || 0;
    
    return `${projectId}_${name}_${size}_${lastModified}`.replace(/\s+/g, '_');
};

// ⭐ 픽스 2: 고유 파일명 생성 (.mp3 확장자 보존 및 예외 처리)
const generateUniqueName = (input) => {
    let name = "";

    // 1. Duck Typing 검사: instanceof File이 실패해도 name 속성이 있으면 무조건 추출!
    if (input && typeof input.name === 'string') {
        name = input.name;
    } 
    // 2. 입력값이 문자열인 경우 그대로 사용
    else if (typeof input === 'string') {
        name = input;
    }
    // 3. 둘 다 아니거나 비어있는 경우 기본값 부여 (에러 방지)
    else {
        console.warn("⚠️ 유효하지 않은 파일 데이터:", input);
        name = "unnamed_file_" + Date.now();
    }

    // 공백을 언더바로 바꾸고, 영문/숫자/점(.)/밑줄(_)/하이픈(-) 외의 특수문자만 제거
    // 💡 점(.)을 살려두었으므로 .png, .mp3 등의 확장자가 안전하게 보존됩니다.
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
};

export const saveProjectToServer = async (id, pw) => {
    try {
        const response = await axios.post(`${API_URL}/create`, { id, pw });
        return response.data;
    } catch (error) {
        console.error("❌ 계정 생성 중 오류:", error);
        throw error;
    }
};

export const uploadAndSaveProject = async (projectId, htmlString) => {
    const state = useCustomizerStore.getState();
    
    const blobToUniqueName = {};  
    const filesToUpload = [];   

    // --- 파일 수집 헬퍼 함수 ---
    const collectFile = (item) => {
        const file = item?.file;
        const url = item?.preview || item?.url;
        
        if (file && url) {
            const uniqueName = generateUniqueName(file);
            blobToUniqueName[url] = uniqueName;
            filesToUpload.push({ file, uniqueName });
        }
    };

    // --- 상태(State)를 뒤져서 모든 물리적 파일 긁어모으기 ---
    state.protagonist?.images?.forEach(collectFile);
    state.characters?.forEach(c => c.images?.forEach(collectFile));
    state.customBackgrounds?.forEach(collectFile);
    state.customFonts?.forEach(collectFile);

    state.events?.forEach(event => {
        if (event.bgmFile && event.bgm?.startsWith('blob:')) {
            const uniqueName = generateUniqueName(event.bgmFile);
            blobToUniqueName[event.bgm] = uniqueName;
            filesToUpload.push({ file: event.bgmFile, uniqueName });
        }

        event.scenarios?.forEach(sc => {
            if (sc.file) {
                const uniqueName = generateUniqueName(sc.file);
                if (sc.src?.startsWith('blob:')) blobToUniqueName[sc.src] = uniqueName;
                if (sc.bgImage?.startsWith('blob:')) blobToUniqueName[sc.bgImage] = uniqueName;
                filesToUpload.push({ file: sc.file, uniqueName });
            }
        });
    });

    if (state.startMenu?.bgImage) collectFile(state.startMenu.bgImage);
    if (state.startMenu?.bgm) collectFile(state.startMenu.bgm);

    // --- 중복 파일 제거 ---
    const finalFiles = [];
    const seenNames = new Set();
    filesToUpload.forEach(item => {
        if (item && !seenNames.has(item.uniqueName)) {
            seenNames.add(item.uniqueName);
            finalFiles.push(item);
        }
    });

    console.log("🚀 클라우드 저장 프로세스 시작...");
    
    // ⭐ 백엔드에 전달할 "정확한 이름 -> URL" 지도
    const uniqueNameToUrlMap = {}; 
    const filesToActuallyUpload = [];

    // 업로드할 파일과 스킵할 파일 분류
    finalFiles.forEach(item => {
        // ⭐ 지문에 projectId를 함께 전달!
        const fingerprint = getFileFingerprint(item.file, projectId); 
        
        if (globalFingerprintCache[fingerprint]) {
            // 이전에 업로드했던 똑같은 내용의 파일이라면, 지도에 이전 URL만 슥 적어둠
            uniqueNameToUrlMap[item.uniqueName] = globalFingerprintCache[fingerprint];
        } else {
            filesToActuallyUpload.push(item);
        }
    });

    if (filesToActuallyUpload.length > 0) {
        console.log(`📡 1단계: 서버에 새 파일 ${filesToActuallyUpload.length}개의 업로드 권한(Presigned URL) 요청...`);
        
        const filesInfo = filesToActuallyUpload.map(item => ({ name: item.uniqueName, type: item.file.type }));
        const urlResponse = await axios.post(`${API_URL}/presigned`, { projectId, filesInfo });
        const { urls } = urlResponse.data;

        console.log("🚀 2단계: R2 클라우드로 파일 다이렉트 업로드 시작!");
        
        const uploadPromises = urls.map(async (urlInfo) => {
            const item = filesToActuallyUpload.find(f => f.uniqueName === urlInfo.originalName);
            if (item) {
                await axios.put(urlInfo.uploadUrl, item.file, {
                    headers: { 'Content-Type': item.file.type }
                });
                
                // ⭐ 성공 시 전역 캐시(지문)와 백엔드 지도(고유이름)에 동시 기록 (projectId 포함)
                const fingerprint = getFileFingerprint(item.file, projectId);
                globalFingerprintCache[fingerprint] = urlInfo.finalUrl;
                uniqueNameToUrlMap[item.uniqueName] = urlInfo.finalUrl;
            }
        });
        
        await Promise.all(uploadPromises);
        console.log("✅ 2단계 완료: 새 파일들 클라우드 업로드 성공!");
    } else {
        console.log("⏭️ 새로 추가된 데이터가 없어 파일 업로드를 건너뜁니다! (트래픽 방어 성공 🛡️)");
    }

    // ==============================================================================
    // 3. 정제된 최종 JSON 데이터 조립
    // ==============================================================================
    console.log("📄 3단계: 최종 데이터 백엔드 전송 준비...");

    const cleanUrl = (url) => {
        if (!url) return null;
        if (blobToUniqueName[url]) return blobToUniqueName[url]; 
        if (typeof url === 'string' && url.includes('undefined')) return null;
        return url; 
    };

    const getCleanNameOrUrl = (img) => {
        if (img.file) return generateUniqueName(img.file); 
        const url = img.preview || img;
        if (typeof url === 'string' && url.includes('undefined')) return null;
        return url;
    };

    const eventsToSave = JSON.parse(JSON.stringify(state.events || []));
    eventsToSave.forEach(event => {
        event.bgm = cleanUrl(event.bgm); 
        delete event.bgmFile; 

        event.scenarios?.forEach(sc => {
            sc.protagonistImage = cleanUrl(sc.protagonistImage);
            sc.heroineImage = cleanUrl(sc.heroineImage);
            sc.bgImage = cleanUrl(sc.bgImage);
            sc.src = cleanUrl(sc.src);
        });
    });

    const gameData = {
        selectedMode: state.selectedMode,
        pFontStyle: state.pFontStyle, 
        globalUi: state.globalUi, 
        startMenu: {
            ...state.startMenu,
            bgImage: state.startMenu?.bgImage?.file ? generateUniqueName(state.startMenu.bgImage.file) : (state.startMenu?.bgImage?.preview || state.startMenu?.bgImage || null),
            bgm: state.startMenu?.bgm?.file ? generateUniqueName(state.startMenu.bgm.file) : (state.startMenu?.bgm?.preview || state.startMenu?.bgm || null)
        },
        protagonist: {
            name: state.protagonist?.name || "",
            images: state.protagonist?.images?.map(getCleanNameOrUrl).filter(Boolean) || []
        },
        characters: state.characters?.map(c => ({
            ...c,
            images: c.images?.map(getCleanNameOrUrl).filter(Boolean) || []
        })) || [],
        events: eventsToSave,
        customFonts: state.customFonts?.map(f => ({
            name: f.name,
            url: f.file ? generateUniqueName(f.file) : f.url 
        })) || []
    };

    // --- 최종 백엔드 전송 ---
    const response = await axios.post(`${API_URL}/save`, {
        projectId,
        gameData: JSON.stringify(gameData),
        htmlContent: htmlString,
        // ⭐ 제대로 매칭된 지도를 넘겨주어 백엔드가 https:// 로 변환하게 만듦
        urlMap: uniqueNameToUrlMap 
    });
    
    console.log("🎉 저장 대성공!");
    return response.data;
};