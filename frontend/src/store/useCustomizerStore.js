import { create } from 'zustand';

// ==============================================================================
// 🌟 1. 초기 상태(Initial State) 청사진 정의
// 객체 참조 오류를 막고 Date.now()를 매번 새로 갱신하기 위해 함수 형태로 작성합니다.
// ==============================================================================
const getInitialState = () => ({
    isEditing: false,
    color: '',
    
    // 😎 주인공 설정
    protagonist: { 
        name: '주인공', 
        images: [] 
    },
    pFontStyle: { 
        font: 'Galmuri14', 
        color: '#ffffff', 
        useOutline: true, 
        outline: '#000000', 
        dialogFrame: 'retro', 
        dialogColor: 'rgba(173,216,230,0.8)', // 연한 블루
        dialogBorderColor: '#dddddd', 
        nameFrame: 'simple', 
        nameColor: 'rgba(255, 182, 193, 0)', // 투명
        nameBorderColor: '#dddddd', 
        portraitStyle: 'retro', 
        portraitColor: 'rgba(173,216,230,0.8)', 
        portraitBorderColor: '#dddddd', 
        typingSound: 'type4', 
        useNameBorder: false 
    },

    // 🎮 전역 UI 설정
    globalUi: { 
        calendarFrame: 'retro', 
        calendarColor: 'rgba(255,182,193,0.8)', 
        calendarTextColor: '#000000', 
        calendarTextUseOutline: true, 
        calendarTextOutlineColor: '#ffffff', 
        systemFont: 'Galmuri14', 
        cursor: 'default', 
        saveLoadStyle: 'modern', 
        layoutMode: 'classic' 
    },

    customBackgrounds: [],
    customFonts: [],

    // 🎭 등장인물 설정
    characters: [
        { 
            id: Date.now(), 
            name: '등장인물 1', 
            images: [], 
            fontStyle: { 
                font: 'Galmuri14', 
                color: '#ffffff', 
                useOutline: true, 
                outline: '#7d1212', 
                dialogFrame: 'retro', 
                dialogColor: 'rgba(0,0,0,0.8)', // 블랙
                nameFrame: 'gothic', 
                nameColor: 'rgba(0, 0, 0, 0.15)', 
                useNameBorder: false, 
                typingSound: 'type3' 
            } 
        }
    ],

    // 📅 이벤트 및 시나리오 설정
    events: [
        { 
            id: 1, 
            title: '이벤트 1', 
            bgm: null, 
            baseDate: { 
                month: 'DATE: 02月 20日', 
                day: '01日', 
                time: 'TIME: AM 12:00' 
            }, 
            scenarios: [
                { 
                    type: 'dialog', 
                    branch: 'main', 
                    speaker: 'PROTAGONIST', 
                    protagonistImage: null, 
                    heroineImage: null, 
                    text: '', 
                    bgImage: null, 
                    bgType: 'bg_school', 
                    dateOverride: null, 
                    src: null 
                }
            ] 
        }
    ],

    activeEventId: 1,
    showPreview: false,
    previewScenario: null,

    // 🏠 스타트 메뉴 설정
    startMenu: {
        bgImage: null,
        bgm: null,
        title: { 
            text: '최애로운 생활', 
            x: 50, y: 30, 
            fontSize: 8, 
            color: '#ffffff', 
            font: 'Galmuri14', 
            useOutline: true, 
            outlineColor: '#000000' 
        },
        menu: { 
            x: 50, y: 75, 
            fontSize: 4, 
            color: '#ffffff', 
            font: 'Galmuri14', 
            useOutline: true, 
            outlineColor: '#000000', 
            bgColor: '#000000', 
            bgOpacity: 0.5, 
            padding: 20, 
            useBorder: false, 
            borderColor: '#ffffff' 
        }
    }
});
// ==============================================================================
// 🎮 2. Zustand 스토어 생성
// ==============================================================================
const useCustomizerStore = create((set) => ({
    // ✨ 앱 실행 시 초기 상태를 펼쳐서 세팅
    ...getInitialState(),

    // ⭐ 새 프로젝트 (초기화): 청사진 함수를 다시 호출하여 깨끗한 상태로 덮어씌움
    resetStore: () => set(getInitialState()),

    // ⭐ 프로젝트 파일 불러오기
    loadProjectData: (loadedData) => set((state) => ({
        ...state,         
        ...loadedData,    
        isEditing: true,
        activeEventId: loadedData.events?.[0]?.id || 1, 
        showPreview: false,
        previewScenario: null
    })),
    
    // --- Setter 함수들 ---
    setIsEditing: (bool) => set({ isEditing: bool }),
    setColor: (color) => set({ color }),
    setProtagonist: (protagonist) => set({ protagonist }),
    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),
    setGlobalUi: (ui) => set((state) => ({ globalUi: { ...state.globalUi, ...ui } })),
    addCustomBackground: (bg) => set((state) => ({ customBackgrounds: [...state.customBackgrounds, bg] })),
    setCharacters: (chars) => set({ characters: chars }),
    
    addCustomFont: (fontName, url, file) => set((state) => {
        if (state.customFonts.some(f => f.name === fontName)) return state;
        return { customFonts: [...state.customFonts, { name: fontName, url, file }] };
    }), 
    
    setEvents: (events) => set({ events }),
    setActiveEventId: (id) => set({ activeEventId: id }),
    setShowPreview: (show) => set({ showPreview: show }),
    setPreviewScenario: (scenario) => set({ previewScenario: scenario }),
    setStartMenu: (data) => set((state) => ({ 
        startMenu: { ...state.startMenu, ...data } 
    }))
}));

export default useCustomizerStore;