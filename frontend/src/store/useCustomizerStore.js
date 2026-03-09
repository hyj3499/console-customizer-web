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

    // 등장인물 배열 상태
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

    // --- 3단계 상태 ---
    background: null,
    setBackground: (background) => set({ background }),

    currentBranch: 'main',
    setCurrentBranch: (branch) => set({ currentBranch: branch }),

    scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '' }],
    setScenarios: (scenarios) => set({ scenarios }),
}));

export default useCustomizerStore;