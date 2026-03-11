// ==============================================================================
// 📄 파일 경로 : frontend/src/services/ProjectService.js
// 🎯 주요 역할 : 백엔드 서버(Node.js)와 통신하여 게임 데이터를 저장/생성하는 'API 서비스 계층'
//
// 💡 상세 기능 :
//   1. saveProjectToServer: 사용자가 입력한 ID/PW로 서버에 새 프로젝트(폴더) 생성을 요청.
//   2. uploadAndSaveProject: 
//      - Zustand 스토어에 흩어진 모든 설정과 대사 데이터를 긁어모음.
//      - 브라우저에만 있는 임시 주소(blob)를 찾아 진짜 '파일명'으로 교체 예약.
//      - 과거 데이터의 잔재인 'undefined' 유령 주소들을 찾아내어 일괄 삭제(정제).
//      - 최종적으로 정제된 JSON 데이터와 실제 파일들을 FormData에 담아 서버로 전송.
// ==============================================================================

import axios from 'axios';
import useCustomizerStore from '../store/useCustomizerStore';

const API_URL = '/api/projects'; 

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
    const formData = new FormData();

    formData.append('projectId', projectId);
    if (htmlString) formData.append('htmlContent', htmlString);

    const blobToFileName = {};  
    const filesToUpload = [];   

    // --------------------------------------------------------
    // 1. 파일 수집 헬퍼 함수
    // --------------------------------------------------------
    const collectFile = (item) => {
        const file = item?.file;
        const url = item?.preview || item?.url;
        
        // ✅ 조건 완화: 파일 객체가 존재한다면 일단 수집합니다.
        // (blob: 뿐만 아니라 data:base64 형태의 preview를 가진 파일도 모두 수집)
        if (file && url) {
            blobToFileName[url] = file.name;
            filesToUpload.push(file);
            console.log("📌 수집된 파일:", file.name); // 브라우저 콘솔에서 확인
        }
    };
    // --------------------------------------------------------
    // 2. 모든 물리적 파일(이미지, 배경, 폰트) 긁어모으기
    // --------------------------------------------------------
    state.protagonist?.images?.forEach(collectFile);
    state.characters?.forEach(c => c.images?.forEach(collectFile));
    state.customBackgrounds?.forEach(collectFile);
    
    // ✅ 커스텀 폰트 파일 수집 (사용자가 업로드한 모든 폰트 파일 바구니에 담기)
    state.customFonts?.forEach(collectFile);

    state.events?.forEach(event => {
        event.scenarios?.forEach(sc => {
            if (sc.file) {
                if (sc.src?.startsWith('blob:')) blobToFileName[sc.src] = sc.file.name;
                if (sc.bgImage?.startsWith('blob:')) blobToFileName[sc.bgImage] = sc.file.name;
                filesToUpload.push(sc.file);
            }
        });
    });
    // 1. 배경 이미지 수집
    if (state.startMenu?.bgImage) {
        collectFile(state.startMenu.bgImage);
    }

    // --------------------------------------------------------
    // 3. 데이터 정제 헬퍼 함수
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // 4. 데이터 깊은 복사 및 경로 정제 (Events)
    // --------------------------------------------------------
    const eventsToSave = JSON.parse(JSON.stringify(state.events || []));
    eventsToSave.forEach(event => {
        event.scenarios?.forEach(sc => {
            sc.protagonistImage = cleanUrl(sc.protagonistImage);
            sc.heroineImage = cleanUrl(sc.heroineImage);
            sc.bgImage = cleanUrl(sc.bgImage);
            sc.src = cleanUrl(sc.src);
        });
    });

    // --------------------------------------------------------
    // 5. 최종 JSON 데이터 조립 (폰트 이름 유지 및 폰트 리스트 포함)
    // --------------------------------------------------------
    const gameData = {
            selectedMode: state.selectedMode,
            pFontStyle: state.pFontStyle, 
            globalUi: state.globalUi, 

            // ✅ [추가] 시작 메뉴 설정 저장
            startMenu: {
                ...state.startMenu,
                // 배경 이미지가 새로 업로드된 파일이면 파일명으로, 
                // 프리셋(URL)이면 URL 그대로 저장
                bgImage: state.startMenu?.bgImage?.file 
                    ? state.startMenu.bgImage.file.name 
                    : state.startMenu?.bgImage?.preview || null
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
    // --------------------------------------------------------
    // 6. 서버 전송
    // --------------------------------------------------------
    formData.append('gameData', JSON.stringify(gameData));
    
    // ✅ 중복 제거 로직 수정: 파일 이름을 키로 사용하여 폰트 파일이 누락되지 않게 함
    const finalFiles = [];
    const seenNames = new Set();

    filesToUpload.forEach(file => {
        if (file && !seenNames.has(file.name)) {
            seenNames.add(file.name);
            finalFiles.push(file);
        }
    });

    console.log("📤 서버로 보낼 파일 목록:", finalFiles.map(f => f.name)); // 터미널 콘솔 확인용

    finalFiles.forEach(file => {
        formData.append('files', file); 
    });

    const response = await axios.post(`${API_URL}/save`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
};