import { create } from 'zustand';

const useCustomizerStore = create((set) => ({

    // ⭐ 1. 새 프로젝트 (초기화)
    resetStore: () => set({
        isEditing: false,
        color: '',
        protagonist: { name: '', images: [] },
        pFontStyle: { 
            font: 'Galmuri14', color: '#ffffff', useOutline: false, outline: '#000000', 
            dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', dialogBorderColor: '#dddddd', 
            nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)', nameBorderColor: '#dddddd', 
            portraitStyle: 'square', portraitColor: '#ffffff', portraitBorderColor: '#dddddd',
            typingSound: 'type1'
        },
        globalUi: { 
            calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033',
            calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Galmuri14', 
            cursor: 'default', saveLoadStyle: 'modern', 
            layoutMode: 'classic' // 🌟 레이아웃 모드 초기값
        },
        customBackgrounds: [],
        customFonts: [],
        characters: [
            { 
                id: Date.now(), name: '', images: [], 
                fontStyle: { 
                    font: 'Galmuri14', color: '#EBEBEB', useOutline: false, outline: '#000000',
                    dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
                } 
            }
        ],
        events: [{ 
            id: 1, title: '이벤트 1', bgm: null, 
            /* 📅 수정된 날짜 형식 (윗줄 전체 텍스트를 month에 담음) */
            baseDate: { month: 'DATE: 1月 01日', day: '01日', time: 'TIME: 12:00' },
            scenarios: [{ type: 'dialog', branch: 'main', speaker: 'PROTAGONIST', protagonistImage: null, heroineImage: null, text: '', bgImage: null, bgType: 'bg_school', dateOverride: null }] 
        }],
        activeEventId: 1,
        showPreview: false,
        previewScenario: null,
startMenu: {
            bgImage: null,
            bgm: null, // 🌟 스타트 메뉴 BGM ( {file, preview} 구조 )

            // 타이틀 설정 상세 데이터
            title: { 
                text: '최애로운 생활', 
                x: 50, y: 30, 
                fontSize: 8, 
                color: '#ffffff', 
                font: 'Galmuri14', 
                useOutline: true, 
                outlineColor: '#000000' 
            },
            // 메뉴 버튼 설정 상세 데이터
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
    }),

    // ⭐ 2. 프로젝트 파일 불러오기
    loadProjectData: (loadedData) => set((state) => ({
        ...state,         
        ...loadedData,    
        isEditing: true,
        activeEventId: loadedData.events?.[0]?.id || 1, 
        showPreview: false,
        previewScenario: null
    })),
    
    isEditing: false,
    setIsEditing: (bool) => set({ isEditing: bool }),

    color: '',
    setColor: (color) => set({ color }),

    protagonist: { name: '', images: [] },
    setProtagonist: (protagonist) => set({ protagonist }),
    
    pFontStyle: { 
        font: '', color: '#ffffff', useOutline: false, outline: '#000000', 
        dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', dialogBorderColor: '#dddddd', 
        nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)', nameBorderColor: '#dddddd', 
        portraitStyle: 'square', portraitColor: '#ffffff', portraitBorderColor: '#dddddd',
        typingSound: 'type1' 
    },
    setPFontStyle: (style) => set((state) => ({ pFontStyle: { ...state.pFontStyle, ...style } })),

    // 🎮 기본 전역 UI 상태 (layoutMode 포함 필수)
    globalUi: { 
        calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033',
        calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Galmuri14', 
        cursor: 'default', saveLoadStyle: 'modern', 
        layoutMode: 'classic' // 🌟 추가
    },
    setGlobalUi: (ui) => set((state) => ({ globalUi: { ...state.globalUi, ...ui } })),

    customBackgrounds: [],
    addCustomBackground: (bg) => set((state) => ({ customBackgrounds: [...state.customBackgrounds, bg] })),
    
    characters: [
        { 
            id: Date.now(), name: '', images: [], 
            fontStyle: { 
                font: 'Galmuri14', color: '#EBEBEB', useOutline: false, outline: '#000000',
                dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)'
            } 
        }
    ],
    setCharacters: (chars) => set({ characters: chars }),

    customFonts: [], 
    addCustomFont: (fontName, url, file) => set((state) => {
        if (state.customFonts.some(f => f.name === fontName)) return state;
        return { customFonts: [...state.customFonts, { name: fontName, url, file }] };
    }), 

    // 🎭 이벤트 초기값 (처음 앱 켤 때용)
    events: [
        { 
            id: 1, title: '이벤트 1', bgm: null, 
            /* 📅 수정된 날짜 형식 */
            baseDate: { month: 'DATE: 1月 01日', day: '01日', time: 'TIME: 12:00' }, 
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

startMenu: {
            bgImage: null,
            bgm: null, // 🌟 스타트 메뉴 BGM ( {file, preview} 구조 )
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
        },
    setStartMenu: (data) => set((state) => ({ 
        startMenu: { ...state.startMenu, ...data } 
    }))
}));
export default useCustomizerStore;