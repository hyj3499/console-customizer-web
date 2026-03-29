// src/pages/Customizer/StepEventEditor.jsx
import { useState, useRef, useEffect } from 'react';
import { SHARED_BACKGROUNDS } from '../../assets/assets';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepEventEditor.css';

// ==========================================
// 💡 UI 에셋 및 색상 설정
// ==========================================

const OPTION_COLORS = ['#ffafee', '#84ccff', '#1971c2', '#e64980', '#7950f2', '#12b886', '#fcc419', '#20c997', '#ff8787', '#5c940d'];
                        
const PRESET_COLORS = [
    { id: 'pink', name: '핑크', value: 'rgba(255,182,193,0.8)', colors: ['#ffb6c1', '#faafbe'] },
    { id: 'black', name: '블랙', value: 'rgba(0,0,0,0.8)', colors: ['#444444', '#000000'] },
    { id: 'white', name: '화이트', value: 'rgba(255,255,255,0.8)', colors: ['#ffffff', '#e0e0e0'] },
    { id: 'blue', name: '블루', value: 'rgba(173,216,230,0.8)', colors: ['#add8e6', '#87ceeb'] },
    { id: 'purple', name: '퍼플', value: 'rgba(205,180,219,0.8)', colors: ['#d8bfd8', '#b19cd9'] }
];

const UI_ASSETS = {
    dialog: {
        simple: (bg, border='#dddddd') => ({ type: 'css', border: `2px solid ${border}`, borderRadius: '0px' }),
        gothic: (bg, border='#a9a9a9') => ({ type: 'css', border: `4px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ type: 'css', border: `3px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ type: 'image', src: `/images/retro_dialog_${getColorId(bg)}.png` }) 
    },
    namebox: {
        simple: (bg, border='#dddddd') => ({ type: 'css', border: `2px solid ${border}`, borderRadius: '0px' }),
        gothic: (bg, border='#a9a9a9') => ({ type: 'css', border: `3px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ type: 'css', border: `2px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ type: 'image', src: `/images/retro_namebox_${getColorId(bg)}.png` })
    },
    portrait: {
        square:  (bg, border='#dddddd') => ({ type: 'css', border: `3px solid ${border}`, borderRadius: '0%' }),
        rounded: (bg, border='#dddddd') => ({ type: 'css', border: `3px solid ${border}`, borderRadius: '12%' }),
        circle:  (bg, border='#dddddd') => ({ type: 'css', border: `3px solid ${border}`, borderRadius: '50%' }),
        retro:   (bg) => ({ type: 'image', src: `/images/retro_frame_${getColorId(bg)}.png`, mask: '/images/retro_frame_mask.png' }),
        reborn:  (bg) => ({ type: 'image', src: `/images/reborn_frame_${getColorId(bg)}.png` , mask: '/images/retro_frame_mask.png' }) 
    },
    calendar: {
        none: () => ({ type: 'none' })
    }
};

const getColorId = (rgbaValue) => {
    const found = PRESET_COLORS.find(c => c.value === rgbaValue);
    return found ? found.id : 'pink'; 
};

const PRESET_BACKGROUNDS = SHARED_BACKGROUNDS;

// ==========================================
// 🌟 통합된 표정 선택기 컴포넌트 (모든 컷 갤러리 동기화 적용)
// ==========================================
const ImageSelectorPanel = ({ title, type, characters, onSelect, selectedImage, uiState = {}, onUiStateChange, globalGalleryMode, setGlobalGalleryMode }) => {
    const protagonist = characters.find(c => c.isProtagonist) || characters[0];
    
    // ⭐ 갤러리 모드는 '전역 상태(globalGalleryMode)'를 따르고, 캐릭터 콤보박스는 개별 상태 유지
    const galleryMode = globalGalleryMode;
    const selectedChar = uiState.selectedChar || (protagonist ? protagonist.id.toString() : '');

    const imageKey = type === 'portrait' ? 'portraitImages' : 'standingImages';

    let displayImages = [];
    if (galleryMode) {
        characters.forEach(c => displayImages.push(...(c[imageKey] || [])));
    } else {
        const c = characters.find(char => char.id.toString() === selectedChar);
        displayImages = c ? (c[imageKey] || []) : [];
    }

    return (
        <div className="img-selector-panel">
            <div className="img-selector-header">
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>{title}</span>
                <label style={{ fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#1971c2', fontWeight: 'bold' }}>
                    {/* ⭐ 체크 시 모든 컷의 갤러리 모드를 한 번에 변경! */}
                    <input type="checkbox" checked={galleryMode} onChange={(e) => setGlobalGalleryMode(e.target.checked)} style={{ cursor: 'pointer' }} />
                    갤러리로 보기
                </label>
            </div>
            
            {!galleryMode && (
                <select value={selectedChar} onChange={(e) => onUiStateChange({ ...uiState, selectedChar: e.target.value })} className="input-base" style={{ width: '100%', marginBottom: '10px', padding: '6px', fontSize: '12px' }}>
                    {characters.map(c => (
                        <option key={c.id} value={c.id.toString()}>{c.isProtagonist ? '❤️' : '⭐️'} {c.name || '캐릭터'}</option>
                    ))}
                </select>
            )}

            <div className="face-list" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '140px', overflowY: 'auto', padding: '4px' }}>
                <div className="img-selector-clear" onClick={(e) => { e.stopPropagation(); onSelect(null); }} style={{ borderColor: selectedImage === null ? '#fa5252' : '#ccc', borderWidth: selectedImage === null ? '3px' : '1px' }} title="이미지 제거">🚫</div>
                {displayImages.map((img, i) => {
                    const imgSrc = img.preview || img;
                    const isActive = selectedImage === imgSrc;
                    return (
                        <img key={i} src={imgSrc} alt="face" onClick={(e) => { e.stopPropagation(); onSelect(imgSrc); }} className="img-selector-item" style={{ border: isActive ? '3px solid #1971c2' : '1px solid #ccc', transform: isActive ? 'scale(1.05)' : 'scale(1)' }} />
                    );
                })}
            </div>
        </div>
    );
};

export default function StepEventEditor() {
    const { 
        events, setEvents, activeEventId, setActiveEventId,
        showPreview, setShowPreview, previewScenario, setPreviewScenario,
        characters, globalUi, customBackgrounds, addCustomBackground,
        narrationFontStyle
    } = useCustomizerStore();

    // 🌟 분리된 구조 통합 처리
    const protagonist = characters.find(c => c.isProtagonist) || characters[0] || {};
    const pFontStyle = protagonist.fontStyle || {};

    const currentGlobalUi = globalUi || { calendarFrame: 'none', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', layoutMode: 'bottom' };
    const safeNarrationStyle = narrationFontStyle || { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', typingSound: 'type1' };

    const [currentBranch, setCurrentBranch] = useState('main'); 
    const [isCgMode, setIsCgMode] = useState(false);
    const [editingDateIndex, setEditingDateIndex] = useState(null); 
    const fileInputRefs = useRef({}); 

    // ========================================================
    // ⭐ 미리보기 창 드래그 기능 로직 ⭐
    // ========================================================
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        setIsDragging(true);
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        dragStartPos.current = { x: clientX - previewPos.x, y: clientY - previewPos.y };
    };

    useEffect(() => {
        const handleDragMove = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault(); // 스크롤 방지
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            setPreviewPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
        };

        const handleDragEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove, { passive: false });
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);
    // ========================================================
    
    // ⭐ 추가: 모든 컷을 일괄적으로 갤러리 모드로 묶어줄 전역 상태 변수
    const [isGlobalGalleryMode, setIsGlobalGalleryMode] = useState(false);
    const activeEvent = events.find(ev => ev.id === activeEventId) || events[0];
    const scenarios = activeEvent.scenarios;
    const hasChoiceNode = scenarios.some(s => s.type === 'choice');

    useEffect(() => {
        if (scenarios && scenarios.length > 0) {
            const lastScen = scenarios[scenarios.length - 1]; 
            if (lastScen.type === 'choice') {
                setCurrentBranch('option1');
            } else if (lastScen.type === 'ending' && lastScen.branch?.startsWith('option')) {
                const currentNum = parseInt(lastScen.branch.replace('option', ''));
                const choiceNode = scenarios.find(s => s.type === 'choice');
                const totalOpts = choiceNode?.options?.length || 2;
                
                if (currentNum < totalOpts) {
                    setCurrentBranch(`option${currentNum + 1}`);
                } else {
                    setCurrentBranch(lastScen.branch);
                }
            } else {
                setCurrentBranch(lastScen.branch || 'main');
            }
        } else {
            setCurrentBranch('main');
        }
    }, [activeEventId]); 
// ==========================================
    const isMainEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
    const hasEndingInCurrentBranch = scenarios.some(s => s.branch === currentBranch && s.type === 'ending');
    
    const choiceNodeInfo = scenarios.find(s => s.type === 'choice');
    const totalOptionsCount = choiceNodeInfo ? (choiceNodeInfo.options?.length || 2) : 0;
    
    let isFullyEnded = false;
    if (hasChoiceNode) {
        let allEnded = true;
        for (let i = 1; i <= totalOptionsCount; i++) {
            if (!scenarios.some(s => s.branch === `option${i}` && s.type === 'ending')) {
                allEnded = false;
                break;
            }
        }
        isFullyEnded = allEnded;
    } else {
        isFullyEnded = isMainEnded;
    }

    const currentBranchNum = currentBranch.startsWith('option') ? parseInt(currentBranch.replace('option', '')) : 0;
    const defaultSpeaker = 'PROTAGONIST'; 
    const displayProtagonistName = protagonist.name || '주인공';
// ⭐ [버그 1 해결] 이전 컷 상속 로직 제거 -> 없으면 무조건 '기본 설정' 따름
    const getEffectiveDateForIndex = (targetIndex) => {
        const targetScenario = scenarios[targetIndex];
        
        if (targetScenario && targetScenario.dateOverride) {
            return { ...targetScenario.dateOverride };
        }
        return { ...activeEvent.baseDate };
    };

    const updateActiveEvent = (updates) => {
        setEvents(events.map(ev => ev.id === activeEventId ? { ...ev, ...updates } : ev));
    };

// ⭐ URL에서 파일 이름만 추출하는 함수 (로드 시 필요)
    const extractNameFromUrl = (url) => {
        if (typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            return decodeURIComponent(lastPart).split('_').pop();
        } catch (e) {
            return "저장된 오디오";
        }
    };

    // ⭐ 수정됨: 이벤트 BGM 업로드 (bgmName 저장 추가)
    const handleEventBgmUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateActiveEvent({ 
                bgm: URL.createObjectURL(file), 
                bgmFile: file,
                bgmName: file.name
            });
        }
        e.target.value = ''; // 같은 파일 다시 올릴 수 있게 초기화
    };

    // ⭐ 추가됨: 이벤트 BGM 삭제
    const handleEventBgmClear = () => {
        if (window.confirm("이 이벤트의 BGM을 삭제하시겠습니까?")) {
            updateActiveEvent({ bgm: null, bgmFile: null, bgmName: '' });
        }
    };
    
    const handleBaseDateChange = (field, value) => {
        updateActiveEvent({ baseDate: { ...activeEvent.baseDate, [field]: value } });
    };

    const addNewEvent = () => {
        const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
        const newTitle = `이벤트 ${events.length + 1}`; 
        
        setEvents([...events, { 
            id: newId, title: newTitle, bgm: null, 
            baseDate: { month: 'DATE: 1月 01日', day: '01日', time: 'TIME: 12:00' },
            scenarios: [{ type: 'dialog', branch: 'main', speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: null, bgType: 'bg_school', dateOverride: null }] 
        }]);
        setActiveEventId(newId);
        setCurrentBranch('main');
        setIsCgMode(false);
    };

    const deleteEvent = (e, idToRemove) => {
        e.stopPropagation();
        if (events.length <= 1) return alert('🚨 최소 1개의 이벤트는 남아있어야 합니다!');
        
        if (window.confirm('이 이벤트를 정말 삭제하시겠습니까? (복구 불가)')) {
            const filteredEvents = events.filter(ev => ev.id !== idToRemove);
            const reorderedEvents = filteredEvents.map((ev, index) => ({
                ...ev, id: index + 1, title: `이벤트 ${index + 1}`
            }));
            setEvents(reorderedEvents);

            if (activeEventId === idToRemove) {
                setActiveEventId(reorderedEvents[0].id);
                setPreviewScenario(null);
            } else if (activeEventId > idToRemove) {
                setActiveEventId(activeEventId - 1);
            }
        }
    };

    const handleTogglePreview = (e) => {
        const isChecked = e.target.checked;
        setShowPreview(isChecked);
        if (isChecked && !previewScenario && scenarios.length > 0) {
            setPreviewScenario({ ...scenarios[0], index: 0 });
        }
    };

    const updateActiveScenarios = (newScenarios) => {
        updateActiveEvent({ scenarios: newScenarios });
    };

    const handleScenarioChange = (index, field, value) => {
        const newScenarios = [...scenarios];
        newScenarios[index][field] = value;
        updateActiveScenarios(newScenarios);

        if (showPreview) {
            setPreviewScenario({ ...newScenarios[index], index });
        }
    };

// ⭐ [버그 1 해결] 깊은 복사(Deep Copy)를 적용하여 다른 컷에 영향 주지 않음
    const handleDateOverrideChange = (index, field, value) => {
        const newScenarios = [...scenarios];
        // 중요: 완전히 새로운 객체로 복사해서 참조 끊기
        const currentOverride = newScenarios[index].dateOverride 
            ? { ...newScenarios[index].dateOverride } 
            : { ...getEffectiveDateForIndex(index) };
            
        currentOverride[field] = value;
        newScenarios[index].dateOverride = currentOverride;
        updateActiveScenarios(newScenarios);

        if (showPreview) {
            setPreviewScenario({ ...newScenarios[index], index });
        }
    };

    // ⭐ [편의성 1 추가] 모든 컷의 상태창 덮어쓰기 초기화 함수
    const handleApplyBaseDateToAll = () => {
        if (window.confirm("현재 설정한 [상태창 기본 설정]으로 이 이벤트의 모든 컷을 통일하시겠습니까?\n(각 컷마다 설정했던 개별 시간 변경은 모두 삭제됩니다.)")) {
            // 모든 시나리오 컷의 dateOverride를 null로 밀어버려서 무조건 기본 설정을 따르게 만듦
            const newScenarios = scenarios.map(sc => ({ ...sc, dateOverride: null }));
            updateActiveScenarios(newScenarios);
            setEditingDateIndex(null); // 열려있는 편집창도 닫음
        }
    };

    const toggleDateEditMode = (e, index, scenario, effectiveDate) => {
        e.stopPropagation();
        if (showPreview) setPreviewScenario({ ...scenario, index });
        if (editingDateIndex === index) {
            setEditingDateIndex(null);
        } else {
            if (!scenario.dateOverride) {
                handleScenarioChange(index, 'dateOverride', { ...effectiveDate });
            }
            setEditingDateIndex(index);
        }
    };

    const clearDateOverride = (e, index) => {
        e.stopPropagation();
        handleScenarioChange(index, 'dateOverride', null);
        setEditingDateIndex(null);
    };

    const handleBgSelectChange = (index, value) => {
        if (value === 'custom_new') {
            if (fileInputRefs.current[index]) fileInputRefs.current[index].click();
        } else if (value.startsWith('custom_bg_')) {
            const customBg = customBackgrounds.find(bg => bg.id === value);
            if (customBg) {
                const newScenarios = [...scenarios];
                newScenarios[index].bgType = value;
                newScenarios[index].bgImage = customBg.url;
                updateActiveScenarios(newScenarios);
                if (showPreview) setPreviewScenario({ ...newScenarios[index], index });
            }
        } else {
            const preset = PRESET_BACKGROUNDS.find(p => p.id === value);
            if (preset) {
                const newScenarios = [...scenarios];
                newScenarios[index].bgType = value;
                newScenarios[index].bgImage = preset.url;
                updateActiveScenarios(newScenarios);
                if (showPreview) setPreviewScenario({ ...newScenarios[index], index });
            }
        }
    };

    const handleBgUpload = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newId = `custom_bg_${Date.now()}`;
            const newName = `내 배경 ${customBackgrounds.length + 1}`;
            addCustomBackground({ id: newId, name: newName, url, file });

            const newScenarios = [...scenarios];
            newScenarios[index].bgType = newId;
            newScenarios[index].bgImage = url;
            updateActiveScenarios(newScenarios);
            
            if (showPreview) setPreviewScenario({ ...newScenarios[index], index });
        }
        e.target.value = '';
    };

const addScenarioInput = () => {
    // 1. 기본값 준비 (에셋 리스트의 첫 번째)
    const defaultBgId = PRESET_BACKGROUNDS[0]?.id;
    const defaultBgUrl = PRESET_BACKGROUNDS[0]?.url;

    let lastBg = defaultBgUrl;
    let lastBgType = defaultBgId;

    // 2. 배경 복사 로직
    if (currentBranch.startsWith('option')) {
        // ⭐ 선택지 분기 루트라면? 'choice' 노드 바로 앞에 있던 대사의 배경을 찾음
        const choiceIndex = scenarios.findIndex(s => s.type === 'choice');
        if (choiceIndex > 0) {
            // "선택지 박스"가 나오기 바로 전 컷의 배경을 그대로 물려받음
            lastBg = scenarios[choiceIndex - 1].bgImage || defaultBgUrl;
            lastBgType = scenarios[choiceIndex - 1].bgType || defaultBgId;
        }
    } else if (scenarios.length > 0) {
        // 메인 루트라면 그냥 현재 가장 마지막 컷의 배경을 물려받음
        lastBg = scenarios[scenarios.length - 1].bgImage || defaultBgUrl;
        lastBgType = scenarios[scenarios.length - 1].bgType || defaultBgId;
    }

    // 3. 데이터 조립 및 추가
    updateActiveScenarios([
        ...scenarios,
        {
            type: 'dialog',
            branch: currentBranch,
            isCg: isCgMode,
            speaker: defaultSpeaker,
            protagonistImage: null,
            heroineImage: null,
            text: '',
            bgImage: lastBg,
            bgType: lastBgType,
            dateOverride: null
        }
    ]);
};

// 🚨 여기에 아래 함수를 추가해 주세요! 🚨
    const handleCgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // 1. 임시 URL 생성
        const objectUrl = URL.createObjectURL(file);
        
        // 2. CG 모드 활성화
        setIsCgMode(true);
        
        // 3. 시나리오 데이터 구성 (배너 + 첫 대사)
        const newScenarios = [...scenarios, 
            { 
                type: 'cg_image', 
                src: objectUrl, 
                file: file, 
                branch: currentBranch 
            },
            { 
                type: 'dialog', 
                branch: currentBranch, 
                isCg: true, 
                speaker: defaultSpeaker, 
                protagonistImage: null, 
                heroineImage: null, 
                text: '', 
                bgImage: objectUrl, 
                file: file, 
                bgType: 'custom_cg', 
                dateOverride: null 
            }
        ];
        
        updateActiveScenarios(newScenarios);
    };
    
    
const insertScenarioAfter = (index, currentItem, type = 'dialog', extraData = null) => {
    let newScenarios = [...scenarios];
    let newBranch = currentItem.branch;

    // ⭐ 수정됨: 엔딩 컷 추가 로직 (팝업 및 이후 대사 일괄 삭제)
    if (type === 'ending') {
        // 현재 인덱스(방금 버튼을 누른 컷) 이후에 같은 루트의 대사가 있는지 검사합니다.
        const hasSubsequentCuts = newScenarios.slice(index + 1).some(s => s.branch === newBranch);
        
        if (hasSubsequentCuts) {
            // 뒤에 대사가 있다면 경고 팝업을 띄웁니다.
            if (!window.confirm("이 이후의 대사는 모두 삭제됩니다.\n정말 엔딩을 추가하시겠습니까?")) {
                return; // 사용자가 '취소'를 누르면 아무 일도 일어나지 않고 종료됩니다.
            }
            
            // '확인'을 누르면, 현재 인덱스 이후에 있는 같은 루트의 대사들을 배열에서 싹 지웁니다.
            newScenarios = newScenarios.filter((s, i) => {
                if (i > index && s.branch === newBranch) return false;
                return true;
            });

            // (추가 방어) 만약 '메인 루트'에서 엔딩이 났다면, 기존에 만들어둔 선택지 분기들도 의미가 없어지므로 함께 지워줍니다.
            if (newBranch === 'main') {
                newScenarios = newScenarios.filter(s => !s.branch?.startsWith('option'));
            }
        }

        // 찌꺼기 컷들을 다 지웠으니, 마음 편히 엔딩 컷을 삽입합니다.
        newScenarios.splice(index + 1, 0, { type: 'ending', branch: newBranch, text: '' });
        updateActiveScenarios(newScenarios);
        return; 
    }

    // --- 이 아래부터는 기존 코드와 동일합니다 ---
    if (type === 'cg_image') {
        const cgItem = { type: 'cg_image', src: extraData.url, file: extraData.file, branch: newBranch };
        const dialogItem = { type: 'dialog', branch: newBranch, isCg: true, speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: extraData.url, file: extraData.file, bgType: 'custom_cg', dateOverride: null };
        newScenarios.splice(index + 1, 0, cgItem, dialogItem);
        updateActiveScenarios(newScenarios);
        setIsCgMode(true);
        return;
    }

    let newItem = {};
    if (type === 'choice') {
        if (hasChoiceNode) return alert("선택지 분기는 하나만 생성할 수 있습니다.");
        newItem = { type: 'choice', branch: newBranch, options: ['', ''] };
        setIsCgMode(false);
        setCurrentBranch('option1');
    } else if (type === 'copy') {
        newItem = { ...currentItem };
        if (newItem.dateOverride) {
            newItem.dateOverride = { ...newItem.dateOverride };
        }
    } else {
        // '새로운 대사 추가' 시 이전 배경을 무조건 디폴트 배경으로!
        newItem = { 
            type: 'dialog', 
            branch: newBranch, 
            isCg: false, 
            speaker: defaultSpeaker, 
            protagonistImage: null, 
            heroineImage: null, 
            text: '', 
            bgImage: PRESET_BACKGROUNDS[0]?.url, 
            bgType: PRESET_BACKGROUNDS[0]?.id, 
            dateOverride: null 
        };
    }

    newScenarios.splice(index + 1, 0, newItem);
    updateActiveScenarios(newScenarios);
};
    
    const handleInlineCgUpload = (e, index, currentItem) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        insertScenarioAfter(index, currentItem, 'cg_image', { file, url });
        e.target.value = '';
    };

    const removeScenarioInput = (indexToRemove) => {
        const item = scenarios[indexToRemove];
        if (indexToRemove === 0 && item.branch === 'main') return alert('🚨 컷 1은 삭제할 수 없습니다!');

        if (item.type === 'cg_image') {
            if (!window.confirm("이 CG 일러스트와 연결된 대사들을 모두 삭제하시겠습니까?")) return;
            
            let newScenarios = [...scenarios];
            let deleteCount = 1; 
            let dialogsToDelete = 0; 

            for (let i = indexToRemove + 1; i < newScenarios.length; i++) {
                if (newScenarios[i].isCg && newScenarios[i].bgImage === item.src) {
                    deleteCount++;
                    if (newScenarios[i].type === 'dialog') dialogsToDelete++;
                } else {
                    break;
                }
            }

            const totalDialogsInBranch = newScenarios.filter(s => s.branch === item.branch && s.type === 'dialog').length;
            if (item.branch !== 'main' && (totalDialogsInBranch - dialogsToDelete) < 1) {
                return alert('🚨 선택지 루트에는 최소 1개의 대사가 있어야 합니다!\n(이 CG를 지우면 루트가 텅 비게 됩니다.)');
            }
            
            newScenarios.splice(indexToRemove, deleteCount);

            const currentBranchScenarios = newScenarios.filter(s => s.branch === currentBranch);
            const lastCurrentBranchItem = currentBranchScenarios[currentBranchScenarios.length - 1];
            if (!lastCurrentBranchItem || !lastCurrentBranchItem.isCg) setIsCgMode(false);

            if (item.branch?.startsWith('option') && newScenarios.filter(s => s.branch === item.branch).length === 0) {
                const currentOptNum = parseInt(item.branch.replace('option', ''));
                setCurrentBranch(currentOptNum > 1 ? `option${currentOptNum - 1}` : 'option1');
            }
            
            updateActiveScenarios(newScenarios);
            if (previewScenario && previewScenario.index >= indexToRemove) setPreviewScenario(null);
            return;
        }

        if (item.type === 'choice') {
            if (!window.confirm("선택지 분기를 삭제하면 하위 대사들(모든 루트)도 모두 삭제됩니다.")) return;
            updateActiveScenarios(scenarios.filter((s, idx) => idx !== indexToRemove && !s.branch?.startsWith('option')));
            setCurrentBranch('main');
            setIsCgMode(false); 
            return;
        }

        if (item.branch !== 'main' && item.type !== 'ending') {
            const branchDialogCuts = scenarios.filter(s => s.branch === item.branch && s.type === 'dialog');
            if (branchDialogCuts.length <= 1) {
                return alert('🚨 선택지 루트에는 최소 1개의 대사가 있어야 합니다!');
            }
        }

        let newScenarios = scenarios.filter((_, index) => index !== indexToRemove);

        newScenarios = newScenarios.filter((sc, idx, arr) => {
            if (sc.type === 'cg_image') {
                const nextSc = arr[idx + 1];
                if (!nextSc || !nextSc.isCg) return false;
            }
            return true;
        });

        const currentBranchScenarios = newScenarios.filter(s => s.branch === currentBranch);
        const lastCurrentBranchItem = currentBranchScenarios[currentBranchScenarios.length - 1];
        if (!lastCurrentBranchItem || !lastCurrentBranchItem.isCg) setIsCgMode(false);

        if (item.branch?.startsWith('option')) {
            const currentOptNum = parseInt(item.branch.replace('option', ''));
            const remainingCurrentBranch = newScenarios.filter(s => s.branch === item.branch);
            if (remainingCurrentBranch.length === 0) {
                setCurrentBranch(currentOptNum > 1 ? `option${currentOptNum - 1}` : 'option1');
            }
        }
        
        updateActiveScenarios(newScenarios);
        if (previewScenario && previewScenario.index === indexToRemove) setPreviewScenario(null);
    };

    const handleAddOption = (choiceIndex) => {
        const newScenarios = [...scenarios];
        const choiceNode = newScenarios[choiceIndex];
        const currentOptions = choiceNode.options || [choiceNode.option1 || '', choiceNode.option2 || ''];
        if (currentOptions.length >= 10) return alert("선택지는 최대 10개까지만 추가할 수 있습니다.");
        choiceNode.options = [...currentOptions, ''];
        updateActiveScenarios(newScenarios);
    };

    const handleDeleteOption = (choiceIndex, optIdxToDelete) => {
        const branchNumToDelete = optIdxToDelete + 1;
        if (!window.confirm(`선택지 ${branchNumToDelete}번과 해당 루트의 모든 대사를 삭제하시겠습니까?\n(이후 번호의 루트들은 앞으로 당겨집니다.)`)) return;

        let newScenarios = [...scenarios];
        const choiceNode = newScenarios[choiceIndex];
        const currentOptions = choiceNode.options || [choiceNode.option1 || '', choiceNode.option2 || ''];
        
        currentOptions.splice(optIdxToDelete, 1);
        choiceNode.options = currentOptions;

        newScenarios = newScenarios.filter(s => s.branch !== `option${branchNumToDelete}`);

        newScenarios = newScenarios.map(s => {
            if (s.branch && s.branch.startsWith('option')) {
                const currentNum = parseInt(s.branch.replace('option', ''));
                if (currentNum > branchNumToDelete) {
                    return { ...s, branch: `option${currentNum - 1}` };
                }
            }
            return s;
        });

        setCurrentBranch('option1'); 
        setIsCgMode(false);
        updateActiveScenarios(newScenarios);
    };

    const getActiveSpeakerStyle = (speakerId) => {
        if (speakerId === '나레이션') return safeNarrationStyle;
        if (!speakerId || speakerId === 'PROTAGONIST') return pFontStyle;
        const char = characters.find(c => c.name === speakerId);
        return char ? char.fontStyle : pFontStyle;
    };

    const getSpeakerName = (speakerId) => {
        if (!speakerId) return '';
        if (speakerId === 'PROTAGONIST') return protagonist.name || '주인공';
        return speakerId; 
    };

    const activeStyle = previewScenario ? getActiveSpeakerStyle(previewScenario.speaker) : pFontStyle;
    const renderFontFamily = activeStyle?.font || currentGlobalUi?.systemFont || 'sans-serif';

    const dAsset = (UI_ASSETS.dialog[activeStyle?.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle?.dialogColor, activeStyle?.dialogBorderColor);
    const nAsset = (UI_ASSETS.namebox[activeStyle?.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle?.nameColor, activeStyle?.nameBorderColor);
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.none)(currentGlobalUi.calendarColor); 

    const pAsset = (UI_ASSETS.portrait[pFontStyle?.portraitStyle] || UI_ASSETS.portrait.square)(pFontStyle?.portraitColor, pFontStyle?.portraitBorderColor);
    const finalPortraitBorder = pFontStyle?.usePortraitBorder === false ? 'none' : (pAsset ? pAsset.border : 'none');

    const getCalendarTextShadow = () => {
        if (!currentGlobalUi.calendarTextUseOutline) return 'none';
        const oc = currentGlobalUi.calendarTextOutlineColor || '#ffffff';
        return `-1px -1px 0 ${oc}, 1px -1px 0 ${oc}, -1px 1px 0 ${oc}, 1px 1px 0 ${oc}`;
    };

    const finalDialogBorder = activeStyle?.useDialogBorder === false ? 'none' : dAsset.border;
    const finalNameBorder = activeStyle?.useNameBorder === false ? 'none' : nAsset.border;
    
    const previewDate = previewScenario ? getEffectiveDateForIndex(previewScenario.index) : activeEvent.baseDate;
    const isNarration = previewScenario?.speaker === '나레이션';
    const layoutClass = currentGlobalUi.layoutMode === 'bottom' ? 'layout-bottom' : 'layout-classic';

    return (
        <div className="editor-container">
<div className="editor-header-group">
        <h2 className="section-title">시나리오 및 스토리 전개 설정</h2>
        <p className="section-desc">장면에 따른 대사와 연출, 이야기의 흐름을 결정하는 선택지와 분기를 구성해 주세요.</p>
    </div>
{/* 🔵 파란색 박스: 뷰어 강조 및 기본 셋팅 가이드 */}
{/* 🔵 파란색 박스: 뷰어 강조 및 연출 꿀팁 */}
<div className="settings-tips-wrap" style={{ marginTop: '15px' }}>
    <ul className="settings-tips">                    
        {/* 1. 이미지 제거 활용 팁 */}
        <li>
            초상화와 스탠딩의 노출 여부를 조합하여 나만의 게임 스타일을 결정할 수 있습니다.
            <ul style={{ marginTop: '5px', listStyleType: 'circle', paddingLeft: '20px', color: '#495057' }}>
                <li><strong>클래식 노벨 구조:</strong> 주인공은 '초상화'만, 상대방은 '스탠딩'만 상대해 보세요. 클래식한 몰입감 있는 비주얼 노벨 게임이 됩니다.</li>
                <li><strong>스타듀밸리 스타일:</strong> 모든 스탠딩을 제거(🚫)하고 '초상화'만 활용해 보세요. '스타듀밸리'나 클래식 RPG처럼 대화 상대의 얼굴에 집중할 수 있는 게임이 됩니다.</li>
                <li><strong>감성 텍스트 게임:</strong> 초상화와 스탠딩을 모두 제거(🚫)해 보세요. 오직 배경과 대사만 남겨, 독백이나 소설 같은 서정적인 분위기의 텍스트 게임을 만들 수 있습니다.</li>
            </ul>
        </li>

        {/* 2. 상태창 활용 팁 */}
        <li>
            상단 [상태창 설정]은 날짜뿐만 아니라 다양한 설정으로 활용할 수 있습니다.
            <ul style={{ marginTop: '5px', listStyleType: 'none', paddingLeft: '10px', color: '#495057', fontSize: '12px' }}>
                <li>✦ 메인 목표: 최애로운생활을 공략하기</li>
                <li>TARGET ━━▶︎ 최애로운생활 | 호감도: ♥♥♡♡♡</li>
                <li> HP 60/100 | MP ▰▰▰▰▱ </li>
            </ul>
            <em style={{ fontSize: '11px', color: '#868e96' }}>(※ 각 컷의 [상태창 변경] 버튼을 통해 대사마다 수치를 실시간으로 바꾸는 연출이 가능!)</em>
        </li>
                  <li style={{ color: '#e03131', fontWeight: 'bold' }}>
      📱 휴대폰으로 '인게임 미리보기' 확인 시, 기기의 가로 폭이 좁아 레이아웃 배치가 어긋나거나 글씨 외곽선이 제대로 표시되지 않을 수 있습니다. 연출을 정확하게 확인하고 싶으시다면 기기를 [가로모드]로 전환하거나 PC 브라우저를 이용해 주세요.
    </li> {/* ← 닫는 태그 추가 */}
    </ul> {/* ← 닫는 태그 추가 */}
</div>

            {/* 🌸 분홍색 박스: 하단 액션 버튼 가이드 */}
            <div className="settings-tips-wrap pink">
                <ul className="settings-tips">
                     <li><strong style={{ color: '#e03131', fontSize: '14px' }}>📺 인게임 미리보기 모드 (ON/OFF):</strong> 우측 상단의 스위치를 <strong>[ON]</strong>으로 켜보세요! 작성 중인 컷을 실제 인게임 화면으로 확인할 수 있습니다. 
                     스위치를 켰는데도 인게임 화면이 보이지 않으면 대사를 클릭해보세요!</li>
                    <li><strong>📑 + 새 이벤트 및 🎵 BGM:</strong> 상단에서 이벤트를 추가해 챕터를 나누고, 리스트 맨 위에서 해당 이벤트의 배경음악(BGM)을 설정할 수 있습니다.</li>
                    <li><strong>📅 상태창 변경:</strong> 컷 왼쪽의 [상태창 변경]을 눌러 설정을 바꾸거나, 상단 [기본 설정]에서 모든 컷의 상태창을 한 번에 덮어씌울 수 있습니다.</li>                  
                    <li><strong>📋 대사 복사하기:</strong> 현재 컷의 구도(배경, 캐릭터, 표정)를 그대로 복제합니다.</li>
                    <li><strong>💬 새로운 대사 추가:</strong> 캐릭터와 대사 내용이 비어있는 새로운 컷을 추가합니다.</li>
                    <li><strong>🖼️ CG 삽입 & 모드:</strong> 화면 전체를 덮는 일러스트 연출을 켭니다. CG 연출이 끝났다면 <strong>[💬 CG 모드 종료]</strong> 버튼을 눌러 다시 일반 대사로 작성할 수 있습니다.</li>
                    <li><strong>🔀 선택지 분기:</strong> 플레이어의 선택에 따라 스토리가 나뉘는 갈림길을 만듭니다. (하나의 이벤트 안에는 하나의 분기만 만들 수 있습니다)</li>
                    <li><strong>🎬 엔딩:</strong> 각 선택지 루트의 이야기가 끝나는 지점입니다. 엔딩 시 검은 화면에 엔딩 이름이 뜨며 게임이 시작 메뉴로 돌아갑니다.</li>
                </ul>
            </div>
<div className="preview-toggle-wrap" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#212529' }}>📺 인게임 연출 미리보기</span>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
                미리보기 창의 상단바를 잡고 원하는 위치로 자유롭게 옮겨보세요!
            </span>
        </div>
        <label className="toggle-switch-label">
            <input type="checkbox" checked={showPreview} onChange={handleTogglePreview} style={{ opacity: 0, width: 0, height: 0 }} />
            <span className="toggle-switch-bg" style={{ backgroundColor: showPreview ? '#1971c2' : '#ccc' }}>
                <span className="toggle-switch-knob" style={{ left: showPreview ? '30px' : '4px' }} />
            </span>
        </label>
    </div>
</div>

{showPreview && previewScenario && (previewScenario.type === 'dialog' || previewScenario.type === 'ending') && (
    /* 여기서 주석을 삭제하거나 아래처럼 div 안으로 옮기세요 */
    <div className="sticky-win95-preview" style={{ transform: `translate(${previewPos.x}px, ${previewPos.y}px)`, zIndex: isDragging ? 9999 : 1000 }}>
        {/* ⭐ 주석을 여기(태그 안쪽)로 옮기면 에러가 나지 않습니다 */}
        
        <div 
            className="win95-preview-title" 
            onMouseDown={handleDragStart} 
            onTouchStart={handleDragStart}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
            <h5>📺 인게임 미리보기: 컷 {previewScenario.index + 1}</h5>
            
            <button 
                className="win95-close-btn" 
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => { setShowPreview(false); setPreviewScenario(null); setPreviewPos({ x: 0, y: 0 }); }}
            >
                X
            </button>
        </div>
                    
                    <div className={`win95-preview-monitor ${layoutClass}`}>
                        {previewScenario.type === 'ending' ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                                <span style={{ fontFamily: renderFontFamily, color: '#fff', fontSize: '4cqh', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                                    {previewScenario.text || "엔딩 대사를 입력하세요"}
                                </span>
                            </div>
                        ) : (
                            <>
                                {previewScenario.bgImage && <img src={previewScenario.bgImage} alt="bg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                                {previewScenario.heroineImage && <img src={previewScenario.heroineImage} alt="standing" className="ig-standing" />}

                                {!previewScenario.isCg && (
                                    <div className="ig-calendar-group">
                                        {currentGlobalUi.calendarFrame !== 'none' && (
                                            <div className="ig-calendar-box" style={{ 
                                                backgroundColor: cAsset.type === 'image' ? 'transparent' : (currentGlobalUi.calendarColor || 'rgba(255,182,193,0.8)'),
                                                backgroundImage: cAsset.type === 'image' ? `url(${cAsset.src})` : 'none',
                                                border: cAsset.type === 'css' ? cAsset.border : 'none', 
                                                borderRadius: cAsset.type === 'css' ? cAsset.borderRadius : '0' 
                                            }}>
                                                <span className="ig-calendar-day-text" style={{ 
                                                    fontFamily: currentGlobalUi.systemFont || 'sans-serif', 
                                                    color: currentGlobalUi.calendarTextColor || '#5C4033', 
                                                    textShadow: getCalendarTextShadow() 
                                                }}>
                                                    {previewDate.day}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="ig-calendar-text">
                                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>
                                                {previewDate.month}
                                            </span>
                                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>
                                                {previewDate.time}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {previewScenario.protagonistImage && (
                                    <div className="ig-portrait-area">
                                        {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 1 }} />}
                                        
                                        <div style={{
                                            position: 'absolute', width: '100%', height: '100%', 
                                            zIndex: 2, 
                                            backgroundColor: pAsset.type === 'image' ? 'transparent' : (pFontStyle.portraitColor || 'rgba(255,182,193,0.8)'),
                                            WebkitMaskImage: pAsset.type === 'image' ? `url("${pAsset.mask}")` : 'none', 
                                            maskImage: pAsset.type === 'image' ? `url("${pAsset.mask}")` : 'none',
                                            WebkitMaskSize: '100% 100%', maskSize: '100% 100%', 
                                            WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                                            borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', 
                                            border: pAsset.type === 'css' ? finalPortraitBorder : 'none', 
                                            boxSizing: 'border-box', overflow: 'hidden'
                                        }}>
                                            <img src={previewScenario.protagonistImage} alt="주인공" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                )}
                                
                                {previewScenario.speaker && !isNarration && (
                                    <div className="ig-namebox" style={{
                                        backgroundColor: nAsset.type === 'image' ? 'transparent' : (activeStyle?.nameColor || 'rgba(0,0,0,0.8)'), 
                                        backgroundImage: nAsset.type === 'image' ? `url(${nAsset.src})` : 'none', 
                                        border: nAsset.type === 'css' ? finalNameBorder : 'none', 
                                        borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0'
                                    }}>
                                        <span style={{ fontFamily: renderFontFamily, color: activeStyle?.color || '#fff', textShadow: activeStyle?.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh'}}>
                                            {getSpeakerName(previewScenario.speaker)}
                                        </span>
                                    </div>
                                )}

                                <div className="ig-dialogbox" style={{
                                    backgroundColor: dAsset.type === 'image' ? 'transparent' : (activeStyle?.dialogColor || 'rgba(0,0,0,0.8)'), backgroundImage: dAsset.type === 'image' ? `url(${dAsset.src})` : 'none',
                                    border: dAsset.type === 'css' ? finalDialogBorder : 'none', borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0'
                                }}>
                                    <p style={{ fontFamily: renderFontFamily, color: activeStyle?.color || '#fff', textShadow: activeStyle?.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh', marginTop: 0 }}>
                                        {previewScenario.text}
                                    </p>
                                </div>
                                
                                <div className="ig-system-menu" style={{
                                    position: 'absolute', bottom: '95cqh', left: '70%', transform: 'translateX(-50%)',
                                    display: 'flex', gap: '15px', zIndex: 100, backgroundColor: 'transparent', width: 'auto', whiteSpace: 'nowrap'
                                }}>
                                    {['되감기', '대사록', '자동진행', '저장하기', '불러오기', '설정'].map((menu) => (
                                        <span key={menu} style={{
                                            fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontSize: '1.7cqh', color: '#ffffff',
                                            cursor: 'pointer', fontWeight: 'normal', textShadow: '1px 1px 3px rgba(0,0,0,1), 0px 0px 5px rgba(0,0,0,0.5)', opacity: 0.9
                                        }}>
                                            {menu}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="event-tabs-wrap">
                {events.map(ev => (
                    <div key={ev.id} className="event-tab">
                        <button onClick={() => { setActiveEventId(ev.id); setPreviewScenario(null); setIsCgMode(false); }} className={`event-tab-btn ${activeEventId === ev.id ? 'active' : 'inactive'}`}>
                            {ev.title}
                        </button>
                        {ev.id !== 1 && <button onClick={(e) => deleteEvent(e, ev.id)} className="event-tab-del" style={{ color: activeEventId === ev.id ? '#ffc9c9' : '#adb5bd' }}>✖</button>}
                    </div>
                ))}
                <button onClick={addNewEvent} className="event-add-btn">+ 새 이벤트</button>
            </div>

<div className="editor-main-area">
<div className="config-panel" style={{ display: 'flex' }}>
                    {/* BGM 설정 영역 */}
                    <div className="config-section">
                        <h4 className="config-title">🎵 {activeEvent.title} BGM 설정</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* 기본 input 대신 예쁜 버튼으로 변경 */}
                                <input type="file" accept="audio/*" id={`event-bgm-${activeEvent.id}`} onChange={handleEventBgmUpload} style={{ display: 'none' }} />
                                <button onClick={() => document.getElementById(`event-bgm-${activeEvent.id}`).click()} className="sidebar-btn" style={{ width: 'auto', padding: '6px 15px', backgroundColor: '#f1f3f5', border: '1px solid #ced4da', fontWeight: 'bold', fontSize: '12px' }}>
                                    🎵 오디오 선택
                                </button>
                                {activeEvent.bgm && <audio src={activeEvent.bgm} controls style={{ height: '30px' }} />}
                            </div>

                            {/* ⭐ BGM 이름 및 삭제 버튼 (세이브 로드 시에도 작동) */}
                            {(activeEvent.bgmName || activeEvent.bgm) && (
                                <div className="uploaded-file-name" style={{ fontSize: '12px', color: '#d6336c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff0f6', padding: '6px 10px', borderRadius: '4px' }}>
                                    <span>🎶 BGM: {activeEvent.bgmName || extractNameFromUrl(activeEvent.bgm)}</span>
                                    <button 
                                        onClick={handleEventBgmClear} 
                                        style={{ background: 'transparent', border: 'none', color: '#fa5252', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '0 5px' }}
                                        title="BGM 삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 📅 상태창 설정 영역 */}
                    <div className="config-section divider">
                        <h4 className="config-title">📅 상태창 설정 (기본 설정)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>윗줄 텍스트</span>
                                <input type="text" className="input-base" placeholder="예: 2024. 03. 14 (화) ☀️" value={activeEvent.baseDate.month} onChange={(e) => handleBaseDateChange('month', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>아랫줄 텍스트</span>
                                <input type="text" className="input-base" placeholder="예: EPISODE 1 | 첫 만남" value={activeEvent.baseDate.time} onChange={(e) => handleBaseDateChange('time', e.target.value)} />
                            </div>
                            {/* ⭐ 일괄 적용 버튼 (윗줄/아랫줄 바로 아래 위치) */}
                            <button onClick={handleApplyBaseDateToAll} style={{ padding: '8px', marginTop: '5px', backgroundColor: '#e7f5ff', color: '#1971c2', border: '1px solid #74c0fc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                                🔄 이 설정으로 모든 컷의 상태창 통일하기
                            </button>
                        </div>
                    </div>
                </div>

                <div className="scenario-list">
                    {scenarios.map((scenario, index) => {
                        const isSelected = previewScenario?.index === index;
                        const effectiveDate = getEffectiveDateForIndex(index); 
                        const isFirstMainDialog = index === 0 && scenario.branch === 'main';
                        const cardClasses = `scenario-card branch-${scenario.branch} ${isSelected && showPreview ? 'preview-active' : ''} ${scenario.isCg ? 'is-cg' : ''} ${scenario.type === 'ending' ? 'type-ending' : ''} ${scenario.type === 'cg_image' ? 'type-cg-banner' : ''}`;                        

                        const hasEndingInThisBranch = scenarios.some(s => s.branch === scenario.branch && s.type === 'ending');
                        
                        const isNextAlsoCg = index < scenarios.length - 1 && scenarios[index + 1].isCg && scenarios[index + 1].branch === scenario.branch;

                        // ========== 1. 엔딩 컷 ==========
                        if (scenario.type === 'ending') {
                            return (
                                <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }} className={cardClasses}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#ffd43b' }}>🎬 엔딩</span>
                                            {scenario.branch?.startsWith('option') && (
                                                <span className="badge" style={{ backgroundColor: OPTION_COLORS[(parseInt(scenario.branch.replace('option', '')) - 1) % 10] }}>
                                                    선택지 {scenario.branch.replace('option', '')}번
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} className="btn-text-del">삭제</button>
                                    </div>
                                    <input type="text" placeholder="예시) BAD END: 마지막 잎새" value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} 
                                        style={{ width: '80%', padding: '12px', borderRadius: '6px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }} 
                                    />
                                </div>
                            );
                        }

                        // ========== 2. CG 배너 ==========
                        if (scenario.type === 'cg_image') {
                            return (
                                <div key={index} className={cardClasses}>
                                    <h4 style={{ color: '#845ef7', marginTop: 0 }}>🖼️ 삽입된 CG 일러스트</h4>
                                    <img src={scenario.src} alt="CG preview" style={{ width: '320px', height: '180px', border: '2px solid #845ef7', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div style={{ marginTop: '10px' }}><button onClick={() => removeScenarioInput(index)} className="btn-large bg-purple" style={{ padding: '5px 10px', fontSize: '12px' }}>CG 전체 삭제 (이미지+대사)</button></div>
                                </div>
                            );
                        }

                        // ========== 3. 일반 대사/선택지 컷 ==========
// ========== 3. 일반 대사/선택지 컷 ==========
                        return (
                            <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }} className={cardClasses}>
                                
                                {/* 1. 왼쪽 사이드바: 분기 설정이 아닐 때만 노출 */}
{/* 1. 왼쪽 사이드바: 분기 설정이 아닐 때만 노출 */}
<div className="scenario-sidebar">
                                    {scenario.type !== 'choice' && (
                                        <>
                                            {/* 윗줄 텍스트 (기존 스타일 유지) */}
                                            <div style={{ fontSize: '10px', color: '#868e96', fontWeight: 'bold', marginBottom: '2px' }}>
                                                {effectiveDate.month}
                                            </div>
                                            
                                            {/* ⭐ 아랫줄 텍스트 (윗줄과 똑같이 스타일 수정) */}
                                            <div style={{ fontSize: '10px', color: '#868e96', fontWeight: 'bold' }}>
                                                {effectiveDate.time}
                                            </div>
                                            {/* 버튼들을 너무 길지 않게 왼쪽 정렬(flex-start) */}
{/* 버튼 영역 */}
<div style={{ marginTop: '10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                {editingDateIndex === index ? (
                                                    <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                                        <button onClick={(e) => toggleDateEditMode(e, index, scenario, effectiveDate)} className="sidebar-btn" style={{ backgroundColor: '#2b8a3e', color: '#fff' }}>수정 완료</button>
                                                        <button onClick={(e) => clearDateOverride(e, index)} className="sidebar-btn" style={{ backgroundColor: '#fa5252', color: '#fff' }}>초기화</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={(e) => toggleDateEditMode(e, index, scenario, effectiveDate)} className="sidebar-btn" style={{ backgroundColor: '#f1f3f5', color: '#000', border: '1px solid #ced4da' }}>상태창 변경</button>
                                                )}

                                                {editingDateIndex === index && scenario.dateOverride && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px', width: '100%' }}>
                                                        <input type="text" placeholder="윗줄 텍스트" value={scenario.dateOverride.month} onChange={(e) => handleDateOverrideChange(index, 'month', e.target.value)} className="input-base sidebar-input" onClick={(e) => e.stopPropagation()} />
                                                        <input type="text" placeholder="아랫줄 텍스트" value={scenario.dateOverride.time} onChange={(e) => handleDateOverrideChange(index, 'time', e.target.value)} className="input-base sidebar-input" onClick={(e) => e.stopPropagation()} />
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="scenario-main">
                                    <div className="scenario-header" style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f3f5', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {scenario.type === 'choice' ? (
                                                <span style={{ backgroundColor: '#1971c2', color: 'white', padding: '4px 12px', borderRadius: '15px', fontWeight: '900', fontSize: '14px', letterSpacing: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🔀 분기 설정</span>
                                            ) : (
<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {/* 배경 없이 숫자만 깔끔하게 표시 */}
    <span style={{ 
        fontWeight: 'bold', 
        fontSize: '15px', 
        color: '#495057' 
    }}>
        {index + 1}
    </span>
    <span style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>번째 컷</span>
</div>
                                            )}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {scenario.branch?.startsWith('option') && (
                                                    <span className={`badge ${scenario.branch}`} style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: OPTION_COLORS[(parseInt(scenario.branch.replace('option', '')) - 1) % 10] }}>
                                                        선택지 {scenario.branch.replace('option', '')}번 루트
                                                    </span>
                                                )}
                                                {scenario.isCg && <span className="badge cg" style={{ fontSize: '10px', padding: '3px 8px' }}>🖼️ CG 모드</span>}
                                            </div>
                                        </div>
                                        {!isFirstMainDialog && (
                                            <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} 
                                                style={{ fontFamily: 'inherit',fontSize: '10px',backgroundColor: '#ffe3e3', color: '#e03131', border: '1px solid #ffc9c9', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#ffc9c9'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = '#ffe3e3'}>
                                                🗑️ 컷 삭제
                                            </button>
                                        )}
                                    </div>

                                    {scenario.type === 'choice' ? (
                                        /* --- 분기 설정 입력창 --- */
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ padding: '12px', backgroundColor: '#e7f5ff', borderLeft: '4px solid #1971c2', borderRadius: '4px', fontSize: '13px', color: '#1864ab', lineHeight: '1.5' }}>
                                                <strong>💡 화면에 표시될 선택지들을 입력해 주세요. (최대 10개)</strong><br/>
                                                각 선택지에 따라 스토리가 루트로 나뉩니다. 🎬엔딩을 넣지 않은 루트들은 자연스럽게 다음 이벤트로 넘어갑니다.
                                            </div>
                                            
                                            {(scenario.options || ['', '']).map((optText, optIdx) => (
                                                <div key={optIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#495057', fontSize: '14px', width: '20px' }}>{optIdx + 1}.</span>
                                                    <input 
                                                        type="text" 
                                                        placeholder={`선택지 ${optIdx + 1} 텍스트`} 
                                                        value={optText} 
                                                        onChange={(e) => {
                                                            const newScenarios = [...scenarios];
                                                            const currentOptions = [...(newScenarios[index].options || ['', ''])];
                                                            currentOptions[optIdx] = e.target.value;
                                                            newScenarios[index].options = currentOptions;
                                                            updateActiveScenarios(newScenarios);
                                                        }} 
                                                        className="input-base" 
                                                        style={{ flex: 1 }} 
                                                    />
                                                    {(scenario.options?.length || 2) > 2 && (
                                                        <button onClick={() => handleDeleteOption(index, optIdx)} style={{ padding: '8px 12px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {(scenario.options?.length || 2) < 10 && (
                                                <button onClick={() => handleAddOption(index)} style={{ marginTop: '5px', padding: '10px', backgroundColor: '#f1f3f5', color: '#495057', border: '2px dashed #adb5bd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ 선택지 추가</button>
                                            )}
                                        </div>
                                    ) : (
                                        /* --- 일반 대사 입력창 --- */
                                        <>
                                            {scenario.isCg ? (
                                                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#845ef7', backgroundColor: '#f3f0ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ CG 일러스트 배경</label>
                                                    <span style={{ fontSize: '12px', color: '#868e96', fontWeight: 'bold' }}>🔒 이 컷은 등록된 CG 일러스트로 배경이 고정됩니다.</span>
                                                </div>
                                            ) : (
                                                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1971c2', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ 이 컷의 배경</label>
                                                    <select value={scenario.bgType || PRESET_BACKGROUNDS[0]?.id} onChange={(e) => handleBgSelectChange(index, e.target.value)} className="input-base" style={{ fontSize: '12px', padding: '6px' }}>
                                                        <optgroup label="기본 제공 배경">
                                                            {PRESET_BACKGROUNDS.map(bg => <option key={bg.id} value={bg.id}>{bg.name}</option>)}
                                                        </optgroup>
                                                        {customBackgrounds.length > 0 && (
                                                            <optgroup label="나의 배경 보관함">
                                                                {customBackgrounds.map(bg => <option key={bg.id} value={bg.id}>{bg.name}</option>)}
                                                            </optgroup>
                                                        )}
                                                        <optgroup label="새로 추가하기">
                                                            <option value="custom_new">+ 직접 파일 업로드...</option>
                                                        </optgroup>
                                                    </select>
                                                    <input type="file" accept="image/*" ref={el => fileInputRefs.current[index] = el} onChange={(e) => handleBgUpload(e, index)} style={{ display: 'none' }} />
                                                    {scenario.bgImage && scenario.bgType !== 'custom_new' && <span style={{ fontSize: '12px', color: 'green' }}>✓ 적용됨</span>}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <select value={scenario.speaker} onChange={(e) => handleScenarioChange(index, 'speaker', e.target.value)} className="input-base" style={{ width: '130px' }}>
                                                    <option value="PROTAGONIST">❤️ {displayProtagonistName}</option>
                                                    <option value="나레이션">📢 나레이션</option>
                                                    {characters.filter(c => !c.isProtagonist).map((c, charIdx) => {
                                                        const defaultName = `등장인물 ${charIdx + 1}`;
                                                        return <option key={c.id} value={c.name || defaultName}>⭐️ {c.name || defaultName}</option>;
                                                    })}
                                                </select>
                                                <input type="text" placeholder="대사를 입력하세요..." value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} className="input-base" style={{ flex: 1 }} />
                                            </div>

{!scenario.isCg && (
<div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                                    {/* ⭐ 전역 갤러리 모드 Props 추가 */}
                                                    <ImageSelectorPanel 
                                                        title="🖼️ 초상화 표정 선택" type="portrait" characters={characters} 
                                                        selectedImage={scenario.protagonistImage} 
                                                        onSelect={(imgUrl) => handleScenarioChange(index, 'protagonistImage', imgUrl)} 
                                                        uiState={scenario.portraitUiState}
                                                        onUiStateChange={(state) => handleScenarioChange(index, 'portraitUiState', state)}
                                                        globalGalleryMode={isGlobalGalleryMode}
                                                        setGlobalGalleryMode={setIsGlobalGalleryMode}
                                                    />
                                                    {/* ⭐ 전역 갤러리 모드 Props 추가 */}
                                                    <ImageSelectorPanel 
                                                        title="🧍 스탠딩 표정 선택" type="standing" characters={characters} 
                                                        selectedImage={scenario.heroineImage} 
                                                        onSelect={(imgUrl) => handleScenarioChange(index, 'heroineImage', imgUrl)} 
                                                        uiState={scenario.standingUiState}
                                                        onUiStateChange={(state) => handleScenarioChange(index, 'standingUiState', state)}
                                                        globalGalleryMode={isGlobalGalleryMode}
                                                        setGlobalGalleryMode={setIsGlobalGalleryMode}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* 2. 하단 인라인 툴바: 분기 설정이 아닐 때만 노출 */}
                                    {scenario.type !== 'choice' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #edf2f7' }} onClick={(e) => e.stopPropagation()}>
                                            
                                            {/* 그룹 1: 흐름 복제 및 연장 */}
{/* 그룹 1: 흐름 복제 및 연장 */}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'copy'); }} className="action-btn" style={{ backgroundColor: 'rgba(255, 107, 129, 0.1)', color: '#ff4757' }}>
                                                    📋 대사 복사하기
                                                </button>
                                                
{scenario.isCg ? (
    !isNextAlsoCg && (
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                setIsCgMode(false); // 1. CG 모드 해제

                // 2. 추가될 일반 대사 데이터 생성
                const nextItem = { 
                    type: 'dialog', 
                    branch: scenario.branch, 
                    isCg: false, 
                    speaker: defaultSpeaker, 
                    protagonistImage: null, 
                    heroineImage: null, 
                    text: '', 
                    bgImage: PRESET_BACKGROUNDS[0]?.url, 
                    bgType: PRESET_BACKGROUNDS[0]?.id, 
                    dateOverride: null 
                };

                // 3. 현재 위치 다음에 삽입
                const newScenarios = [...scenarios]; 
                newScenarios.splice(index + 1, 0, nextItem); 
                updateActiveScenarios(newScenarios);

                // 4. (선택사항) 추가된 컷으로 미리보기 포커스 이동
                if (showPreview) {
                    setPreviewScenario({ ...nextItem, index: index + 1 });
                }
            }} 
            className="action-btn" 
            style={{ backgroundColor: 'rgba(55, 66, 250, 0.1)', color: '#3742fa' }}
        >
            💬 CG 모드 종료 일반 대사 시작
        </button>
    )
) : (
    /* ... 일반 대사 추가 버튼 로직 ... */
    <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'dialog'); }} className="action-btn" style={{ backgroundColor: 'rgba(51, 154, 240, 0.1)', color: '#1c7ed6' }}>
        💬 새로운 대사 추가
    </button>
)}
                                            </div>

                                            <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0' }} />
                                            
                                            {!isNextAlsoCg && (
                                                <>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <label className="action-btn" style={{ backgroundColor: 'rgba(132, 94, 247, 0.1)', color: '#6741d9' }}>
                                                            🖼️ CG 삽입
                                                            <input type="file" accept="image/*" onChange={(e) => handleInlineCgUpload(e, index, scenario)} style={{ display: 'none' }} onClick={(e) => e.stopPropagation()} />
                                                        </label>
                                                    </div>
                                                    <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0' }} />
                                                </>
                                            )}
                                            
                                            {/* 그룹 3: 구조 변경 */}
                                            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                                                {!hasChoiceNode && scenario.branch === 'main' && (
                                                    <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'choice'); }} className="action-btn" style={{ backgroundColor: 'rgba(255, 165, 2, 0.1)', color: '#e67e22' }}>🔀 선택지 분기</button>
                                                )}
                                                {!hasEndingInThisBranch && !(hasChoiceNode && scenario.branch === 'main') && (
                                                    <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'ending'); }} className="action-btn" style={{ backgroundColor: '#2f3542', color: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🎬 엔딩</button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 🌟 하단 작업 컨트롤러 (Action Bar) */}
{/* 🌟 하단 작업 컨트롤러 (Action Bar) */}
                <div className="controller-group" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                        const currentBranchScenarios = scenarios.filter(s => s.branch === currentBranch);
                        const isBranchValid = currentBranch === 'main' || (hasChoiceNode && currentBranch.startsWith('option'));
                        if (!isBranchValid) return null;
                        const currentTotalOpts = choiceNodeInfo ? (choiceNodeInfo.options?.length || 2) : 2;

                        return (
                            <>
                                {currentBranchScenarios.length === 0 && !hasEndingInCurrentBranch && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {/* ⭐ actionButtonStyle 대신 className="action-btn" 적용 */}
                                        <button 
                                            onClick={addScenarioInput} 
                                            className="action-btn"
                                            style={{ 
                                                backgroundColor: currentBranch === 'main' ? 'rgba(51, 154, 240, 0.1)' : `${OPTION_COLORS[(currentBranchNum - 1) % 10]}1A`, 
                                                color: currentBranch === 'main' ? '#1c7ed6' : OPTION_COLORS[(currentBranchNum - 1) % 10],
                                                flex: 1, height: '45px', fontSize: '13px' 
                                            }}
                                        >
                                            {currentBranch === 'main' ? '✨ 일반 대사 시작하기' : `✨ 선택지 ${currentBranchNum}번 루트 시작`}
                                        </button>
                                        
                                        <label 
                                            className="action-btn"
                                            style={{ backgroundColor: 'rgba(132, 94, 247, 0.1)', color: '#7048e8', flex: 1, height: '45px', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            🖼️ CG로 시작하기 <input type="file" accept="image/*" onChange={handleCgUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                )}
                                
                                {currentBranchScenarios.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {currentBranch.startsWith('option') && currentBranchNum < currentTotalOpts && (
                                            <button 
                                                onClick={() => { setIsCgMode(false); setCurrentBranch(`option${currentBranchNum + 1}`); }} 
                                                className="action-btn"
                                                style={{ 
                                                    backgroundColor: `${OPTION_COLORS[currentBranchNum % 10]}1A`, 
                                                    color: OPTION_COLORS[currentBranchNum % 10], 
                                                    width: '100%', height: '45px', fontSize: '13px', 
                                                    border: `1px dashed ${OPTION_COLORS[currentBranchNum % 10]}4D` 
                                                }}
                                            >
                                                ✔️ {currentBranchNum}번 루트 완료 → 다음 선택지({currentBranchNum + 1}번) 편집하기
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                    {/* ... (이하 엔딩 안내 문구 로직은 동일) */}
                    {hasEndingInCurrentBranch && (
                        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', color: '#718096', textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                            🔒 현재 분기({currentBranch === 'main' ? '일반 루트' : `루트 ${currentBranchNum}`})는 엔딩으로 마무리되었습니다.
                        </div>
                    )}
                    {isFullyEnded && (
                        <div style={{ marginTop: '10px', padding: '20px', background: 'linear-gradient(135deg, #2d3436 0%, #000000 100%)', color: '#ffd43b', textAlign: 'center', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
                            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🏁</div>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.5px' }}>모든 루트의 이야기가 완성되었습니다!</div>
                            <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px', fontWeight: '400' }}>이제 이 이벤트의 모든 분기에 엔딩이 존재합니다.</div>
                        </div>
                    )}
                </div>
            </div>
            
<div className="preview-toggle-wrap" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#212529' }}>📺 인게임 연출 미리보기</span>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
                미리보기 창의 상단바를 잡고 원하는 위치로 자유롭게 옮겨보세요!
            </span>
        </div>
        <label className="toggle-switch-label">
            <input type="checkbox" checked={showPreview} onChange={handleTogglePreview} style={{ opacity: 0, width: 0, height: 0 }} />
            <span className="toggle-switch-bg" style={{ backgroundColor: showPreview ? '#1971c2' : '#ccc' }}>
                <span className="toggle-switch-knob" style={{ left: showPreview ? '30px' : '4px' }} />
            </span>
        </label>
    </div>
</div>

        </div>
    );
}