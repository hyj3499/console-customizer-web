import axios from 'axios';
import useCustomizerStore from '../store/useCustomizerStore';

const API_URL = '/api/projects'; 

export const saveProjectToServer = async (id, pw) => {
    try {
        const response = await axios.post(`${API_URL}/create`, { id, pw });
        return response.data;
    } catch (error) {
        console.error("계정 생성 중 오류:", error);
        throw error;
    }
};

export const uploadAndSaveProject = async (projectId, htmlString) => {
    const state = useCustomizerStore.getState();
    const formData = new FormData();

    formData.append('projectId', projectId);
    if (htmlString) {
        formData.append('htmlContent', htmlString);
    }

    // ⭐ 1. 임시 주소(blob)를 실제 파일명으로 번역해줄 사전(Map) 만들기
    const blobToFileName = {};
    const mapBlob = (imgObj) => {
        if (imgObj && imgObj.file) {
            blobToFileName[imgObj.preview] = imgObj.file.name;
        }
    };

    // 현재 스토어에 있는 모든 이미지의 번역본을 사전에 등록합니다.
    state.customBackgrounds.forEach(mapBlob);
    state.protagonist.images.forEach(mapBlob);
    state.characters.forEach(c => c.images.forEach(mapBlob));

    // ⭐ 2. 대사 스크립트(events) 원본을 복사해서 blob 주소를 파일명으로 갈아끼우기
    const eventsToSave = JSON.parse(JSON.stringify(state.events));
    
    eventsToSave.forEach(event => {
        event.scenarios.forEach(sc => {
            // 사전에 등록된 blob 주소가 있다면, 진짜 파일명으로 교체!
            if (sc.protagonistImage && blobToFileName[sc.protagonistImage]) {
                sc.protagonistImage = blobToFileName[sc.protagonistImage];
            }
            if (sc.heroineImage && blobToFileName[sc.heroineImage]) {
                sc.heroineImage = blobToFileName[sc.heroineImage];
            }
            if (sc.bgImage && blobToFileName[sc.bgImage]) {
                sc.bgImage = blobToFileName[sc.bgImage];
            }
            if (sc.isCg && sc.src && blobToFileName[sc.src]) {
                sc.src = blobToFileName[sc.src];
            }
        });
    });

    // ⭐ 3. 치환이 완료된 이벤트를 포함하여 gameData 조립
    const gameData = {
        selectedMode: state.selectedMode,
        pFontStyle: state.pFontStyle,
        globalUi: state.globalUi,

        protagonist: {
            name: state.protagonist.name,
            images: state.protagonist.images.map(img => img.file ? img.file.name : (img.url || img.preview))
        },

        characters: state.characters.map(c => ({
            id: c.id,
            name: c.name,
            fontStyle: c.fontStyle,
            images: c.images.map(img => img.file ? img.file.name : (img.url || img.preview))
        })),

        // ⭐ 여기 수정
        events: eventsToSave
    };

    formData.append('gameData', JSON.stringify(gameData));

    // 4. 실제 이미지 파일 담기
    const appendFile = (imgObj) => {
        if (imgObj && imgObj.file) formData.append('files', imgObj.file);
    };

    state.customBackgrounds.forEach(appendFile);
    state.protagonist.images.forEach(appendFile);
    state.characters.forEach(char => char.images.forEach(appendFile));

    try {
        const response = await axios.post(`${API_URL}/save`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("클라우드 저장 실패:", error);
        throw error;
    }
};