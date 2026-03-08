// src/store/useCustomizerStore.js
import { create } from 'zustand';

const useCustomizerStore = create((set) => ({
    // --- 1단계 상태 ---
    color: '',
    setColor: (color) => set({ color }),

    // --- 2단계 상태 ---
    protagonist: { name: '', images: [] },
    setProtagonist: (protagonist) => set({ protagonist }),
    
    heroine: { name: '', images: [] },
    setHeroine: (heroine) => set({ heroine }),
    
    // 주인공 전용 스타일
    pFontStyle: { font: 'Pretendard', color: '#EBEBEB', outline: '#000000' },
    // 히로인 전용 스타일
    hFontStyle: { font: 'Pretendard', color: '#EBEBEB', outline: '#000000' },
    
    // 업로드된 커스텀 폰트 목록
    customFonts: [], 

    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),
    setHFontStyle: (style) => set((state) => ({ hFontStyle: { ...state.hFontStyle, ...style } })),
    addCustomFont: (fontName, url) => set((state) => ({ 
        customFonts: [...state.customFonts, { name: fontName, url }] 
    })),


    // --- 3단계 상태 ---
    background: null,
    setBackground: (background) => set({ background }),

    /*favorabilityShape: 'heart',
    setFavorabilityShape: (shape) => set({ favorabilityShape: shape }),
    
    favorabilityColor: '#ff8787',
    setFavorabilityColor: (color) => set({ favorabilityColor: color }),*/

    currentBranch: 'main',
    setCurrentBranch: (branch) => set({ currentBranch: branch }),

    scenarios: [{ type: 'dialog', branch: 'main', speaker: '', protagonistImage: null, heroineImage: null, text: '' }],
    setScenarios: (scenarios) => set({ scenarios }),
}));

export default useCustomizerStore;