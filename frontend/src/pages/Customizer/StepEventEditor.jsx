// src/pages/Customizer/StepEventEditor.jsx
import { useState, useRef, useEffect } from 'react';
import { SHARED_BACKGROUNDS } from '../../assets/assets';

import useCustomizerStore from '../../store/useCustomizerStore';
import './StepEventEditor.css';


// ==========================================
// 💡 Step2와 동일한 UI 에셋 통합 관리
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
        //simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        //retro:  (bg) => ({ name: '🕹️ 레트로 (이미지)', type: 'image', src: `/images/retro_calendar_${getColorId(bg)}.png` })
        none: () => ({ type: 'none' })
    }
};

const getColorId = (rgbaValue) => {
    const found = PRESET_COLORS.find(c => c.value === rgbaValue);
    return found ? found.id : 'pink'; 
};

const PRESET_BACKGROUNDS = SHARED_BACKGROUNDS;



export default function StepEventEditor() {
    const { 
        events, setEvents, activeEventId, setActiveEventId,
        showPreview, setShowPreview, previewScenario, setPreviewScenario,
        protagonist, characters, pFontStyle, globalUi,
        customBackgrounds, addCustomBackground,
        narrationFontStyle // 🌟 나레이션 설정값 가져오기
    } = useCustomizerStore();

    const currentGlobalUi = globalUi || { calendarFrame: 'none', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', layoutMode: 'bottom' };
    
    // 🌟 나레이션 스타일 안전 장치 (설정값이 없을 경우 기본값)
    const safeNarrationStyle = narrationFontStyle || { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', typingSound: 'type1' };

    const [currentBranch, setCurrentBranch] = useState('main'); 
    const [isCgMode, setIsCgMode] = useState(false);
    const [editingDateIndex, setEditingDateIndex] = useState(null); 
    const fileInputRefs = useRef({}); 

    const activeEvent = events.find(ev => ev.id === activeEventId) || events[0];
    const scenarios = activeEvent.scenarios;
    const hasChoiceNode = scenarios.some(s => s.type === 'choice');

    // ✅ 이 하나만 남겨두세요!
// ✅ 수정된 영리한 루트 추적 로직
    useEffect(() => {
        if (scenarios && scenarios.length > 0) {
            // 1. 현재 이벤트의 가장 마지막 컷을 가져옵니다.
            const lastScen = scenarios[scenarios.length - 1]; 

            if (lastScen.type === 'choice') {
                // 분기 설정 직후라면 무조건 1번 루트 시작
                setCurrentBranch('option1');
            } else if (lastScen.type === 'ending' && lastScen.branch?.startsWith('option')) {
                // 마지막이 엔딩인데, 다음 작성할 선택지 번호가 남아있다면 자동 이동
                const currentNum = parseInt(lastScen.branch.replace('option', ''));
                const choiceNode = scenarios.find(s => s.type === 'choice');
                const totalOpts = choiceNode?.options?.length || 2;
                
                if (currentNum < totalOpts) {
                    setCurrentBranch(`option${currentNum + 1}`);
                } else {
                    setCurrentBranch(lastScen.branch);
                }
            } else {
                // 그 외 일반적인 경우, 무조건 마지막 컷의 브랜치를 유지함 (핵심!)
                setCurrentBranch(lastScen.branch || 'main');
            }
        } else {
            setCurrentBranch('main');
        }
    }, [activeEventId]); // 이벤트가 바뀔 때 딱 한 번 실행되어 위치를 잡습니다.

    const defaultSpeaker = 'PROTAGONIST'; 
    const displayProtagonistName = protagonist.name || '주인공';

    const isMainEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
    const isOption1Ended = scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
    const isOption2Ended = scenarios.some(s => s.branch === 'option2' && s.type === 'ending');
    const hasEndingInCurrentBranch = scenarios.some(s => s.branch === currentBranch && s.type === 'ending');

    const hasOption1Nodes = scenarios.some(s => s.branch === 'option1');
    
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

    // 현재 선택된 브랜치 번호 추출 (옵션1이면 1, 옵션2면 2...)
    const currentBranchNum = currentBranch.startsWith('option') ? parseInt(currentBranch.replace('option', '')) : 0;

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

// 🌟 수정: 종류별(대사, CG, 엔딩, 분기)로 중간에 끼워넣는 기능 통합
// 🌟 수정: 종류별 끼워넣기 및 엔딩 추가 시 하위 대사 삭제 로직 (요청 3번)
// 🌟 수정: 컷 복사(copy) 기능 추가 및 종류별 끼워넣기 통합
    const insertScenarioAfter = (index, currentItem, type = 'dialog', extraData = null) => {
        let newScenarios = [...scenarios];
        let newBranch = currentItem.branch;

        // 엔딩 추가 처리
        if (type === 'ending') {
            const hasFollowing = newScenarios.slice(index + 1).some(s => s.branch === newBranch);
            if (hasFollowing) {
                const routeName = newBranch === 'main' ? '일반 루트' : `선택지 ${newBranch.replace('option', '')}번 루트`;
                if (!window.confirm(`⚠️ ${routeName}에 엔딩을 추가하면 이 컷 이후의 대사들이 전부 삭제됩니다.\n계속 진행하시겠습니까?`)) {
                    return;
                }
                newScenarios = newScenarios.filter((s, i) => i <= index || s.branch !== newBranch);
            }
            newScenarios.splice(index + 1, 0, { type: 'ending', branch: newBranch, text: '' });
            updateActiveScenarios(newScenarios);
            return;
        }

        // CG 추가 처리
        if (type === 'cg_image') {
            const cgItem = { type: 'cg_image', src: extraData.url, file: extraData.file, branch: newBranch };
            const dialogItem = { type: 'dialog', branch: newBranch, isCg: true, speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: extraData.url, file: extraData.file, bgType: 'custom_cg', dateOverride: null };
            newScenarios.splice(index + 1, 0, cgItem, dialogItem);
            updateActiveScenarios(newScenarios);
            setIsCgMode(true);
            return;
        }

        // 선택지, 대사 추가 및 🌟 컷 복사 처리
        let newItem = {};
        if (type === 'choice') {
            if (hasChoiceNode) return alert("선택지 분기는 하나만 생성할 수 있습니다.");
            newItem = { type: 'choice', branch: newBranch, options: ['', ''] };
            setIsCgMode(false);
            setCurrentBranch('option1');
        } else if (type === 'copy') {
            // ⭐ 추가: 현재 컷의 모든 정보(표정, 배경, 대사 등)를 그대로 복제
            newItem = { ...currentItem };
            if (newItem.dateOverride) {
                newItem.dateOverride = { ...newItem.dateOverride }; // 날짜 정보도 안전하게 복사
            }
        } else {
            newItem = { type: 'dialog', branch: newBranch, isCg: currentItem.isCg || currentItem.type === 'cg_image', speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: currentItem.bgImage, bgType: currentItem.bgType || 'bg_school', dateOverride: null };
        }

        newScenarios.splice(index + 1, 0, newItem);
        updateActiveScenarios(newScenarios);
    };
    // 🌟 추가: 인라인 버튼 전용 CG 업로드 함수
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

        // 1. CG 배너 자체의 삭제 버튼을 눌렀을 때
        if (item.type === 'cg_image') {
            if (!window.confirm("이 CG 일러스트와 연결된 대사들을 모두 삭제하시겠습니까?")) return;
            
            let newScenarios = [...scenarios];
            let deleteCount = 1; // 자기 자신(CG 배너) 1개
            let dialogsToDelete = 0; // 지워질 실제 대사 개수 파악

            for (let i = indexToRemove + 1; i < newScenarios.length; i++) {
                if (newScenarios[i].isCg && newScenarios[i].bgImage === item.src) {
                    deleteCount++;
                    if (newScenarios[i].type === 'dialog') dialogsToDelete++;
                } else {
                    break;
                }
            }

            // ⭐ 수정: 삭제할 때 진짜 대사(dialog)가 하나도 안 남게 되면 방어!
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

        // 2. 선택지 분기를 삭제했을 때
        if (item.type === 'choice') {
            if (!window.confirm("선택지 분기를 삭제하면 하위 대사들(모든 루트)도 모두 삭제됩니다.")) return;
            updateActiveScenarios(scenarios.filter((s, idx) => idx !== indexToRemove && !s.branch?.startsWith('option')));
            setCurrentBranch('main');
            setIsCgMode(false); 
            return;
        }

        // 3. 일반/CG 대사/엔딩 컷 1개 삭제 처리
        // ⭐ 수정: 남은 컷을 셀 때 'cg_image' 배너 등은 무시하고 오직 'dialog' 타입만 세도록 변경
        if (item.branch !== 'main' && item.type !== 'ending') {
            const branchDialogCuts = scenarios.filter(s => s.branch === item.branch && s.type === 'dialog');
            if (branchDialogCuts.length <= 1) {
                return alert('🚨 선택지 루트에는 최소 1개의 대사가 있어야 합니다!\n(CG 배너나 엔딩은 대사 개수에 포함되지 않습니다.)');
            }
        }

        let newScenarios = scenarios.filter((_, index) => index !== indexToRemove);

        // 고아(Orphaned) CG 배너 자동 정리
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
// 🌟 추가: 선택지 항목 추가 함수
    const handleAddOption = (choiceIndex) => {
        const newScenarios = [...scenarios];
        const choiceNode = newScenarios[choiceIndex];
        const currentOptions = choiceNode.options || [choiceNode.option1 || '', choiceNode.option2 || ''];
        
        if (currentOptions.length >= 10) return alert("선택지는 최대 10개까지만 추가할 수 있습니다.");
        
        choiceNode.options = [...currentOptions, ''];
        updateActiveScenarios(newScenarios);
    };

    // 🌟 추가: 선택지 개별 삭제 및 루트 자동 당기기 함수
    const handleDeleteOption = (choiceIndex, optIdxToDelete) => {
        const branchNumToDelete = optIdxToDelete + 1;
        if (!window.confirm(`선택지 ${branchNumToDelete}번과 해당 루트의 모든 대사를 삭제하시겠습니까?\n(이후 번호의 루트들은 앞으로 당겨집니다.)`)) return;

        let newScenarios = [...scenarios];
        const choiceNode = newScenarios[choiceIndex];
        const currentOptions = choiceNode.options || [choiceNode.option1 || '', choiceNode.option2 || ''];
        
        // 1. 선택지 배열에서 삭제
        currentOptions.splice(optIdxToDelete, 1);
        choiceNode.options = currentOptions;

        // 2. 삭제된 루트의 대사 컷들 날리기
        newScenarios = newScenarios.filter(s => s.branch !== `option${branchNumToDelete}`);

        // 3. 뒷번호 루트들을 앞번호로 당겨오기 (ex: option4 -> option3)
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
const addChoiceInput = () => {
        if (hasChoiceNode) return alert("하나의 이벤트에는 하나의 선택지 분기만 생성할 수 있습니다.");
        setIsCgMode(false);
        // ⭐ 수정: 옵션 1, 2 대신 options 배열 구조로 초기화
        updateActiveScenarios([...scenarios, { type: 'choice', branch: currentBranch, options: ['', ''] }]);
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
        if (speakerId === '나레이션') return safeNarrationStyle; // 🌟 나레이션 전용 스타일 적용
        if (!speakerId || speakerId === 'PROTAGONIST') return pFontStyle;
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
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.none)(currentGlobalUi.calendarColor); 

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

    const layoutClass = currentGlobalUi.layoutMode === 'bottom' ? 'layout-bottom' : 'layout-classic';

    // ✅ return 바로 위에 이 로그 코드를 붙여넣으세요!
    console.log("==== 🚨 렌더링 상태 체크 ====");
    console.log("1. 현재 보고 있는 이벤트 ID:", activeEventId);
    console.log("2. 현재 브랜치(currentBranch):", currentBranch);
    console.log("3. 현재 브랜치에 대사가 있는가?:", scenarios.filter(s => s.branch === currentBranch).length > 0);
    console.log("4. 전체 시나리오 마지막 컷의 브랜치:", scenarios[scenarios.length - 1]?.branch);
    console.log("===============================");


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
                        <h5>📺 인게임 미리보기: 컷 {previewScenario.index + 1}</h5>
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
                        <h4 className="config-title">📅 상태창 설정</h4>
<div style={{ fontSize: '11px', color: '#868e96', marginBottom: '12px', lineHeight: '1.6', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #d0bfff' }}>
    💡 <strong>상태창 활용 팁!</strong> 다양한 정보를 입력해 몰입도를 높여보세요.<br/>
    <div style={{ color: '#495057', marginTop: '5px' }}>
        • <strong>연애:</strong> 호감도: ❤️❤️❤️❤️❤️ (MAX)<br/>
        • <strong>스탯:</strong> HP: 80 | STAMINA: ■■■□□<br/>
        • <strong>재화:</strong> LUCK: 🍀 99 | GOLD: 12,500 G<br/>
        • <strong>날짜:</strong> 2020.03.06 02:30 AM | 🔋 85%<br/>
        • <strong>진행:</strong> EPISODE 1 | 벚꽃 아래에서 🌸
    </div>
</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>윗줄 텍스트</span>
                                <input 
                                    type="text" 
                                    className="input-base" 
                                    placeholder="예: 2024. 03. 14 (화) ☀️" 
                                    value={activeEvent.baseDate.month} 
                                    onChange={(e) => handleBaseDateChange('month', e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>아랫줄 텍스트</span>
                                <input 
                                    type="text" 
                                    className="input-base" 
                                    placeholder="예: EPISODE 1 | 첫 만남" 
                                    value={activeEvent.baseDate.time} 
                                    onChange={(e) => handleBaseDateChange('time', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                </div> {/* <--- config-panel 닫는 태그 */}

                <div className="scenario-list">
                    {scenarios.map((scenario, index) => {
                        const isSelected = previewScenario?.index === index;
                        const activeSpeakerChar = characters.find(c => c.name === scenario.speaker);
                        const effectiveDate = getEffectiveDateForIndex(index); 
                        const isFirstMainDialog = index === 0 && scenario.branch === 'main';

                    const cardClasses = `scenario-card branch-${scenario.branch} ${isSelected && showPreview ? 'preview-active' : ''} ${scenario.isCg ? 'is-cg' : ''} ${scenario.type === 'ending' ? 'type-ending' : ''} ${scenario.type === 'cg_image' ? 'type-cg-banner' : ''}`;                        if (scenario.type === 'ending') {
                            return (
                                <div key={index} onClick={() => { if(showPreview) setPreviewScenario({ ...scenario, index }); }} className={cardClasses}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#ffd43b' }}>🎬 엔딩</span>
                                            {/* ⭐ 수정: 하드코딩 삭제, branch 번호를 추출하여 OPTION_COLORS 배열에서 색상을 가져옴 */}
                                            {scenario.branch?.startsWith('option') && (
                                                <span 
                                                    className="badge" 
                                                    style={{ 
                                                        backgroundColor: OPTION_COLORS[(parseInt(scenario.branch.replace('option', '')) - 1) % 10] 
                                                    }}
                                                >
                                                    선택지 {scenario.branch.replace('option', '')}번
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeScenarioInput(index); }} className="btn-text-del">삭제</button>
                                    </div>
                                    <input type="text" placeholder="예시) BAD END: 마지막 잎새" value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} 
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
                                            {editingDateIndex === index ? '수정 완료' : '상태창 변경'}
                                        </button>
                                        {scenario.dateOverride && editingDateIndex !== index && (
                                             <button onClick={(e) => clearDateOverride(e, index)} style={{ width: '100%', marginTop: '5px', padding: '2px 0', fontSize: '10px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>초기화</button>
                                        )}
                                        {editingDateIndex === index && scenario.dateOverride && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px' }}>
                                                <input type="text" placeholder="윗줄 텍스트" title="윗줄에 표시될 텍스트" value={scenario.dateOverride.month} onChange={(e) => handleDateOverrideChange(index, 'month', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />
                                                <input type="text" placeholder="아랫줄 텍스트" title="아래에 표시될 텍스트" value={scenario.dateOverride.time} onChange={(e) => handleDateOverrideChange(index, 'time', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />
                                                {/*<input type="text" placeholder="달력 내부 텍스트" title="달력안에 들어갈 텍스트" value={scenario.dateOverride.day} onChange={(e) => handleDateOverrideChange(index, 'day', e.target.value)} className="input-base" style={{ fontSize: '10px', padding: '4px' }} onClick={(e) => e.stopPropagation()} />*/}
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
                                                {/* ⭐ 수정: 루트 1~10번까지 고유 색상 적용 */}
                                                {scenario.branch?.startsWith('option') && (
                                                    <span className={`badge ${scenario.branch}`} style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: OPTION_COLORS[(parseInt(scenario.branch.replace('option', '')) - 1) % 10] }}>
                                                        루트 {String.fromCharCode(64 + parseInt(scenario.branch.replace('option', '')))} (선택지 {scenario.branch.replace('option', '')})
                                                    </span>
                                                )}
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
                                                <strong>💡 화면에 표시될 선택지들을 입력해 주세요. (최대 10개)</strong><br/>
                                                선택지를 삭제하면 해당 번호로 작성된 컷들도 함께 삭제되며 번호가 당겨집니다.
                                            </div>
                                            
                                            {/* ⭐ 수정: options 배열을 안전하게 매핑 (없으면 빈칸 2개로 대체) */}
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
                                                        <button onClick={() => handleDeleteOption(index, optIdx)} style={{ padding: '8px 12px', backgroundColor: '#fa5252', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                            삭제
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {(scenario.options?.length || 2) < 10 && (
                                                <button onClick={() => handleAddOption(index)} style={{ marginTop: '5px', padding: '10px', backgroundColor: '#f1f3f5', color: '#495057', border: '2px dashed #adb5bd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    + 선택지 추가
                                                </button>
                                            )}
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
                                            {/* 🌟 수정: 대사 박스 하단 다기능 미니 컨트롤 바 */}
                                            
 {/* 🌟 수정: 대사 박스 하단 미니 컨트롤 바 (다음 루트 시작 버튼 삭제 / 엔딩 조건 추가) */}
{/* ⭐ 삭제됨: [+ 이 컷 아래에 대사 추가] 긴 버튼은 완전히 삭제했습니다. */}

                                            {/* 🌟 수정: 대사 박스 하단 미니 컨트롤 바 (복사 기능으로 교체) */}
 {/* 🌟 수정: 버튼별 색상을 rgba로 변경하여 연하게 만들기 */}
{/* 🌟 수정: 대사 박스 하단 미니 컨트롤 바 */}
{/* 🌟 수정: 대사 박스 하단 미니 컨트롤 바 (크기 고정 및 정렬) */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '15px', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '6px', border: '1px dashed #ced4da', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                                
                                                {/* 1. 복사 버튼 (가장 길게 크기 고정) */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'copy'); }} 
                                                    style={{ width: '170px', padding: '6px 0', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'rgba(255, 185, 197, 0.61)', color: '#65021e', fontFamily: 'inherit' }}
                                                >
                                                    + 이 컷 아래 대사 복사
                                                </button>
                                                
                                                {/* 2. CG 관련 버튼 (크기 고정) */}
                                                {scenario.isCg ? (
                                                    <>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsCgMode(false);
                                                                const lastBg = scenario.bgImage;
                                                                const nextItem = { type: 'dialog', branch: scenario.branch, isCg: false, speaker: defaultSpeaker, protagonistImage: null, heroineImage: null, text: '', bgImage: lastBg, bgType: 'bg_school', dateOverride: null };
                                                                const newScenarios = [...scenarios];
                                                                newScenarios.splice(index + 1, 0, nextItem);
                                                                updateActiveScenarios(newScenarios);
                                                            }}
                                                            style={{ width: '90px', padding: '6px 0', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'rgba(25, 113, 194, 0.3)', color: '#1864ab', boxShadow: '0 2px 0 rgba(24, 100, 171, 0.2)', fontFamily: 'inherit' }}
                                                        >
                                                            일반대사 추가
                                                        </button>
                                                        <label style={{ width: '90px', padding: '6px 0', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(132, 94, 247, 0.3)', color: '#6741d9', boxShadow: '0 2px 0 rgba(103, 65, 217, 0.2)', fontFamily: 'inherit' }}>
                                                            + CG <input type="file" accept="image/*" onChange={(e) => handleInlineCgUpload(e, index, scenario)} style={{ display: 'none' }} onClick={(e) => e.stopPropagation()} />
                                                        </label>
                                                    </>
                                                ) : (
                                                    <label style={{ width: '70px', padding: '6px 0', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', backgroundColor: 'rgba(132, 94, 247, 0.3)', color: '#6741d9', boxShadow: '0 2px 0 rgba(103, 65, 217, 0.2)', fontFamily: 'inherit' }}>
                                                        + CG <input type="file" accept="image/*" onChange={(e) => handleInlineCgUpload(e, index, scenario)} style={{ display: 'none' }} onClick={(e) => e.stopPropagation()} />
                                                    </label>
                                                )}
                                                
                                                {/* 3. 엔딩 버튼 (크기 고정) */}
                                                {scenario.type !== 'ending' && !(hasChoiceNode && scenario.branch === 'main') && (
                                                    <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'ending'); }} style={{ width: '70px', padding: '6px 0', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#343a40', color: '#ffd43b',  borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        + 엔딩
                                                    </button>
                                                )}
                                                
                                                {/* 4. 선택지 분기 버튼 (크기 고정) */}
                                                {!hasChoiceNode && scenario.branch === 'main' && (
                                                    <button onClick={(e) => { e.stopPropagation(); insertScenarioAfter(index, scenario, 'choice'); }} style={{ width: '90px', padding: '6px 0', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ffba749c', color: '#005117', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                        + 선택지 분기
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
{/* 🌟 수정: 유령 버튼을 완벽히 제거한 하단 컨트롤러 */}
                <div className="controller-group" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {(() => {
                        const currentBranchScenarios = scenarios.filter(s => s.branch === currentBranch);
                        const lastCut = scenarios[scenarios.length - 1];
                        
                        // 방어 로직 1, 2 유지
                        const isBranchValid = currentBranch === 'main' || (hasChoiceNode && currentBranch.startsWith('option'));
                        if (!isBranchValid) return null;
                        if (currentBranch.startsWith('option')) {
                            const optionNum = parseInt(currentBranch.replace('option', ''));
                            if (optionNum > totalOptionsCount) return null; 
                        }

                        return (
                            <>
                                {/* 1. 대사가 아예 없을 때 (첫 시작) */}
                                {currentBranchScenarios.length === 0 && !hasEndingInCurrentBranch && (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <button 
                                            onClick={addScenarioInput} 
                                            className="btn-large" 
                                            style={{ backgroundColor: currentBranch === 'main' ? '#339af0' : OPTION_COLORS[(currentBranchNum - 1) % 10], color: 'white', flex: 1, border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)', fontFamily: 'inherit' }}
                                        >
                                            + {currentBranch === 'main' ? '일반' : `선택지 ${currentBranchNum}번`} 대사 시작하기
                                        </button>
                                        
                                        <label className="btn-large bg-purple" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 0 rgba(0,0,0,0.2)', fontFamily: 'inherit' }}>
                                            🖼️ CG 추가 <input type="file" accept="image/*" onChange={handleCgUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                )}

                                {/* 2. 대사가 있을 때: (엔딩 유무에 상관없이 렌더링되게 분리) */}
                                {currentBranchScenarios.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                        
                                        {/* ⭐ 루트 확인 완료 버튼은 엔딩이 나도 계속 표시! (다음 루트로 넘어가기 위함) */}
                                        {currentBranch.startsWith('option') && currentBranchNum < totalOptionsCount && (
                                            <button 
                                                onClick={() => { setIsCgMode(false); setCurrentBranch(`option${currentBranchNum + 1}`); }} 
                                                className="btn-large" 
                                                style={{ width: '100%', backgroundColor: OPTION_COLORS[currentBranchNum % 10], boxShadow: '0 4px 0 rgba(0,0,0,0.2)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}
                                            >
                                                ✔️ 선택지 {currentBranchNum}번 루트 확인 완료 (다음 번호로)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    {/* 3. 엔딩 안내 메시지 */}
                    {hasEndingInCurrentBranch && (
                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#e9ecef', color: '#868e96', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold', fontFamily: 'inherit' }}>
                            🔒 현재 분기({currentBranch === 'main' ? '일반 루트' : `루트 ${currentBranchNum}`})는 엔딩으로 마무리되었습니다.
                        </div>
                    )}
                </div>
                {/* 🌟 4. 모든 루트 엔딩 시 게임 종료 안내판 */}
                {isFullyEnded && (
                    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#212529', color: '#ffd43b', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold', border: '2px solid #ffd43b', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎊</div>
                        모든 루트에 엔딩이 생성되어 게임이 여기서 종료됩니다!<br/>
                        <span style={{ fontSize: '14px', color: '#ced4da', fontWeight: 'normal', marginTop: '5px', display: 'inline-block' }}>
                            이후의 이벤트는 게임에 구현되지 않습니다.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}