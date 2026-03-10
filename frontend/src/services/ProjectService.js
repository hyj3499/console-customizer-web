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

// --------------------------------------------------------
// ⭐ 1. 새 프로젝트(계정) 생성 함수
// --------------------------------------------------------
export const saveProjectToServer = async (id, pw) => {
    try {
        const response = await axios.post(`${API_URL}/create`, { id, pw });
        return response.data;
    } catch (error) {
        console.error("❌ 계정 생성 중 오류:", error);
        throw error;
    }
};

// --------------------------------------------------------
// ⭐ 2. 통합 데이터 및 이미지 클라우드 저장 함수
// --------------------------------------------------------
export const uploadAndSaveProject = async (projectId, htmlString) => {
    const state = useCustomizerStore.getState();
    const formData = new FormData();

    // 1) 기본 저장 정보 세팅
    formData.append('projectId', projectId);
    if (htmlString) formData.append('htmlContent', htmlString);

    const blobToFileName = {};  // 임시 주소(blob)와 실제 파일명(name)을 짝지어줄 사전
    const filesToUpload = [];   // 서버로 전송할 실제 파일 객체들 담는 바구니

    // [헬퍼 함수] 이미지가 진짜 '파일'을 가지고 있다면 사전에 등록하고 바구니에 담기
    const collectFile = (imgObj) => {
        if (imgObj?.file && imgObj?.preview) {
            blobToFileName[imgObj.preview] = imgObj.file.name;
            filesToUpload.push(imgObj.file);
        }
    };

    // 2) 모든 스토어 데이터에서 물리적 파일(새로 올린 파일) 긁어모으기
    state.protagonist?.images?.forEach(collectFile);
    state.characters?.forEach(c => c.images?.forEach(collectFile));
    state.customBackgrounds?.forEach(collectFile);

    // 3) 대사창(Events) 내부의 CG 및 커스텀 배경 파일 수집
    state.events?.forEach(event => {
        event.scenarios?.forEach(sc => {
            if (sc.file) {
                // src 또는 bgImage가 blob 임시 주소라면 사전에 기록
                if (sc.src?.startsWith('blob:')) blobToFileName[sc.src] = sc.file.name;
                if (sc.bgImage?.startsWith('blob:')) blobToFileName[sc.bgImage] = sc.file.name;
                filesToUpload.push(sc.file);
            }
        });
    });

    // [헬퍼 함수] 임시 주소(blob)는 파일명으로 바꾸고, 유령 주소(undefined)는 지워주는 청소기
    const cleanUrl = (url) => {
        if (!url) return null;
        if (blobToFileName[url]) return blobToFileName[url]; // 서버가 인식할 파일명으로 치환
        if (typeof url === 'string' && url.includes('undefined')) return null; // 찌꺼기 삭제
        return url; // 정상적인 클라우드 주소(https://...)는 그대로 통과
    };

    // 4) 이벤트(대사) 데이터 깊은 복사 후 주소 대청소 진행
    const eventsToSave = JSON.parse(JSON.stringify(state.events || []));
    eventsToSave.forEach(event => {
        event.scenarios?.forEach(sc => {
            // 모든 이미지 경로에 청소기(cleanUrl) 가동
            sc.protagonistImage = cleanUrl(sc.protagonistImage);
            sc.heroineImage = cleanUrl(sc.heroineImage);
            sc.bgImage = cleanUrl(sc.bgImage);
            sc.src = cleanUrl(sc.src);
        });
    });

    // [헬퍼 함수] 캐릭터/주인공 이미지 배열용 청소기
    const getCleanNameOrUrl = (img) => {
        if (img.file) return img.file.name; // 새 파일이면 이름 반환
        const url = img.preview || img;
        if (typeof url === 'string' && url.includes('undefined')) return null; // 찌꺼기 삭제
        return url;
    };

    // 5) 최종적으로 서버에 보낼 깨끗한 JSON 데이터 조립
    const gameData = {
        selectedMode: state.selectedMode,
        pFontStyle: state.pFontStyle,
        globalUi: state.globalUi,
        protagonist: {
            name: state.protagonist?.name || "",
            images: state.protagonist?.images?.map(getCleanNameOrUrl).filter(Boolean) || []
        },
        characters: state.characters?.map(c => ({
            ...c,
            images: c.images?.map(getCleanNameOrUrl).filter(Boolean) || []
        })) || [],
        events: eventsToSave 
    };

    // 6) 조립된 JSON 텍스트와 파일 바구니를 통째로 묶어서 서버로 발송
    formData.append('gameData', JSON.stringify(gameData));
    filesToUpload.forEach(file => formData.append('files', file));

    const response = await axios.post(`${API_URL}/save`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
};