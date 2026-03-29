// ==============================================================================
// 📄 파일 경로 : frontend/src/services/ProjectService.js
// 🎯 주요 역할 : 백엔드와 통신하며, 파일을 R2 클라우드에 직접 업로드하는 API 계층
// ==============================================================================

import axios from 'axios';
import useCustomizerStore from '../store/useCustomizerStore';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api/projects' : '/api/projects';

// ⭐ [트래픽 방어] 지문(Fingerprint) 기반 전역 캐시
const globalFingerprintCache = {}; 

// 💡 1. 파일 내용 기반 지문 생성 (똑같은 파일은 무조건 1개로 취급)
const getFileFingerprint = (file, projectId) => {
    if (!file) return "no_file_" + Date.now();
    const name = file.name || "unknown";
    const size = file.size || 0;
    const lastModified = file.lastModified || 0;
    return `${projectId}_${size}_${lastModified}_${name}`.replace(/\s+/g, '_');
};

const generateSafeName = (input) => {
    let name = (input && input.name) ? input.name : (typeof input === 'string' ? input : "unnamed_file");
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
    const blobToFingerprint = {};  
    const filesToUpload = [];   

    const collectFile = (item) => {
        const file = item?.file;
        const url = item?.preview || item?.url;
        if (file && url) {
            const fingerprint = getFileFingerprint(file, projectId);
            blobToFingerprint[url] = fingerprint;
            if (!filesToUpload.some(f => f.fingerprint === fingerprint)) {
                filesToUpload.push({ file, fingerprint, originalName: generateSafeName(file) });
            }
        }
    };

    // ==============================================================================
    // 1. 모든 물리적 파일 긁어모으기
    // ==============================================================================
state.characters?.forEach(c => {
        c.portraitImages?.forEach(collectFile);
        c.standingImages?.forEach(collectFile);
    });
    
    state.customBackgrounds?.forEach(collectFile);
    state.customFonts?.forEach(collectFile);

    state.events?.forEach(event => {
        if (event.bgmFile && event.bgm?.startsWith('blob:')) {
            const fp = getFileFingerprint(event.bgmFile, projectId);
            blobToFingerprint[event.bgm] = fp;
            if (!filesToUpload.some(f => f.fingerprint === fp)) {
                filesToUpload.push({ file: event.bgmFile, fingerprint: fp, originalName: generateSafeName(event.bgmFile) });
            }
        }
        event.scenarios?.forEach(sc => {
            if (sc.file) {
                const fp = getFileFingerprint(sc.file, projectId);
                if (sc.src?.startsWith('blob:')) blobToFingerprint[sc.src] = fp;
                if (sc.bgImage?.startsWith('blob:')) blobToFingerprint[sc.bgImage] = fp;
                if (!filesToUpload.some(f => f.fingerprint === fp)) {
                    filesToUpload.push({ file: sc.file, fingerprint: fp, originalName: generateSafeName(sc.file) });
                }
            }
        });
    });

    if (state.startMenu?.bgImage) collectFile(state.startMenu.bgImage);
    if (state.startMenu?.bgm) collectFile(state.startMenu.bgm);

    console.log("🚀 클라우드 저장 프로세스 시작...");
    
    // 지문 -> 최종 클라우드 URL 변환 지도
    const fingerprintToFinalUrl = {}; 
    const filesToActuallyUpload = [];

    filesToUpload.forEach(item => {
        if (globalFingerprintCache[item.fingerprint]) {
            fingerprintToFinalUrl[item.fingerprint] = globalFingerprintCache[item.fingerprint];
        } else {
            filesToActuallyUpload.push(item);
        }
    });

    if (filesToActuallyUpload.length > 0) {
        console.log(`📡 1단계: 서버에 새 파일 ${filesToActuallyUpload.length}개의 업로드 권한 요청...`);
        
        // 이름이 겹치지 않게 클라우드에 '지문_이름' 형태로 안전하게 저장!
const filesInfo = filesToActuallyUpload.map(item => ({ 
    name: item.fingerprint, // 👈 이렇게만 해도 충분히 안전합니다.
    type: item.file.type 
}));
        
        const urlResponse = await axios.post(`${API_URL}/presigned`, { projectId, filesInfo });
        const { urls } = urlResponse.data;

        console.log("🚀 2단계: R2 클라우드로 파일 다이렉트 업로드 시작!");
        const uploadPromises = urls.map(async (urlInfo) => {
            const item = filesToActuallyUpload.find(f => f.fingerprint === urlInfo.originalName);
            if (item) {
                await axios.put(urlInfo.uploadUrl, item.file, { headers: { 'Content-Type': item.file.type } });
                globalFingerprintCache[item.fingerprint] = urlInfo.finalUrl;
                fingerprintToFinalUrl[item.fingerprint] = urlInfo.finalUrl;
            }
        });
        await Promise.all(uploadPromises);
        console.log("✅ 2단계 완료!");
    } else {
        console.log("⏭️ 새로 올릴 파일이 없습니다! (중복 제거 완료)");
    }

    // ==============================================================================
    // 2. 정제된 최종 JSON 데이터 조립 (프론트에서 직접 URL 맵핑)
    // ==============================================================================
    console.log("📄 3단계: JSON 데이터 조립...");

// 💡 2. 가장 중요한 마법! 동일한 지문의 파일은 모두 같은 클라우드 URL로 배급!
    const getCleanUrl = (item) => {
        if (!item) return null;

        // URL 추출 (순수 문자열이거나 객체 안의 preview/url 둘 다 지원)
        const url = typeof item === 'string' ? item : (item.preview || item.url);

        if (!url) return null;
        if (url.includes('undefined')) return null;
        if (url.startsWith('data:')) return null; // Base64 텍스트 찌꺼기 차단

        // 1) 직접 업로드한 파일 (blob:) -> 클라우드 주소로 변환
        if (url.startsWith('blob:')) {
            const fp = blobToFingerprint[url];
            if (fp && fingerprintToFinalUrl[fp]) {
                return fingerprintToFinalUrl[fp]; 
            }
            return null; // 아직 업로드 안됐거나 에러난 경우
        }
        
        // 2) 기본 제공 프리셋 경로나 이미 업로드된 클라우드 주소 (https://...) -> 경로 그대로 보존!
        return url;
    };
    
    const eventsToSave = JSON.parse(JSON.stringify(state.events || []));
    eventsToSave.forEach(event => {
        event.bgm = getCleanUrl(event.bgm); 
        delete event.bgmFile; 
        event.scenarios?.forEach(sc => {
            sc.protagonistImage = getCleanUrl(sc.protagonistImage);
            sc.heroineImage = getCleanUrl(sc.heroineImage);
            sc.bgImage = getCleanUrl(sc.bgImage);
            sc.src = getCleanUrl(sc.src);
        });
    });

    const gameData = {
        selectedMode: state.selectedMode,
        narrationFontStyle: state.narrationFontStyle, 
        globalUi: state.globalUi, 
        startMenu: {
            ...state.startMenu,
            bgImage: getCleanUrl(state.startMenu?.bgImage),
            bgm: getCleanUrl(state.startMenu?.bgm)
        },
characters: state.characters?.map(c => ({
            id: c.id,
            isProtagonist: c.isProtagonist || false,
            name: c.name,
            portraitImages: c.portraitImages?.map(getCleanUrl).filter(Boolean) || [],
            standingImages: c.standingImages?.map(getCleanUrl).filter(Boolean) || [],
            fontStyle: c.fontStyle
        })) || [],
        events: eventsToSave,
        customFonts: state.customFonts?.map(f => ({ name: f.name, url: getCleanUrl(f.url) }))
    };

    const response = await axios.post(`${API_URL}/save`, {
        projectId,
        gameData: JSON.stringify(gameData),
        htmlContent: htmlString,
        urlMap: {} 
    });
    
    return response.data;
};