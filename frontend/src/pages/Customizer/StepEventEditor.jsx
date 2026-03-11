// src/pages/Customizer/StepEventEditor.jsx
import { useState, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';

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

// ⭐ 서버 제공 기본 배경 프리셋 목록
const PRESET_BACKGROUNDS = [
    { id: 'bg_school', name: '🏫 교실', url: '/images/bg_school.png' },
    { id: 'bg_sea',    name: '🌊 바다', url: '/images/bg_sea.jpg' },
    { id: 'bg_city',   name: '🌆 밤거리', url: '/images/bg_city.jpg' },
    { id: 'bg_park',   name: '🌳 공원', url: '/images/bg_park.jpg' },
    { id: 'bg_room',   name: '🛏️ 내 방', url: '/images/bg_room.jpg' }
];

const UI_ASSETS = {
    dialog: {
        simple: (bg, border='#dddddd') => ({ type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        gothic: (bg, border='#a9a9a9') => ({ type: 'css', border: `4px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ type: 'css', border: `3px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ type: 'image', src: `/images/retro_dialog_${getColorId(bg)}.png` }) 
    },
    namebox: {
        simple: (bg, border='#dddddd') => ({ type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
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

    const currentGlobalUi = globalUi || { calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard' };

    const [currentBranch, setCurrentBranch] = useState('main'); 
    const [isCgMode, setIsCgMode] = useState(false);
    const fileInputRefs = useRef({}); 

    const activeEvent = events.find(ev => ev.id === activeEventId) || events[0];
    const scenarios = activeEvent.scenarios;
    const hasChoiceNode = scenarios.some(s => s.type === 'choice');

    const defaultSpeaker = 'PROTAGONIST'; 
    const displayProtagonistName = protagonist.name || '주인공';

    // --- 🚨 엔딩 추적 로직 추가 ---
    const isMainEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
    const isOption1Ended = scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
    const isOption2Ended = scenarios.some(s => s.branch === 'option2' && s.type === 'ending');
    
    // 현재 작성 중인 분기에 엔딩이 등록되었는지 확인 (엔딩 이후 대사 추가 방지용)
    const hasEndingInCurrentBranch = scenarios.some(s => s.branch === currentBranch && s.type === 'ending');
    
    // 이 이벤트의 모든 루트가 엔딩으로 끝났는지 확인
    const isFullyEnded = hasChoiceNode 
        ? (isOption1Ended && isOption2Ended) 
        : isMainEnded;

    // --- ✨ 날짜 추적 시스템 ---
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

    // --- ✨ 이벤트 관리 로직 ---
    const updateActiveEvent = (updates) => {
        setEvents(events.map(ev => ev.id === activeEventId ? { ...ev, ...updates } : ev));
    };

    const handleEventBgmUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateActiveEvent({ 
                bgm: URL.createObjectURL(file), // 화면 미리보기용 임시 주소 (blob)
                bgmFile: file                   // 🌟 서버 전송용 실제 물리 파일 객체 추가!
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
            id: newId, title: newTitle, bgm: null, baseDate: { month: 'JAN', day: '01', time: '12:00' },
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
                ...ev,
                id: index + 1,
                title: `이벤트 ${index + 1}`
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

    // --- ✨ 시나리오 데이터 관리 ---
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

        if (showPreview) setPreviewScenario({ ...newScenarios[index], index });
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

    // 🚨 엔딩 블록 추가 핸들러
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

    // --- ✨ 분기 및 CG 관리 ---
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
            { 
                type: 'dialog', 
                branch: currentBranch, 
                isCg: true, 
                speaker: defaultSpeaker, 
                text: '', 
                bgImage: objectUrl, 
                file: file,
                bgType: 'custom_cg', 
                dateOverride: null 
            }
        ];
        
        updateActiveScenarios(newScenarios);
    };

    // --- 🎨 인게임 미리보기 에셋 로드 ---
// 💡 [수정] speakerName이 'PROTAGONIST'일 때 주인공 스타일(pFontStyle)을 반환하도록 수정
    const getActiveSpeakerStyle = (speakerName) => {
        if (!speakerName || speakerName === '나레이션' || speakerName === 'PROTAGONIST') return pFontStyle;
        const char = characters.find(c => c.name === speakerName);
        return char ? char.fontStyle : pFontStyle;
    };

    const activeStyle = previewScenario ? getActiveSpeakerStyle(previewScenario.speaker) : pFontStyle;
    const renderFontFamily = activeStyle.font && activeStyle.font !== '' ? activeStyle.font : (currentGlobalUi.systemFont || 'sans-serif');
    
    const dAsset = (UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle.dialogColor, activeStyle.dialogBorderColor);
    const nAsset = (UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle.nameColor, activeStyle.nameBorderColor);
    const pAsset = (UI_ASSETS.portrait[activeStyle.portraitStyle] || UI_ASSETS.portrait.square)(activeStyle.portraitColor, activeStyle.portraitBorderColor);
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.retro)(currentGlobalUi.calendarColor); 

    const getCalendarTextShadow = () => {
        if (!currentGlobalUi.calendarTextUseOutline) return 'none';
        const oc = currentGlobalUi.calendarTextOutlineColor || '#ffffff';
        return `-1px -1px 0 ${oc}, 1px -1px 0 ${oc}, -1px 1px 0 ${oc}, 1px 1px 0 ${oc}`;
    };

    const previewDate = previewScenario ? getEffectiveDateForIndex(previewScenario.index) : activeEvent.baseDate;
    const isNarration = previewScenario?.speaker === '나레이션';

    // 💡 [추가] 화면에 표시할 최종 화자 이름을 결정하는 함수
    const getSpeakerName = (speakerId) => {
        if (!speakerId) return '';
        if (speakerId === 'PROTAGONIST') return displayProtagonistName;
        return speakerId;
    };

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* --- 미리보기 토글 스위치 --- */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>📺 인게임 연출 미리보기 모드</span>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                    <input type="checkbox" checked={showPreview} onChange={handleTogglePreview} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: showPreview ? '#1971c2' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
                        <span style={{ position: 'absolute', height: '16px', width: '16px', left: showPreview ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                    </span>
                </label>
            </div>

            {/* --- ✨ 완벽 구현된 인게임 미리보기 화면 --- */}
            {/* 🚨 미리보기 렌더링 조건에 'ending' 타입 추가 */}
            {showPreview && previewScenario && (previewScenario.type === 'dialog' || previewScenario.type === 'ending') && (
                <div style={{ position: 'sticky', top: '10px', zIndex: 100, backgroundColor: '#1a1b1e', padding: '15px', borderRadius: '12px', border: '4px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h5 style={{ margin: 0, color: '#ffd43b' }}>🎥 Scene Preview: 컷 {previewScenario.index + 1}</h5>
                        <button onClick={() => { setShowPreview(false); setPreviewScenario(null); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                    </div>
                    
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', containerType: 'size' }}>
                        
                        {/* 🚨 엔딩 타입 렌더링 분기 */}
                        {previewScenario.type === 'ending' ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                                <span style={{ fontFamily: renderFontFamily, color: '#fff', fontSize: '4cqh', fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                                    {previewScenario.text || "엔딩 대사를 입력하세요"}
                                </span>
                            </div>
                        ) : (
                            <>
                                {previewScenario.bgImage && <img src={previewScenario.bgImage} alt="bg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                                {previewScenario.heroineImage && <img src={previewScenario.heroineImage} alt="standing" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '92.6%', objectFit: 'contain' }} />}

                                {!previewScenario.isCg && (
                                    <div style={{ position: 'absolute', left: '13.02%', top: '4.63%', display: 'flex', alignItems: 'center', gap: '1.3cqw', zIndex: 11 }}>
                                        <div style={{
                                            width: '7.81cqw', height: '7.81cqw', backgroundColor: cAsset.type === 'image' ? 'transparent' : (currentGlobalUi.calendarColor || 'rgba(255,255,255,0.8)'),
                                            backgroundImage: cAsset.type === 'image' ? `url(${cAsset.src})` : 'none', backgroundSize: '100% 100%',
                                            border: cAsset.type === 'css' ? cAsset.border : 'none', borderRadius: cAsset.type === 'css' ? cAsset.borderRadius : '0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '3.5cqh', color: '#5C4033', fontWeight: 'bold', textShadow: getCalendarTextShadow(), marginTop: '10px' }}>{previewDate.day}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqh' }}>
                                            <span style={{ fontSize: '2cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>DATE: {previewDate.month} {previewDate.day}</span>
                                            <span style={{ fontSize: '2cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>TIME: {previewDate.time}</span>
                                        </div>
                                    </div>
                                )}

                                {previewScenario.protagonistImage && (
                                    <div style={{ position: 'absolute', left: '13.02%', top: '72.22%', width: '13.02%', height: '23.15%', zIndex: 10, overflow: 'visible' }}>
                                        {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 1 }} />}
                                        <div style={{
                                            position: 'absolute', width: '100%', height: '100%', zIndex: 2, backgroundColor: pAsset.type === 'image' ? 'transparent' : (activeStyle.portraitColor || 'rgba(255,182,193,0.8)'),
                                            WebkitMaskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', maskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none',
                                            WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                                            borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', border: pAsset.type === 'css' ? pAsset.border : 'none', boxSizing: 'border-box', overflow: 'hidden'
                                        }}>
                                            <img src={previewScenario.protagonistImage} alt="주인공" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                )}
                                {/* ⭐ 반응형 네임칸 적용 (우측 고정, 좌측 확장) */}
{/* ⭐ 반응형 네임칸 적용 (우측 고정, 좌측 확장) */}
                                {previewScenario.speaker && !isNarration && (
                                    <div style={{
                                        position: 'absolute', 
                                        top: '66.66%', 
                                        left: '27.6%', 
                                        right: 'auto',
                                        width: 'fit-content',
                                        minWidth: '9.37%',
                                        height: '4.63%',
                                        padding: '0 2cqw',
                                        whiteSpace: 'nowrap',
                                        boxSizing: 'border-box',
                                        backgroundColor: nAsset.type === 'image' ? 'transparent' : (activeStyle.nameColor || 'rgba(0,0,0,0.8)'), 
                                        backgroundImage: nAsset.type === 'image' ? `url(${nAsset.src})` : 'none', 
                                        backgroundSize: '100% 100%',
                                        border: nAsset.type === 'css' ? nAsset.border : 'none', 
                                        borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11
                                    }}>
                                        {/* 💡 [수정] getSpeakerName 함수를 사용하여 이름 출력 */}
                                        <span style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '2.5cqh', fontWeight: 'bold' }}>
                                            {getSpeakerName(previewScenario.speaker)}
                                        </span>
                                    </div>
                                )}

                                <div style={{
                                    position: 'absolute', left: '27.6%', top: '72.22%', width: '57.3%', height: '23.15%',
                                    backgroundColor: dAsset.type === 'image' ? 'transparent' : (activeStyle.dialogColor || 'rgba(0,0,0,0.8)'), backgroundImage: dAsset.type === 'image' ? `url(${dAsset.src})` : 'none', backgroundSize: '100% 100%',
                                    border: dAsset.type === 'css' ? dAsset.border : 'none', borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0', padding: '3cqh 4cqw', boxSizing: 'border-box', zIndex: 11
                                }}>
                                    <p style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh', marginTop: 0 }}>
                                        {previewScenario.text}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- 상단 이벤트 탭 네비게이션 --- */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px', borderBottom: '2px solid #eee' }}>
                {events.map(ev => (
                    <div key={ev.id} style={{ position: 'relative', display: 'flex' }}>
                        <button onClick={() => { setActiveEventId(ev.id); setPreviewScenario(null); setCurrentBranch('main'); setIsCgMode(false); }}
                            style={{ 
                                padding: '10px 30px 10px 20px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', 
                                backgroundColor: activeEventId === ev.id ? '#1971c2' : '#e9ecef', color: activeEventId === ev.id ? 'white' : '#495057', fontWeight: 'bold' 
                            }}
                        >
                            {ev.title}
                        </button>
                        {ev.id !== 1 && (
                            <button onClick={(e) => deleteEvent(e, ev.id)} style={{ position: 'absolute', right: '5px', top: '10px', background: 'none', border: 'none', color: activeEventId === ev.id ? '#ffc9c9' : '#adb5bd', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        )}
                    </div>
                ))}
                <button onClick={addNewEvent} style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', border: '2px dashed #adb5bd', backgroundColor: 'transparent', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>
                    + 새 이벤트
                </button>
            </div>

            {/* --- 이벤트 편집 영역 --- */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '0 0 8px 8px', border: '1px solid #dee2e6', borderTop: 'none' }}>
                
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ced4da', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🎵 {activeEvent.title} BGM 설정</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input type="file" accept="audio/*" onChange={handleEventBgmUpload} />
                            {activeEvent.bgm && <audio src={activeEvent.bgm} controls style={{ height: '30px' }} />}
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, borderLeft: '1px dashed #dee2e6', paddingLeft: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📅 이벤트 시작 일시 (기본값)</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="월 (OCT)" value={activeEvent.baseDate.month} onChange={(e) => handleBaseDateChange('month', e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                            <input type="text" placeholder="일 (12)" value={activeEvent.baseDate.day} onChange={(e) => handleBaseDateChange('day', e.target.value)} style={{ width: '50px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                            <input type="text" placeholder="시간 (14:30)" value={activeEvent.baseDate.time} onChange={(e) => handleBaseDateChange('time', e.target.value)} style={{ width: '90px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        </div>
                    </div>
                </div>

                {/* 📜 시나리오 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {scenarios.map((scenario, index) => {
                        const isSelected = previewScenario?.index === index;
                        const activeSpeakerChar = characters.find(c => c.name === scenario.speaker);
                        const effectiveDate = getEffectiveDateForIndex(index); 
                        const isFirstMainDialog = index === 0 && scenario.branch === 'main';

                        // 🚨 엔딩 타입 렌더링 추가
                        if (scenario.type === 'ending') {
                            return (
                                <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }}
                                    style={{ 
                                        padding: '15px', backgroundColor: '#212529', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        border: isSelected && showPreview ? '3px solid #ff6b6b' : '1px solid #343a40',
                                        boxShadow: isSelected && showPreview ? '0 0 10px rgba(255,107,107,0.4)' : 'none',
                                        transition: 'all 0.2s', cursor: showPreview ? 'pointer' : 'default',
                                        marginLeft: scenario.branch === 'option1' ? '20px' : scenario.branch === 'option2' ? '40px' : '0'
                                    }}
                                >
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#ffd43b' }}>🎬 엔딩 연출</span>
                                            {scenario.branch === 'option1' && <span style={{ fontSize: '11px', background: '#40c057', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>선택지 1번</span>}
                                            {scenario.branch === 'option2' && <span style={{ fontSize: '11px', background: '#fd7e14', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>선택지 2번</span>}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} style={{ background: 'none', border: 'none', color: '#fa5252', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="EX 엔딩2: 슬픈 개구리" 
                                        value={scenario.text} 
                                        onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} 
                                        style={{ width: '80%', padding: '12px', borderRadius: '6px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }} 
                                    />
                                    <p style={{ fontSize: '12px', color: '#868e96', marginTop: '10px' }}>이 대사가 출력된 후 게임이 종료됩니다.</p>
                                </div>
                            );
                        }

                        if (scenario.type === 'cg_image') {
                            return (
                                <div key={index} style={{ border: '3px dashed #845ef7', padding: '15px', backgroundColor: '#f3f0ff', textAlign: 'center', borderRadius: '8px' }}>
                                    <h4 style={{ color: '#845ef7', marginTop: 0 }}>🖼️ 삽입된 CG 일러스트</h4>
                                    <img src={scenario.src} alt="CG preview" style={{ width: '320px', height: '180px', border: '2px solid #845ef7', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div style={{ marginTop: '10px' }}><button onClick={() => removeScenarioInput(index)} style={{ background: '#fa5252', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>CG 전체 삭제 (이미지+대사)</button></div>
                                </div>
                            );
                        }

                        return (
                            <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }}
                                style={{ 
                                    padding: '15px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', gap: '15px',
                                    border: isSelected && showPreview ? '3px solid #ff6b6b' : scenario.isCg ? '2px solid #845ef7' : '1px solid #ced4da',
                                    boxShadow: isSelected && showPreview ? '0 0 10px rgba(255,107,107,0.4)' : 'none',
                                    transition: 'all 0.2s', cursor: showPreview ? 'pointer' : 'default',
                                    marginLeft: scenario.branch === 'option1' ? '20px' : scenario.branch === 'option2' ? '40px' : '0'
                                }}
                            >
                                {/* 좌측 사이드바: 날짜 표시 및 수정 버튼 */}
                                <div style={{ width: '90px', borderRight: '1px dashed #dee2e6', paddingRight: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ fontSize: '10px', color: '#868e96', fontWeight: 'bold', marginBottom: '5px' }}>{effectiveDate.month} {effectiveDate.day}</div>
                                    <div style={{ fontSize: '14px', color: '#495057', fontWeight: 'bold' }}>{effectiveDate.time}</div>
                                    
                                    <div style={{ marginTop: '10px', width: '100%' }}>
                                        <button onClick={(e) => { 
                                            e.stopPropagation();
                                            if (scenario.dateOverride) handleScenarioChange(index, 'dateOverride', null); 
                                            else handleScenarioChange(index, 'dateOverride', { ...effectiveDate }); 
                                        }} style={{ width: '100%', padding: '4px 0', fontSize: '10px', backgroundColor: scenario.dateOverride ? '#ffc9c9' : '#f1f3f5', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>
                                            {scenario.dateOverride ? '수정 중' : '시간 변경'}
                                        </button>
                                        
                                        {scenario.dateOverride && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px' }}>
                                                <input type="text" placeholder="월" value={scenario.dateOverride.month} onChange={(e) => handleDateOverrideChange(index, 'month', e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '2px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()} />
                                                <input type="text" placeholder="일" value={scenario.dateOverride.day} onChange={(e) => handleDateOverrideChange(index, 'day', e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '2px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()} />
                                                <input type="text" placeholder="시간" value={scenario.dateOverride.time} onChange={(e) => handleDateOverrideChange(index, 'time', e.target.value)} style={{ width: '100%', fontSize: '10px', padding: '2px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 우측 메인 영역: 대사 및 표정 설정 */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#495057' }}>{scenario.type === 'choice' ? '🔀 선택지 분기' : `컷 ${index + 1}`}</span>
                                            {scenario.branch === 'option1' && <span style={{ fontSize: '11px', background: '#40c057', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>선택지 1번</span>}
                                            {scenario.branch === 'option2' && <span style={{ fontSize: '11px', background: '#fd7e14', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>선택지 2번</span>}
                                            {scenario.isCg && <span style={{ fontSize: '11px', background: '#845ef7', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>🖼️ CG 일러</span>}
                                        </div>
                                        {!isFirstMainDialog && (
                                            <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} style={{ background: 'none', border: 'none', color: '#fa5252', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
                                        )}
                                    </div>


                                {scenario.type === 'choice' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="text" placeholder="선택지 1 텍스트" value={scenario.option1 || ''} onChange={(e) => handleScenarioChange(index, 'option1', e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        <input type="text" placeholder="선택지 2 텍스트" value={scenario.option2 || ''} onChange={(e) => handleScenarioChange(index, 'option2', e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                ) : (
                                    <>
                                        {/* ⭐ 여기가 수정된 부분입니다: CG 컷일 경우 배경 선택창 비활성화 */}
                                        {scenario.isCg ? (
                                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#845ef7', backgroundColor: '#f3f0ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ CG 일러스트 배경</label>
                                                <span style={{ fontSize: '12px', color: '#868e96', fontWeight: 'bold' }}>🔒 이 컷은 등록된 CG 일러스트로 배경이 고정됩니다.</span>
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1971c2', backgroundColor: '#e7f5ff', padding: '4px 8px', borderRadius: '4px' }}>🖼️ 이 컷의 배경</label>
                                                
                                                <select 
                                                    value={scenario.bgType || 'bg_school'} 
                                                    onChange={(e) => handleBgSelectChange(index, e.target.value)}
                                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
                                                >
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

                                                <input 
                                                    type="file" accept="image/*" 
                                                    ref={el => fileInputRefs.current[index] = el}
                                                    onChange={(e) => handleBgUpload(e, index)} 
                                                    style={{ display: 'none' }} 
                                                />
                                                {scenario.bgImage && scenario.bgType !== 'custom_new' && <span style={{ fontSize: '12px', color: 'green' }}>✓ 적용됨</span>}
                                            </div>
                                        )}

                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                <select value={scenario.speaker} onChange={(e) => handleScenarioChange(index, 'speaker', e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}>
                                                    <option value="PROTAGONIST">{displayProtagonistName}</option>
                                                    <option value="나레이션">나레이션</option>
                                                    {/* 💡 [수정] 이름이 없으면 인덱스를 활용해 '등장인물 1', '등장인물 2' 등으로 표시 */}
                                                    {characters.map((c, charIdx) => {
                                                        const defaultName = `등장인물 ${charIdx + 1}`;
                                                        return <option key={c.id} value={c.name || defaultName}>{c.name || defaultName}</option>;
                                                    })}
                                                </select>
                                                
                                                <input type="text" placeholder="대사를 입력하세요..." value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                            </div>
                                            {!scenario.isCg && (
                                                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                                    <div style={{ flex: 1, padding: '10px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>👤 주인공 표정</span>
                                                        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '5px 0' }}>
                                                            <div onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'protagonistImage', null); }} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: scenario.protagonistImage === null ? '3px solid #fa5252' : '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>🚫</div>
                                                            {protagonist.images.map((img, i) => (
                                                                <img key={i} src={img.preview} alt="p" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'protagonistImage', img.preview); }} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: scenario.protagonistImage === img.preview ? '3px solid #1971c2' : '1px solid #ccc' }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ flex: 1, padding: '10px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>🎭 상대방 표정</span>
                                                        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '5px 0' }}>
                                                            <div onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', null); }} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: scenario.heroineImage === null ? '3px solid #fa5252' : '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>🚫</div>
                                                            {(!activeSpeakerChar) && characters.flatMap(c => c.images).map((img, i) => (
                                                                <img key={`all-${i}`} src={img.preview} alt="h" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', img.preview); }} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: scenario.heroineImage === img.preview ? '3px solid #d6336c' : '1px solid #ccc' }} />
                                                            ))}
                                                            {activeSpeakerChar && activeSpeakerChar.images.map((img, i) => (
                                                                <img key={`spec-${i}`} src={img.preview} alt="h" onClick={(e) => { e.stopPropagation(); handleScenarioChange(index, 'heroineImage', img.preview); }} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: scenario.heroineImage === img.preview ? '3px solid #d6336c' : '1px solid #ccc' }} />
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

                {/* --- 🚨 하단 대사 추가 컨트롤러 --- */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {/* 해당 분기에 엔딩이 없어야 버튼들이 활성화됨 */}
                    {!hasEndingInCurrentBranch ? (
                        <>
                            {currentBranch === 'main' && <button onClick={addScenarioInput} style={{ flex: 1, padding: '12px', backgroundColor: '#339af0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ 일반 대사 추가</button>}
                            {currentBranch === 'option1' && <button onClick={addScenarioInput} style={{ flex: 1, padding: '12px', backgroundColor: '#40c057', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ 선택지 1번 루트 대사 추가</button>}
                            {currentBranch === 'option2' && <button onClick={addScenarioInput} style={{ flex: 1, padding: '12px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ 선택지 2번 루트 대사 추가</button>}
                            
                            {!isCgMode && (
                                <label style={{ flex: 1, padding: '12px', backgroundColor: '#845ef7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                                    🖼️ 이벤트 CG 추가 <input type="file" accept="image/*" onChange={handleCgUpload} style={{ display: 'none' }} />
                                </label>
                            )}
                            {isCgMode && <button onClick={() => setIsCgMode(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#5c7cfa', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>⏹️ CG 대화 종료</button>}
                            
                            {currentBranch === 'main' && !isCgMode && !hasChoiceNode && <button onClick={addChoiceInput} style={{ flex: 1, padding: '12px', backgroundColor: '#adb5bd', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ 선택지 분기 추가</button>}

                            {/* 🚨 엔딩 대사 추가 버튼 */}
                            {!isCgMode && (
                                <button onClick={addEndingInput} style={{ flex: 1, padding: '12px', backgroundColor: '#212529', color: '#ffd43b', border: '2px dashed #ffd43b', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    🎬 엔딩 추가
                                </button>
                            )}
                        </>
                    ) : (
                        // 엔딩이 생성된 후에는 버튼 비활성화 및 안내 문구 출력
                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#e9ecef', color: '#868e96', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold' }}>
                            🔒 현재 분기(루트)는 엔딩으로 마무리되어 더 이상 대사를 추가할 수 없습니다.
                        </div>
                    )}
                </div>

                {currentBranch === 'option1' && (
                    <button onClick={() => { setIsCgMode(false); setCurrentBranch('option2'); }} style={{ width: '100%', marginTop: '10px', padding: '12px', backgroundColor: '#2b8a3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        ✔️ 선택지 1번 루트 종료 (2번 작성 시작)
                    </button>
                )}

                {/* --- 🚨 게임 완전 종료 알림 메시지 --- */}
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