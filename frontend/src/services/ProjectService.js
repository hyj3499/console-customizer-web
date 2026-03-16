// ==============================================================================
// 📄 파일 경로 : frontend/src/services/ProjectService.js
// 🎯 주요 역할 : 백엔드와 통신하며, 파일을 R2 클라우드에 직접 업로드하는 API 계층
//
// 💡 리팩토링 포인트 : 
//   - Vercel 4.5MB 제한을 우회하기 위해 다이렉트 업로드(Presigned URL) 방식 도입
//   - 상태 관리에 있는 모든 파일을 긁어모아 일괄 병렬 처리
//   - [추가] 글로벌 캐시를 도입하여 중복 업로드(트래픽 낭비) 완벽 차단 🛡️
// ==============================================================================

import axios from 'axios';
import useCustomizerStore from '../store/useCustomizerStore';

// Vercel 환경과 로컬 환경을 자동 구분하는 API 경로
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api/projects' : '/api/projects';

// ==============================================================================
// ⭐ [트래픽 방어] 이번 세션에서 이미 업로드에 성공한 파일의 최종 URL을 기억하는 전역 메모장
// ==============================================================================
const globalUrlMapCache = {}; 

export const saveProjectToServer = async (id, pw) => {
    try {
        const response = await axios.post(`${API_URL}/create`, { id, pw });
        return response.data;
    } catch (error) {
        console.error("❌ 계정 생성 중 오류:", error);
        throw error;
    }
};

// ==============================================================================
// ⭐ 핵심 로직: 파일 수집 -> 클라우드 직접 전송 -> 최종 데이터 백엔드 전송
// ==============================================================================
export const uploadAndSaveProject = async (projectId, htmlString) => {
    const state = useCustomizerStore.getState();
    
    // 1. 데이터 정제를 위한 바구니 준비
    const blobToFileName = {};  
    const filesToUpload = [];   

    // --- 파일 수집 헬퍼 함수 ---
    const collectFile = (item) => {
        const file = item?.file;
        const url = item?.preview || item?.url;
        
        if (file && url) {
            blobToFileName[url] = file.name;
            filesToUpload.push(file);
            console.log("📌 수집된 파일:", file.name);
        }
    };

    // --- 상태(State)를 뒤져서 모든 물리적 파일 긁어모으기 ---
    state.protagonist?.images?.forEach(collectFile);
    state.characters?.forEach(c => c.images?.forEach(collectFile));
    state.customBackgrounds?.forEach(collectFile);
    state.customFonts?.forEach(collectFile);

    state.events?.forEach(event => {
        if (event.bgmFile && event.bgm?.startsWith('blob:')) {
            blobToFileName[event.bgm] = event.bgmFile.name;
            filesToUpload.push(event.bgmFile);
        }

        event.scenarios?.forEach(sc => {
            if (sc.file) {
                if (sc.src?.startsWith('blob:')) blobToFileName[sc.src] = sc.file.name;
                if (sc.bgImage?.startsWith('blob:')) blobToFileName[sc.bgImage] = sc.file.name;
                filesToUpload.push(sc.file);
            }
        });
    });

    if (state.startMenu?.bgImage) {
        collectFile(state.startMenu.bgImage);
    }

    // --- 중복 파일 제거 ---
    const finalFiles = [];
    const seenNames = new Set();
    filesToUpload.forEach(file => {
        if (file && !seenNames.has(file.name)) {
            seenNames.add(file.name);
            finalFiles.push(file);
        }
    });

    // ==============================================================================
    // ⭐ [추가/변경] 다이렉트 업로드 (캐시 메모장 확인 로직 추가)
    // ==============================================================================
    console.log("🚀 클라우드 저장 프로세스 시작...");
    
    // 💡 핵심: 수집된 파일 중 '전역 메모장에 없는(처음 보는) 파일'만 진짜 업로드 목록으로 추림
    const filesToActuallyUpload = finalFiles.filter(file => !globalUrlMapCache[file.name]);

    if (filesToActuallyUpload.length > 0) {
        console.log(`📡 1단계: 서버에 새 파일 ${filesToActuallyUpload.length}개의 업로드 권한(Presigned URL) 요청...`);
        
        // 서버에 "이 파일들 올릴 테니 입장권 줘" 라고 요청 (새 파일만!)
        const filesInfo = filesToActuallyUpload.map(f => ({ name: f.name, type: f.type }));
        const urlResponse = await axios.post(`${API_URL}/presigned`, { projectId, filesInfo });
        const { urls } = urlResponse.data;

        console.log("🚀 2단계: R2 클라우드로 파일 다이렉트 업로드 시작! (Vercel 제한 없음)");
        
        // 입장권(URL)을 사용하여 R2 클라우드로 직접 PUT 요청 
        const uploadPromises = urls.map(async (urlInfo) => {
            const file = filesToActuallyUpload.find(f => f.name === urlInfo.originalName);
            if (file) {
                await axios.put(urlInfo.uploadUrl, file, {
                    headers: { 'Content-Type': file.type }
                });
                // ⭐ 성공적으로 올라간 파일의 진짜 주소를 '전역 메모장'에 영구 기록
                globalUrlMapCache[urlInfo.originalName] = urlInfo.finalUrl;
            }
        });
        
        await Promise.all(uploadPromises); // 병렬 처리로 초고속 업로드
        console.log("✅ 2단계 완료: 새 파일들 클라우드 업로드 성공!");
    } else {
        console.log("⏭️ 새로 추가된 이미지가 없어 S3 업로드를 건너뜁니다! (트래픽 방어 성공 🛡️)");
    }


    // ==============================================================================
    // 3. 정제된 최종 JSON 데이터 조립
    // ==============================================================================
    console.log("📄 3단계: 최종 데이터 백엔드 전송 준비...");

    // URL 치환 헬퍼 함수
    const cleanUrl = (url) => {
        if (!url) return null;
        if (blobToFileName[url]) return blobToFileName[url]; 
        if (typeof url === 'string' && url.includes('undefined')) return null;
        return url; 
    };

    const getCleanNameOrUrl = (img) => {
        if (img.file) return img.file.name; 
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
            bgImage: state.startMenu?.bgImage?.file ? state.startMenu.bgImage.file.name : state.startMenu?.bgImage?.preview || null
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
            url: f.file ? f.file.name : f.url 
        })) || []
    };

    // --- 최종 백엔드 전송 ---
    // 기존의 FormData 방식(파일 첨부)을 버리고, 가벼운 JSON 전송 방식으로 변경
    const response = await axios.post(`${API_URL}/save`, {
        projectId,
        gameData: JSON.stringify(gameData),
        htmlContent: htmlString,
        // ⭐ 핵심: 백엔드에게 '이번 세션에서 올라간 모든 파일의 진짜 URL 지도'를 넘겨줌
        urlMap: globalUrlMapCache 
    });
    
    console.log("🎉 저장 대성공!");
    return response.data;
};