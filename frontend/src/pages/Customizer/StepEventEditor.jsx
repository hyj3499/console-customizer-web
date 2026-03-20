// src/pages/Customizer/StepEventEditor.jsx
import { useState, useRef, useEffect } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepEventEditor.css';

// ==========================================
// 💡 Step2와 동일한 UI 에셋 통합 관리
// ==========================================
const PRESET_COLORS = [
    { id: 'pink', name: '핑크', value: 'rgba(255,182,193,0.8)', colors: ['#ffb6c1', '#faafbe'] },
    { id: 'black', name: '블랙', value: 'rgba(0,0,0,0.8)', colors: ['#444444', '#000000'] },
    { id: 'white', name: '화이트', value: 'rgba(255,255,255,0.8)', colors: ['#ffffff', '#e0e0e0'] },
    { id: 'blue', name: '블루', value: 'rgba(173,216,230,0.8)', colors: ['#add8e6', '#87ceeb'] },
    { id: 'purple', name: '퍼플', value: 'rgba(205,180,219,0.8)', colors: ['#d8bfd8', '#b19cd9'] }
];
const getColorId = (rgbaValue) => {
    const found = PRESET_COLORS.find(c => c.value === rgbaValue);
    return found ? found.id : 'pink'; 
};

const PRESET_BACKGROUNDS = [
    { id: 'bg_black', name: '검은 배경', url: '/images/bg_black.png' },
    { id: 'bg_school',    name: '교실', url: '/images/bg_school.png' },
    { id: 'bg_city',   name: '🌆 밤거리', url: '/images/bg_city.jpg' },
    { id: 'bg_park',   name: '🌳 공원', url: '/images/bg_park.jpg' },
    { id: 'bg_room',   name: '🛏️ 내 방', url: '/images/bg_room.jpg' }
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
        simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로 (이미지)', type: 'image', src: `/images/retro_calendar_${getColorId(bg)}.png` }) 
    }
};

export default function StepEventEditor() {
    const { 
        events, setEvents, activeEventId, setActiveEventId,
        showPreview, setShowPreview, previewScenario, setPreviewScenario,
        protagonist, characters, pFontStyle, globalUi,
        customBackgrounds, addCustomBackground 
    } = useCustomizerStore();

    const currentGlobalUi = globalUi || { calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', layoutMode: 'bottom' };

    const [currentBranch, setCurrentBranch] = useState('main'); 
    const [isCgMode, setIsCgMode] = useState(false);
    const [editingDateIndex, setEditingDateIndex] = useState(null); 
    const fileInputRefs = useRef({}); 

    const activeEvent = events.find(ev => ev.id === activeEventId) || events[0];
    const scenarios = activeEvent.scenarios;
    const hasChoiceNode = scenarios.some(s => s.type === 'choice');

    useEffect(() => {
        if (hasChoiceNode) {
            const hasOpt2 = scenarios.some(s => s.branch === 'option2'); 
            const opt1Ended = scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
            setCurrentBranch((hasOpt2 || opt1Ended) ? 'option2' : 'option1');
        } else {
            setCurrentBranch('main');
        }
    }, [activeEventId]); 

    const defaultSpeaker = 'PROTAGONIST'; 
    const displayProtagonistName = protagonist.name || '주인공';

    const isMainEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
    const isOption1Ended = scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
    const isOption2Ended = scenarios.some(s => s.branch === 'option2' && s.type === 'ending');
    const hasEndingInCurrentBranch = scenarios.some(s => s.branch === currentBranch && s.type === 'ending');
    
    const isFullyEnded = hasChoiceNode 
        ? (isOption1Ended && isOption2Ended) 
        : isMainEnded;

    const getEffectiveDateForIndex = (targetIndex) => {
        let currentDate = { ...activeEvent.baseDate };
        const targetScenario = scenarios[targetIndex];
        
        for (let i = 0; i <= targetIndex; i++) {
            const sc = scenarios[i];
            if (sc.branch === 'main' || sc.branch === targetScenario?.branch) {
                if (sc.dateOverride) {
                    currentDate = { ...sc.dateOverride };
                }
            }
        }
        return currentDate;
    };

    const updateActiveEvent = (updates) => {
        setEvents(events.map(ev => ev.id === activeEventId ? { ...ev, ...updates } : ev));
    };

    const handleEventBgmUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateActiveEvent({ 
                bgm: URL.createObjectURL(file), 
                bgmFile: file                  
            });
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

    const handleDateOverrideChange = (index, field, value) => {
        const newScenarios = [...scenarios];
        const currentOverride = newScenarios[index].dateOverride || { ...getEffectiveDateForIndex(index) };
        currentOverride[field] = value;
        newScenarios[index].dateOverride = currentOverride;
        updateActiveScenarios(newScenarios);

        if (showPreview) {
            setPreviewScenario({ ...newScenarios[index], index });
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
        const lastBg = scenarios.length > 0 ? scenarios[scenarios.length-1].bgImage : null;
        const lastBgType = scenarios.length > 0 ? scenarios[scenarios.length-1].bgType : 'bg_school';
        updateActiveScenarios([...scenarios, { type: 'dialog', branch: currentBranch, isCg: isCgMode, speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: lastBg, bgType: lastBgType, dateOverride: null }]);
    };

    const addEndingInput = () => {
        updateActiveScenarios([...scenarios, { type: 'ending', branch: currentBranch, text: '' }]);
    };

    const insertScenarioAfter = (index, currentItem) => {
        const newScenarios = [...scenarios];
        let newBranch = currentItem.type === 'choice' ? 'option1' : currentItem.branch;
        newScenarios.splice(index + 1, 0, { type: 'dialog', branch: newBranch, isCg: currentItem.isCg || currentItem.type === 'cg_image', speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: currentItem.bgImage, bgType: currentItem.bgType || 'bg_school', dateOverride: null });
        updateActiveScenarios(newScenarios);
    };

    const removeScenarioInput = (indexToRemove) => {
        const item = scenarios[indexToRemove];
        if (indexToRemove === 0 && item.branch === 'main') return alert('🚨 컷 1은 삭제할 수 없습니다!');

        if (item.type === 'cg_image') {
            if (!window.confirm("CG 일러스트를 삭제하면 관련된 대사들이 모두 삭제됩니다.")) return;
            updateActiveScenarios(scenarios.filter(s => !s.isCg && s.type !== 'cg_image'));
            setIsCgMode(false);
            return;
        }
        if (item.type === 'choice') {
            if (!window.confirm("선택지 분기를 삭제하면 하위 대사들(1번/2번 루트)도 모두 삭제됩니다.")) return;
            updateActiveScenarios(scenarios.filter((s, idx) => idx !== indexToRemove && s.branch !== 'option1' && s.branch !== 'option2'));
            setCurrentBranch('main');
            return;
        }

        const newScenarios = scenarios.filter((_, index) => index !== indexToRemove);
        if (item.branch === 'option1' && newScenarios.filter(s => s.branch === 'option1').length === 0) return alert('선택지 1번 루트의 대사는 최소 1개 이상 존재해야 합니다.');
        if (item.branch === 'option2' && newScenarios.filter(s => s.branch === 'option2').length === 0) setCurrentBranch('option1');
        
        updateActiveScenarios(newScenarios);
        if (previewScenario && previewScenario.index === indexToRemove) setPreviewScenario(null);
    };

    const addChoiceInput = () => {
        if (hasChoiceNode) return alert("하나의 이벤트에는 하나의 선택지 분기만 생성할 수 있습니다.");
        setIsCgMode(false);
        updateActiveScenarios([...scenarios, { type: 'choice', option1: '', option2: '' }]);
        setCurrentBranch('option1');
    };

    const handleCgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        
        setIsCgMode(true);
        const newScenarios = [...scenarios, 
            { type: 'cg_image', src: objectUrl, file: file, branch: currentBranch },
            { type: 'dialog', branch: currentBranch, isCg: true, speaker: defaultSpeaker, text: '', bgImage: objectUrl, file: file, bgType: 'custom_cg', dateOverride: null }
        ];
        updateActiveScenarios(newScenarios);
    };

    const getActiveSpeakerStyle = (speakerId) => {
        if (!speakerId || speakerId === '나레이션' || speakerId === 'PROTAGONIST') return pFontStyle;
        const char = characters.find(c => c.name === speakerId);
        return char ? char.fontStyle : pFontStyle;
    };

    const getSpeakerName = (speakerId) => {
        if (!speakerId) return '';
        if (speakerId === 'PROTAGONIST') return protagonist.name || '주인공';
        return speakerId; 
    };

    // 현재 말하는 사람의 스타일 (폰트, 대화창 테마 용도)
    const activeStyle = previewScenario ? getActiveSpeakerStyle(previewScenario.speaker) : pFontStyle;
    const renderFontFamily = activeStyle?.font || currentGlobalUi?.systemFont || 'sans-serif';

    const dAsset = (UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle.dialogColor, activeStyle.dialogBorderColor);
    const nAsset = (UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle.nameColor, activeStyle.nameBorderColor);
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.retro)(currentGlobalUi.calendarColor); 

    // ⭐ 버그 1 해결: 초상화 프레임은 무조건 주인공(pFontStyle)의 값을 참조하도록 고정
    const pAsset = (UI_ASSETS.portrait[pFontStyle.portraitStyle] || UI_ASSETS.portrait.square)(pFontStyle.portraitColor, pFontStyle.portraitBorderColor);
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

    useEffect(() => {
        if (showPreview && previewScenario) {
            const currentSceneInStore = scenarios[previewScenario.index];
            if (currentSceneInStore) {
                setPreviewScenario({ ...currentSceneInStore, index: previewScenario.index });
            }
        }
    }, [scenarios, showPreview]);

    const layoutClass = currentGlobalUi.layoutMode === 'bottom' ? 'layout-bottom' : 'layout-classic';

    return (
        <div className="editor-container">
            
            <div className="preview-toggle-wrap">
                <span style={{ fontWeight: 'bold' }}>📺 인게임 연출 미리보기 모드</span>
                <label className="toggle-switch-label">
                    <input type="checkbox" checked={showPreview} onChange={handleTogglePreview} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span className="toggle-switch-bg" style={{ backgroundColor: showPreview ? '#1971c2' : '#ccc' }}>
                        <span className="toggle-switch-knob" style={{ left: showPreview ? '30px' : '4px' }} />
                    </span>
                </label>
            </div>

            {showPreview && previewScenario && (previewScenario.type === 'dialog' || previewScenario.type === 'ending') && (
                <div className="sticky-win95-preview">
                    <div className="win95-preview-title">
                        <h5>Scene Preview: 컷 {previewScenario.index + 1}</h5>
                        <button className="win95-close-btn" onClick={() => { setShowPreview(false); setPreviewScenario(null); }}>X</button>
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
                                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>
                                                {previewDate.month}
                                            </span>
                                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>
                                                {previewDate.time}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
{previewScenario.protagonistImage && (
                                    <div className="ig-portrait-area">
                                        {/* 🚨 수정: zIndex를 3에서 1로 내려서 배경(프레임)으로 깔리게 만듦 */}
                                        {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 1 }} />}
                                        
                                        <div style={{
                                            position: 'absolute', width: '100%', height: '100%', 
                                            zIndex: 2, /* 🌟 주인공 사진이 프레임 위(zIndex 1)에 올라가도록 유지 */
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
                                        backgroundColor: nAsset.type === 'image' ? 'transparent' : (activeStyle.nameColor || 'rgba(0,0,0,0.8)'), 
                                        backgroundImage: nAsset.type === 'image' ? `url(${nAsset.src})` : 'none', 
                                        border: nAsset.type === 'css' ? finalNameBorder : 'none', 
                                        borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0'
                                    }}>
                                        <span style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh'}}>
                                            {getSpeakerName(previewScenario.speaker)}
                                        </span>
                                    </div>
                                )}

                                <div className="ig-dialogbox" style={{
                                    backgroundColor: dAsset.type === 'image' ? 'transparent' : (activeStyle.dialogColor || 'rgba(0,0,0,0.8)'), backgroundImage: dAsset.type === 'image' ? `url(${dAsset.src})` : 'none',
                                    border: dAsset.type === 'css' ? finalDialogBorder : 'none', borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0'                                }}>
                                    <p style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh', marginTop: 0 }}>
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

            {/* (...아래 이벤트 탭 및 시나리오 리스트 등 렌더링 코드는 기존과 완벽히 동일하므로 생략 없이 사용 가능합니다) */}
            <div className="event-tabs-wrap">
                {events.map(ev => (
                    <div key={ev.id} className="event-tab">
                        <button onClick={() => { 
                                setActiveEventId(ev.id); 
                                setPreviewScenario(null); 
                                setIsCgMode(false);
                                
                                const hasChoice = ev.scenarios.some(s => s.type === 'choice');
                                if (hasChoice) {
                                    const hasOpt2 = ev.scenarios.some(s => s.branch === 'option2');
                                    const opt1Ended = ev.scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
                                    setCurrentBranch((hasOpt2 || opt1Ended) ? 'option2' : 'option1');
                                } else {
                                    setCurrentBranch('main');
                                }
                            }}
                            className={`event-tab-btn ${activeEventId === ev.id ? 'active' : 'inactive'}`}
                        >
                            {ev.title}
                        </button>
                        {ev.id !== 1 && (
                            <button onClick={(e) => deleteEvent(e, ev.id)} className="event-tab-del" style={{ color: activeEventId === ev.id ? '#ffc9c9' : '#adb5bd' }}>✖</button>
                        )}
                    </div>
                ))}
                <button onClick={addNewEvent} className="event-add-btn">+ 새 이벤트</button>
            </div>

            <div className="editor-main-area">
                <div className="config-panel">
                    <div style={{ flex: 1 }}>
                        <h4 className="config-title">🎵 {activeEvent.title} BGM 설정</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input type="file" accept="audio/*" onChange={handleEventBgmUpload} />
                            {activeEvent.bgm && <audio src={activeEvent.bgm} controls style={{ height: '30px' }} />}
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, borderLeft: '1px dashed #dee2e6', paddingLeft: '20px' }}>
                        <h4 className="config-title">📅 이벤트 시작 일시 (기본값)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>윗줄에 표시될 텍스트</span>
                                <input type="text" className="input-base" placeholder="DATE: 1月 01日" value={activeEvent.baseDate.month} onChange={(e) => handleBaseDateChange('month', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>아래에 표시될 텍스트</span>
                                <input type="text" className="input-base" placeholder="TIME: 12:00" value={activeEvent.baseDate.time} onChange={(e) => handleBaseDateChange('time', e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>달력안에 들어갈 텍스트</span>
                                <input type="text" className="input-base" placeholder="01日" value={activeEvent.baseDate.day} onChange={(e) => handleBaseDateChange('day', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="scenario-list">
                    {scenarios.map((scenario, index) => {
                        const isSelected = previewScenario?.index === index;
                        const activeSpeakerChar = characters.find(c => c.name === scenario.speaker);
                        const effectiveDate = getEffectiveDateForIndex(index); 
                        const isFirstMainDialog = index === 0 && scenario.branch === 'main';

                        const cardClasses = `scenario-card branch-${scenario.branch} ${isSelected && showPreview ? 'preview-active' : ''} ${scenario.isCg ? 'is-cg' : ''} ${scenario.type === 'ending' ? 'type-ending' : ''} ${scenario.type === 'cg_image' ? 'type-cg-banner' : ''}`;

                        if (scenario.type === 'ending') {
                            return (
                                <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }} className={cardClasses}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#ffd43b' }}>🎬 엔딩 연출</span>
                                            {scenario.branch === 'option1' && <span className="badge opt1">선택지 1번</span>}
                                            {scenario.branch === 'option2' && <span className="badge opt2">선택지 2번</span>}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} className="btn-text-del">삭제</button>
                                    </div>
                                    <input type="text" placeholder="EX 엔딩2: 슬픈 개구리" value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} 
                                        style={{ width: '80%', padding: '12px', borderRadius: '6px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }} 
                                    />
                                    <p style={{ fontSize: '12px', color: '#868e96', marginTop: '10px' }}>이 대사가 출력된 후 게임이 종료됩니다.</p>
                                </div>
                            );
                        }

                        if (scenario.type === 'cg_image') {
                            return (
                                <div key={index} className={cardClasses}>
                                    <h4 style={{ color: '#845ef7', marginTop: 0 }}>🖼️ 삽입된 CG 일러스트</h4>
                                    <img src={scenario.src} alt="CG preview" style={{ width: '320px', height: '180px', border: '2px solid #845ef7', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div style={{ marginTop: '10px' }}><button onClick={() => removeScenarioInput(index)} className="btn-large bg-purple" style={{ padding: '5px 10px', fontSize: '12px' }}>CG 전체 삭제 (이미지+대사)</button></div>
                                </div>
                            );
                        }

                        return (
                            <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }} className={cardClasses}>
                                <div className="scenario-sidebar">
                                    <div style={{ fontSize: '10px', color: '#868e96', fontWeight: 'bold', marginBottom: '5px' }}>{effectiveDate.month}</div>
                                    <div style={{ fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>{effectiveDate.time}</div>
                                    <div style={{ marginTop: '10px', width: '100%' }}>
                                        <button onClick={(e) => toggleDateEditMode(e, index, scenario, effectiveDate)} style={{ width: '100%', padding: '4px 0', fontSize: '10px', backgroundColor: editingDateIndex === index ? '#2b8a3e' : '#f1f3f5', color: editingDateIndex === index ? '#fff' : '#000', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {editingDateIndex === index ? '수정 완료' : '시간 변경'}
                                        </button>
                                        {scenario.dateOverride && editingDateIndex !== index && (
                                             <button onClick={(e) => clearDateOverride(e, index)} style={{ width: '100%', marginTop: '5px', padding: '2px 0', fontSize: '10px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>초기화</button>
                                        )}
                                        {editingDateIndex === index && scenario.dateOverride && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px' }}>
                                                <input type="text" placeholder="윗줄 텍스트" title="윗줄에 표시될 텍스트" value={scenario.dateOverride.month} onChange={(e) => handleDateOverrideChange(index, 'month', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />
                                                <input type="text" placeholder="아랫줄 텍스트" title="아래에 표시될 텍스트" value={scenario.dateOverride.time} onChange={(e) => handleDateOverrideChange(index, 'time', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />
                                                <input type="text" placeholder="달력 내부 텍스트" title="달력안에 들어갈 텍스트" value={scenario.dateOverride.day} onChange={(e) => handleDateOverrideChange(index, 'day', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="scenario-main">
                                    <div className="scenario-header" style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f3f5', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {scenario.type === 'choice' ? (
                                                <span style={{ backgroundColor: '#1971c2', color: 'white', padding: '4px 12px', borderRadius: '15px', fontWeight: '900', fontSize: '14px', letterSpacing: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🔀 분기 설정</span>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', backgroundColor: '#343a40', color: 'white', borderRadius: '50%', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{index + 1}</span>
                                                    <span style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>번째 컷</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {scenario.branch === 'option1' && <span className="badge opt1" style={{ fontSize: '12px', padding: '3px 8px' }}>루트 A (선택지 1)</span>}
                                                {scenario.branch === 'option2' && <span className="badge opt2" style={{ fontSize: '12px', padding: '3px 8px' }}>루트 B (선택지 2)</span>}
                                                {scenario.isCg && <span className="badge cg" style={{ fontSize: '12px', padding: '3px 8px' }}>🖼️ CG 모드</span>}
                                            </div>
                                        </div>
                                        {!isFirstMainDialog && (
                                            <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} 
                                                style={{ backgroundColor: '#ffe3e3', color: '#e03131', border: '1px solid #ffc9c9', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                                                onMouseOver={(e) => e.target.style.backgroundColor = '#ffc9c9'}
                                                onMouseOut={(e) => e.target.style.backgroundColor = '#ffe3e3'}>
                                                🗑️ 컷 삭제
                                            </button>
                                        )}
                                    </div>

                                    {scenario.type === 'choice' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ padding: '12px', backgroundColor: '#e7f5ff', borderLeft: '4px solid #1971c2', borderRadius: '4px', fontSize: '13px', color: '#1864ab', lineHeight: '1.5' }}>
                                                <strong>💡 화면에 표시될 두 가지 선택지를 입력해 주세요.</strong><br/>
                                                각 선택지에 따라 스토리가 A/B 루트로 나뉩니다.<br/>
                                                <span style={{ color: '#495057', fontSize: '12px' }}>(※ 루트 마지막에 🎬엔딩을 넣지 않으면, 어느 쪽을 고르든 자연스럽게 다음 이벤트로 넘어갑니다.)</span>
                                            </div>
                                            <input type="text" placeholder="선택지 1 텍스트" value={scenario.option1 || ''} onChange={(e) => handleScenarioChange(index, 'option1', e.target.value)} className="input-base" />
                                            <input type="text" placeholder="선택지 2 텍스트" value={scenario.option2 || ''} onChange={(e) => handleScenarioChange(index, 'option2', e.target.value)} className="input-base" />
                                        </div>
                                    ) : (
                                        <>
                                            {scenario.isCg ? (
                                                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#845ef7', backgroundColor: '#f3f0ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ CG 일러스트 배경</label>
                                                    <span style={{ fontSize: '12px', color: '#868e96', fontWeight: 'bold' }}>🔒 이 컷은 등록된 CG 일러스트로 배경이 고정됩니다.</span>
                                                </div>
                                            ) : (
                                                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1971c2', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ 이 컷의 배경</label>
                                                    <select value={scenario.bgType || 'bg_school'} onChange={(e) => handleBgSelectChange(index, e.target.value)} className="input-base" style={{ fontSize: '12px', padding: '6px' }}>
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
                                                <select value={scenario.speaker} onChange={(e) => handleScenarioChange(index, 'speaker', e.target.value)} className="input-base" style={{ width: '120px' }}>
                                                    <option value="PROTAGONIST">{displayProtagonistName}</option>
                                                    <option value="나레이션">나레이션</option>
                                                    {characters.map((c, charIdx) => {
                                                        const defaultName = `등장인물 ${charIdx + 1}`;
                                                        return <option key={c.id} value={c.name || defaultName}>{c.name || defaultName}</option>;
                                                    })}
                                                </select>
                                                <input type="text" placeholder="대사를 입력하세요..." value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} className="input-base" style={{ flex: 1 }} />
                                            </div>

                                            {!scenario.isCg && (
                                                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                                    <div className="face-panel">
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>👤 주인공 표정</span>
                                                        <div className="face-list">
                                                            <div onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'protagonistImage', null); }} className="face-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', fontSize: '18px', borderColor: scenario.protagonistImage === null ? '#fa5252' : '#ccc', borderWidth: scenario.protagonistImage === null ? '3px' : '1px' }}>🚫</div>
                                                            {protagonist.images.map((img, i) => (
                                                                <img key={i} src={img.preview} alt="p" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'protagonistImage', img.preview); }} className={`face-img ${scenario.protagonistImage === img.preview ? 'active-p' : ''}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="face-panel">
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>🎭 상대방 표정</span>
                                                        <div className="face-list">
                                                            <div onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', null); }} className="face-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', fontSize: '18px', borderColor: scenario.heroineImage === null ? '#fa5252' : '#ccc', borderWidth: scenario.heroineImage === null ? '3px' : '1px' }}>🚫</div>
                                                            {(!activeSpeakerChar) && characters.flatMap(c => c.images).map((img, i) => (
                                                                <img key={`all-${i}`} src={img.preview} alt="h" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', img.preview); }} className={`face-img ${scenario.heroineImage === img.preview ? 'active-h' : ''}`} />
                                                            ))}
                                                            {activeSpeakerChar && activeSpeakerChar.images.map((img, i) => (
                                                                <img key={`spec-${i}`} src={img.preview} alt="h" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', img.preview); }} className={`face-img ${scenario.heroineImage === img.preview ? 'active-h' : ''}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario); }} style={{ width: '100%', padding: '5px', backgroundColor: '#f1f3f5', border: '1px dashed #adb5bd', borderRadius: '4px', cursor: 'pointer', color: '#868e96' }}>+ 이 컷 아래에 대사 추가</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="controller-group">
                    {!hasEndingInCurrentBranch ? (
                        <>
                            {currentBranch === 'main' && !hasChoiceNode && <button onClick={addScenarioInput} className="btn-large bg-blue">+ 일반 대사 추가</button>}
                            {currentBranch === 'option1' && <button onClick={addScenarioInput} className="btn-large bg-green">+ 선택지 1번 루트 대사 추가</button>}
                            {currentBranch === 'option2' && <button onClick={addScenarioInput} className="btn-large bg-orange">+ 선택지 2번 루트 대사 추가</button>}
                            {!isCgMode && (currentBranch !== 'main' || !hasChoiceNode) && (
                                <label className="btn-large bg-purple">
                                    🖼️ 이벤트 CG 추가 <input type="file" accept="image/*" onChange={handleCgUpload} style={{ display: 'none' }} />
                                </label>
                            )}
                            {isCgMode && <button onClick={() => setIsCgMode(false)} className="btn-large bg-indigo">⏹️ CG 대화 종료</button>}
                            {currentBranch === 'main' && !isCgMode && !hasChoiceNode && <button onClick={addChoiceInput} className="btn-large bg-gray">+ 선택지 분기 추가</button>}
                            {!isCgMode && (currentBranch !== 'main' || !hasChoiceNode) && (
                                <button onClick={addEndingInput} className="btn-ending">🎬 엔딩 추가</button>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#e9ecef', color: '#868e96', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold' }}>
                            🔒 현재 분기(루트)는 엔딩으로 마무리되어 더 이상 대사를 추가할 수 없습니다.
                        </div>
                    )}
                </div>
                {currentBranch === 'option1' && (
                    <button onClick={() => { setIsCgMode(false); setCurrentBranch('option2'); }} className="btn-large bg-orange" style={{ width: '100%', marginTop: '10px' }}>
                        ✔️ 선택지 1번 루트 종료 (2번 작성 시작)
                    </button>
                )}

                {isFullyEnded && (
                    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#212529', color: '#ffd43b', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold', border: '2px solid #ffd43b', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎊</div>
                        모든 루트에 엔딩이 생겼습니다! 이 이벤트가 마지막 끝입니다.<br/>
                        <span style={{ fontSize: '14px', color: '#ced4da', fontWeight: 'normal', marginTop: '5px', display: 'inline-block' }}>이 이후의 이벤트는 게임에 구현되지 않습니다!</span>
                    </div>
                )}
            </div>
        </div>
    );
}