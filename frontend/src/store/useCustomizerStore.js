// src/store/useCustomizerStore.js
import { create } from 'zustand';

const useCustomizerStore = create((set) => ({
    // --- 1단계 상태 ---
    color: '',
    setColor: (color) => set({ color }),

    // --- 2단계 상태 ---
    protagonist: { name: '', images: [] },
    setProtagonist: (protagonist) => set({ protagonist }),
    
    // ⭐ 주인공 전용 스타일에 초상화 옵션 추가 (portraitStyle, portraitColor)
    pFontStyle: { 
        font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
        dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)',
        nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)',
        portraitStyle: 'square', portraitColor: '#ffffff' // <-- 추가됨!
    },
    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),

globalUi: { 
        calendarFrame: 'retro',
        calendarColor: 'rgba(255,182,193,0.8)',
        calendarTextColor: '#5C4033',
        // ⭐ 새로 추가된 달력 글자 외곽선 상태
        calendarTextUseOutline: true,
        calendarTextOutlineColor: '#ffffff',
        
        systemFont: 'Pretendard', 
        cursor: 'default', 
        saveLoadStyle: 'modern' 
    },
    setGlobalUi: (ui) => set((state) => ({ globalUi: { ...state.globalUi, ...ui } })),
    // 등장인물 배열 상태
    // ⭐ 새로 추가: 커스텀 배경 보관함
    customBackgrounds: [],
    addCustomBackground: (bg) => set((state) => ({ customBackgrounds: [...state.customBackgrounds, bg] })),
    
    characters: [
        { 
            id: Date.now(), 
            name: '', 
            images: [], 
            fontStyle: { 
                font: 'Pretendard', color: '#EBEBEB', useOutline: false, outline: '#000000',
                dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)',
                nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
            } 
        }
    ],
    setCharacters: (chars) => set({ characters: chars }),

    // 업로드된 커스텀 폰트 목록
    customFonts: [], 
    addCustomFont: (fontName, url) => set((state) => ({ 
        customFonts: [...state.customFonts, { name: fontName, url }] 
    })),

// ==========================================
    // --- ⭐ 3단계: 무한 이벤트 에디터 상태 ---
    // ==========================================
    events: [
        { 
            id: 1, title: '이벤트 1', bgm: null, 
            // ⭐ 이벤트 시작 기준 날짜 추가
            baseDate: { month: 'OCT', day: '12', time: '14:30' }, 
            scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '', bgImage: null, dateOverride: null }] 
        },
        { 
            id: 2, title: '이벤트 2', bgm: null, 
            baseDate: { month: 'OCT', day: '13', time: '09:00' }, 
            scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '', bgImage: null, dateOverride: null }] 
        },
        { 
            id: 3, title: '이벤트 3', bgm: null, 
            baseDate: { month: 'OCT', day: '14', time: '18:00' }, 
            scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '', bgImage: null, dateOverride: null }] 
        }
    ],
    setEvents: (events) => set({ events }),

    // 현재 편집 중인 이벤트의 ID
    activeEventId: 1,
    setActiveEventId: (id) => set({ activeEventId: id }),

    // 대사 미리보기 토글 상태
    showPreview: false,
    setShowPreview: (show) => set({ showPreview: show }),

    // 현재 미리보기를 띄울 대사 데이터
    previewScenario: null,
    setPreviewScenario: (scenario) => set({ previewScenario: scenario }),
}));

export default useCustomizerStore;