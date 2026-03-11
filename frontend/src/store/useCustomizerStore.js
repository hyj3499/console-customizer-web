// src/store/useCustomizerStore.js
import { create } from 'zustand';

const useCustomizerStore = create((set) => ({
    // --- 1단계 상태 ---
    color: '',
    setColor: (color) => set({ color }),

// --- 2단계 상태 ---
    protagonist: { name: '', images: [] }, // images 안에는 { file, preview } 가 들어감
    setProtagonist: (protagonist) => set({ protagonist }),
    
    pFontStyle: { 
        font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
        dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)',
        nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)',
        portraitStyle: 'square', portraitColor: '#ffffff'
    },
    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),

    globalUi: { 
        calendarFrame: 'retro',
        calendarColor: 'rgba(255,182,193,0.8)',
        calendarTextColor: '#5C4033',
        calendarTextUseOutline: true,
        calendarTextOutlineColor: '#ffffff',
        systemFont: 'Pretendard', 
        cursor: 'default', 
        saveLoadStyle: 'modern' 
    },
    setGlobalUi: (ui) => set((state) => ({ globalUi: { ...state.globalUi, ...ui } })),

    customBackgrounds: [],
    // bg 객체에 { id, name, url, file } 전체가 저장되도록 함
    addCustomBackground: (bg) => set((state) => ({ customBackgrounds: [...state.customBackgrounds, bg] })),
    
    characters: [
        { 
            id: Date.now(), 
            name: '', 
            images: [], // { file, preview } 형태
            fontStyle: { 
                font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
                dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)',
                nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
            } 
        }
    ],
    setCharacters: (chars) => set({ characters: chars }),

    // ⭐ 수정: 커스텀 폰트 저장 시 'file' 객체 추가
    customFonts: [], 
    addCustomFont: (fontName, url, file) => set((state) => ({ 
        customFonts: [...state.customFonts, { name: fontName, url, file }] 
    })),

    // --- 3단계: 무한 이벤트 에디터 상태 ---
    events: [
        { 
            id: 1, title: '이벤트 1', 
            bgm: null, // ⭐ 나중에 { file, url } 형태로 저장하면 더 좋습니다.
            baseDate: { month: 'JAN', day: '01', time: '12:00' }, 
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

    // 4단계
    startMenu: {
        bgImage: null, // { file, preview }
        menuPos: { x: 50, y: 70 }, // % 단위 좌표
        boxStyle: {
            frame: 'simple',
            color: 'rgba(0,0,0,0.5)',
            padding: 20,
            borderRadius: 8
        },
        textStyle: {
            fontSize: 40,
            color: '#ffffff'
        }
    },
    setStartMenu: (data) => set((state) => ({ 
        startMenu: { ...state.startMenu, ...data } 
    }))
}));

export default useCustomizerStore;