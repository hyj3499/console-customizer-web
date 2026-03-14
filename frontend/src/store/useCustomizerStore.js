// src/store/useCustomizerStore.js
import { create } from 'zustand';

const useCustomizerStore = create((set) => ({

    // ⭐ 1. 새 프로젝트 (모든 상태를 초기 기본값으로 완벽하게 덮어쓰기)
    resetStore: () => set({
        color: '',
        protagonist: { name: '', images: [] },
        pFontStyle: { 
            font: '', color: '#ffffff', useOutline: false, outline: '#000000', 
            dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', dialogBorderColor: '#dddddd', 
            nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)', nameBorderColor: '#dddddd', 
            portraitStyle: 'square', portraitColor: '#ffffff', portraitBorderColor: '#dddddd',
            typingSound: 'type1'
        },
        globalUi: { 
            calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033',
            calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', 
            cursor: 'default', saveLoadStyle: 'modern' 
        },
        customBackgrounds: [],
        customFonts: [],
        characters: [
            { 
                id: Date.now(), name: '', images: [], 
                fontStyle: { 
                    font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
                    dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
                } 
            }
        ],
        events: [{ 
            id: 1, title: '이벤트 1', bgm: null, baseDate: { month: 'JAN', day: '01', time: '12:00' },
            scenarios: [{ type: 'dialog', branch: 'main', speaker: 'PROTAGONIST', protagonistImage: null, heroineImage: null, text: '', bgImage: null, bgType: 'bg_school', dateOverride: null }] 
        }],
        activeEventId: 1,
        showPreview: false,
        previewScenario: null,
        startMenu: {
            bgImage: null, menuPos: { x: 50, y: 70 },
            boxStyle: { frame: 'simple', color: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 8 },
            textStyle: { fontSize: 40, color: '#ffffff' }
        }
    }),

    // ⭐ 2. 프로젝트 파일 불러오기 (기존 데이터 무시하고 덮어쓰기)
    loadProjectData: (loadedData) => set((state) => ({
        ...state,         
        ...loadedData,    
        activeEventId: loadedData.events?.[0]?.id || 1, 
        showPreview: false,
        previewScenario: null
    })),
    
    // --- 1단계 상태 ---
    color: '',
    setColor: (color) => set({ color }),

    // --- 2단계 상태 ---
    protagonist: { name: '', images: [] }, // images 안에는 { file, preview } 가 들어감
    setProtagonist: (protagonist) => set({ protagonist }),
    
    pFontStyle: { 
        font: '', color: '#ffffff', useOutline: false, outline: '#000000', 
        dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', dialogBorderColor: '#dddddd', 
        nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)', nameBorderColor: '#dddddd', 
        portraitStyle: 'square', portraitColor: '#ffffff', portraitBorderColor: '#dddddd',
        typingSound: 'type1' 
    },
    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),

    globalUi: { 
        calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033',
        calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', 
        cursor: 'default', saveLoadStyle: 'modern' 
    },
    setGlobalUi: (ui) => set((state) => ({ globalUi: { ...state.globalUi, ...ui } })),

    customBackgrounds: [],
    addCustomBackground: (bg) => set((state) => ({ customBackgrounds: [...state.customBackgrounds, bg] })),
    
    characters: [
        { 
            id: Date.now(), name: '', images: [], 
            fontStyle: { 
                font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
                dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
            } 
        }
    ],
    setCharacters: (chars) => set({ characters: chars }),

    customFonts: [], 
    addCustomFont: (fontName, url, file) => set((state) => {
        // ⭐ [수정] 이미 똑같은 이름의 폰트가 스토어에 있다면 추가하지 않고 무시함 (중복 방지)
        if (state.customFonts.some(f => f.name === fontName)) return state;
        return { customFonts: [...state.customFonts, { name: fontName, url, file }] };
    }), 

    // --- 3단계: 무한 이벤트 에디터 상태 ---
    events: [
        { 
            id: 1, title: '이벤트 1', bgm: null, baseDate: { month: 'JAN', day: '01', time: '12:00' }, 
            scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '', bgImage: null, bgType: 'bg_school', dateOverride: null }] 
        }
    ],
    setEvents: (events) => set({ events }),

    activeEventId: 1,
    setActiveEventId: (id) => set({ activeEventId: id }),

    showPreview: false,
    setShowPreview: (show) => set({ showPreview: show }),

    previewScenario: null,
    setPreviewScenario: (scenario) => set({ previewScenario: scenario }),

    // --- 4단계: 시작 메뉴 ---
    startMenu: {
        bgImage: null, menuPos: { x: 50, y: 70 },
        boxStyle: { frame: 'simple', color: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 8 },
        textStyle: { fontSize: 40, color: '#ffffff' }
    },
    setStartMenu: (data) => set((state) => ({ 
        startMenu: { ...state.startMenu, ...data } 
    }))
}));

export default useCustomizerStore;