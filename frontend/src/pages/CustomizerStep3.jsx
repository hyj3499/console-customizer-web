import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomizerStore from '../store/useCustomizerStore';
import './Customizer.css';

const presetBackgrounds = [
    { name: '교실', url: 'https://via.placeholder.com/320x240/ffe4b5/000000?text=Classroom' },
    { name: '바다', url: 'https://via.placeholder.com/320x240/87cefa/000000?text=Sea' },
    { name: '시내', url: 'https://via.placeholder.com/320x240/778899/ffffff?text=City' },
    { name: '운동장', url: 'https://via.placeholder.com/320x240/98fb98/000000?text=Playground' },
    { name: '겨울 시내', url: 'https://via.placeholder.com/320x240/e0ffff/000000?text=Winter+City' },
    { name: '회사', url: 'https://via.placeholder.com/320x240/d3d3d3/000000?text=Office' },
];

const presetColors = ['#adb5bd', '#845ef7', '#339af0', '#ff8787'];

export default function CustomizerStep3() { 
    const navigate = useNavigate();
    const { 
        background, setBackground,
        favorabilityColor, setFavorabilityColor,
        currentBranch, setCurrentBranch,
        scenarios, setScenarios,
        protagonist, heroine,
        pFontStyle, hFontStyle
    } = useCustomizerStore();

    const [cgImage, setCgImage] = useState(null); 
    const [isCgMode, setIsCgMode] = useState(false); 
    
    // ✨ 타이핑 관련 상태
    const [previewSpeaker, setPreviewSpeaker] = useState('p'); // 현재 화자
    const [displayText, setDisplayText] = useState('');
    const [isCursorVisible, setIsCursorVisible] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    
    // ✨ 화자별 대사 설정
    const fullText = previewSpeaker === 'p' 
        ? "실제 게임 화면에서는 CG가 이 위를 덮게 됩니다." 
        : "이제 자동으로 번갈아가며 대사를 보여줍니다.";

    const pPhoto = protagonist.images[0]?.preview || 'https://via.placeholder.com/66x75?text=Hero';
    const hPhoto = heroine.images[0]?.preview || 'https://via.placeholder.com/200x300?text=Heroine';

    const currentStyle = previewSpeaker === 'p' ? pFontStyle : hFontStyle;
    const currentName = previewSpeaker === 'p' ? (protagonist.name || '주인공') : (heroine.name || '히로인');

    const getTextShadow = (color) => `-1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}, 1px 1px 0 ${color}`;

    // --- ✨ 타이핑 및 자동 교대 로직 ---
    useEffect(() => {
        let timer;
        if (!isWaiting) {
            if (displayText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayText(fullText.slice(0, displayText.length + 1));
                }, 100); 
            } else {
                setIsWaiting(true); 
            }
        } else {
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                setIsCursorVisible(prev => !prev);
                blinkCount++;
                if (blinkCount >= 10) { 
                    clearInterval(blinkInterval);
                    setTimeout(() => {
                        setDisplayText('');
                        setIsWaiting(false);
                        setIsCursorVisible(false);
                        // ✨ 대사가 끝나고 화면을 지울 때 화자 교체
                        setPreviewSpeaker(prev => prev === 'p' ? 'h' : 'p');
                    }, 500);
                }
            }, 400); 
            return () => clearInterval(blinkInterval);
        }
        return () => clearTimeout(timer);
    }, [displayText, isWaiting, fullText]); // ✨ fullText 의존성 추가

    const handleCgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width === 320 && img.height === 240) {
                setCgImage(objectUrl);
                setIsCgMode(true);
                setScenarios([...scenarios, 
                    { type: 'cg_image', src: objectUrl, branch: currentBranch },
                    { type: 'dialog', branch: currentBranch, isCg: true, speaker: '', text: '' }
                ]);
            } else {
                alert(`CG 일러스트는 무조건 320x240 픽셀이어야 합니다!\n(현재: ${img.width}x${img.height})`);
                e.target.value = '';
            }
        };
        img.src = objectUrl;
    };

    const handleBgUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width === 320 && img.height === 240) {
                setBackground({ type: 'custom', src: objectUrl, name: file.name, file });
            } else {
                alert(`배경 사진은 무조건 320x240 픽셀이어야 합니다!`);
                e.target.value = '';
            }
        };
        img.src = objectUrl;
    };

    const addScenarioInput = () => {
        setScenarios([...scenarios, { 
            type: 'dialog', 
            branch: currentBranch, 
            isCg: isCgMode, 
            speaker: '', 
            protagonistImage: null, 
            heroineImage: null, 
            text: '' 
        }]);
    };

    const addChoiceInput = () => {
        setIsCgMode(false);
        setScenarios([...scenarios, { type: 'choice', option1: '', option2: '' }]);
        setCurrentBranch('option1');
    };

    const finishOption1 = () => {
        setIsCgMode(false);
        setCurrentBranch('option2');
    };

    const exitCgMode = () => setIsCgMode(false);

    const removeScenarioInput = (indexToRemove) => {
        const item = scenarios[indexToRemove];
        
        if (item.type === 'cg_image') {
            if (!window.confirm("CG 일러스트 박스를 삭제하면 관련된 모든 CG 대사들이 함께 삭제됩니다. 정말 삭제하시겠습니까?")) return;
            const newScenarios = scenarios.filter(s => !s.isCg && s.type !== 'cg_image');
            setScenarios(newScenarios);
            setCgImage(null); 
            setIsCgMode(false); 
            return;
        }

        if (item.type === 'choice') {
            if (!window.confirm("선택지 분기를 삭제하면 하위 대사들도 모두 삭제됩니다.")) return;
            setScenarios(scenarios.filter((s, idx) => {
                if (idx === indexToRemove) return false;
                if (s.branch === 'option1' || s.branch === 'option2') return false;
                return true;
            }));
            setCurrentBranch('main');
        } else {
            setScenarios(scenarios.filter((_, index) => index !== indexToRemove));
        }
    };

    const handleScenarioChange = (index, field, value) => {
        const newScenarios = [...scenarios];
        newScenarios[index][field] = value;
        setScenarios(newScenarios);
    };

    const moveScenarioUp = (index) => {
        if (index === 0 || scenarios[index].type === 'choice' || scenarios[index].type === 'cg_image') return;
        const newScenarios = [...scenarios];
        const temp = newScenarios[index - 1];
        newScenarios[index - 1] = newScenarios[index];
        newScenarios[index] = temp;
        setScenarios(newScenarios);
    };

    const moveScenarioDown = (index) => {
        if (index === scenarios.length - 1 || scenarios[index].type === 'choice' || scenarios[index].type === 'cg_image') return;
        const newScenarios = [...scenarios];
        const temp = newScenarios[index + 1];
        newScenarios[index + 1] = newScenarios[index];
        newScenarios[index] = temp;
        setScenarios(newScenarios);
    };

    const insertScenarioAfter = (index, currentItem) => {
        const newScenarios = [...scenarios];
        let newBranch = currentItem.branch;
        if (currentItem.type === 'choice') newBranch = 'option1';
        const newScenario = { 
            type: 'dialog', 
            branch: newBranch, 
            isCg: currentItem.isCg || currentItem.type === 'cg_image', 
            speaker: '', 
            protagonistImage: null, 
            heroineImage: null, 
            text: '' 
        };
        newScenarios.splice(index + 1, 0, newScenario);
        setScenarios(newScenarios);
    };

    return (
        <div className="customizer-container">
            <div className="progress-header"><h2>진행 상황: 3 / 5</h2></div>

            {/* --- ✨ 미리보기 (클릭 이벤트 제거됨) --- */}
            <div className="preview-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '10px' }}>📺 기기 적용 미리보기 (배경 및 캐릭터 전용)</h4>
                <div 
                    className="lcd-screen" 
                    style={{ 
                        width: '320px', height: '240px', backgroundColor: '#000', position: 'relative', 
                        overflow: 'hidden', border: '5px solid #333', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                >
                    {/* 배경 */}
                    <img className="lcd-bg" src={background?.src || 'https://via.placeholder.com/320x240'} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                    
                    {/* 히로인 스탠딩 */}
                    <img className="lcd-heroine" src={hPhoto} alt="heroine" style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', height: '180px', zIndex: 1 }} />
                    
                    {/* 😎 주인공 얼굴창 (왼쪽 고정) */}
                    <div className="lcd-hero-face-box" style={{ 
                        position: 'absolute', 
                        left: '10px', 
                        bottom: '10px', 
                        width: '66px', 
                        height: '73px', 
                        background: 'rgba(0, 0, 0, 0.6)', 
                        border: '1px solid #4d4747', 
                        zIndex: 12, 
                        overflow: 'hidden' 
                    }}>
                        <img src={pPhoto} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* 💬 대사창 (주인공 얼굴창과 띄우기 위해 left 값 조정) */}
                    <div className="lcd-dialog-box" style={{ 
                        position: 'absolute', 
                        bottom: '10px', 
                        left: '85px', // 얼굴창(10+66) 뒤에 9px의 여백을 둠
                        width: '225px', // 남은 가로 공간 확보
                        height: '73px', 
                        background: 'rgba(0, 0, 0, 0.6)', 
                        padding: '8px 10px', 
                        zIndex: 11, 
                        borderRadius: '2px',
                        boxSizing: 'border-box' // 패딩이 너비에 영향을 주지 않도록 설정
                    }}>
                        <span className="lcd-name-tag" style={{ 
                            fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px',
                            fontFamily: currentStyle.font, color: currentStyle.color, textShadow: getTextShadow(currentStyle.outline)
                        }}>
                            {currentName}
                        </span>
                        <p className="lcd-text" style={{ 
                            fontSize: '11px', lineHeight: '1.3', margin: 0,
                            fontFamily: currentStyle.font, color: currentStyle.color, textShadow: getTextShadow(currentStyle.outline)
                        }}>
                            {displayText}
                            {!isWaiting && <span style={{ marginLeft: '2px' }}>■</span>}
                            {isWaiting && (
                                <span style={{ float: 'right', marginTop: '2px', visibility: isCursorVisible ? 'visible' : 'hidden', fontSize: '10px' }}>▽</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>🖼️ 배경 선택</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {presetBackgrounds.map(bg => (
                        <button key={bg.name} className={`action-btn ${background?.name === bg.name ? '' : 'secondary'}`} onClick={() => setBackground({ type: 'preset', src: bg.url, name: bg.name })}>{bg.name}</button>
                    ))}
                </div>
                <input type="file" accept="image/*" onChange={handleBgUpload} style={{ fontSize: '14px' }} />
            </div>

            {/* <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff0f6', borderRadius: '8px', border: '1px solid #ffdeeb' }}>...</div> */}

            <div className="scenario-complex-list">
                {scenarios.map((scenario, index) => {
                    const pName = protagonist.name || '주인공';
                    const hName = heroine.name || '히로인';
                    const dialogNumber = scenarios.slice(0, index + 1).filter(s => s.type === 'dialog').length;

                    if (scenario.type === 'cg_image') {
                        return (
                            <div key={index} className="scenario-item-container">
                                <div className="choice-block" style={{ border: '3px dashed #845ef7', padding: '15px', backgroundColor: '#f3f0ff', textAlign: 'center' }}>
                                    <h4 style={{ color: '#845ef7', marginTop: 0 }}>🖼️ 삽입된 CG 일러스트</h4>
                                    <img src={scenario.src} alt="CG preview" style={{ width: '160px', height: '120px', border: '2px solid #845ef7', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div style={{ marginTop: '10px' }}>
                                        <button className="delete-scenario-btn" onClick={() => removeScenarioInput(index)}>CG 전체 삭제 (이미지+대사)</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={index} className="scenario-item-container">
                            <div 
                                className={`scenario-complex-item ${scenario.type === 'choice' ? 'choice-block' : ''} ${scenario.branch !== 'main' ? 'branch-box' : ''}`}
                                style={scenario.isCg ? { border: '2px solid #845ef7', backgroundColor: '#f3f0ff' } : {}}
                            >
                                <div className="scenario-item-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4>{scenario.type === 'choice' ? '🔀 선택지 분기' : `💬 대사 ${dialogNumber}`}</h4>
                                        {scenario.branch === 'option1' && <span className="branch-badge opt1">선택지 1번</span>}
                                        {scenario.branch === 'option2' && <span className="branch-badge opt2">선택지 2번</span>}
                                        {scenario.isCg && <span className="branch-badge" style={{ backgroundColor: '#845ef7', color: 'white' }}>🖼️ CG 일러</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="sort-btn" onClick={() => moveScenarioUp(index)} disabled={index === 0 || scenario.type === 'choice'}>▲</button>
                                        <button className="sort-btn" onClick={() => moveScenarioDown(index)} disabled={index === scenarios.length - 1 || scenario.type === 'choice'}>▼</button>
                                        <button className="delete-scenario-btn" onClick={() => removeScenarioInput(index)}>삭제</button>
                                    </div>
                                </div>

                                {scenario.type === 'choice' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="text" className="scenario-input" placeholder="선택지 1" value={scenario.option1 || ''} onChange={(e) => handleScenarioChange(index, 'option1', e.target.value)} />
                                        <input type="text" className="scenario-input" placeholder="선택지 2" value={scenario.option2 || ''} onChange={(e) => handleScenarioChange(index, 'option2', e.target.value)} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="scenario-row">
                                            <select className="speaker-select" value={scenario.speaker} onChange={(e) => handleScenarioChange(index, 'speaker', e.target.value)}>
                                                <option value="">화자 선택</option>
                                                <option value="나레이션">나레이션</option>
                                                <option value={pName}>{pName}</option>
                                                <option value={hName}>{hName}</option>
                                            </select>
                                            <input type="text" className="scenario-input" placeholder="대사 입력" value={scenario.text} onChange={(e) => handleScenarioChange(index, 'text', e.target.value)} />
                                        </div>

                                        {!scenario.isCg && (
                                            <div className="scenario-dual-image-selector" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {protagonist.images.length > 0 && (
                                                    <div style={{ padding: '10px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>👤 {pName} 표정</span>
                                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            {protagonist.images.map((img, imgIdx) => (
                                                                <div key={`p-${imgIdx}`} onClick={() => handleScenarioChange(index, 'protagonistImage', img.preview)} style={{ width: '60px', textAlign: 'center', cursor: 'pointer' }}>
                                                                    <img src={img.preview} alt="p" className={`mini-preview ${scenario.protagonistImage === img.preview ? 'selected' : ''}`} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: scenario.protagonistImage === img.preview ? '3px solid #3b82f6' : '2px solid transparent' }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {heroine.images.length > 0 && (
                                                    <div style={{ padding: '10px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>💖 {hName} 표정</span>
                                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            {heroine.images.map((img, imgIdx) => (
                                                                <div key={`h-${imgIdx}`} onClick={() => handleScenarioChange(index, 'heroineImage', img.preview)} style={{ width: '60px', textAlign: 'center', cursor: 'pointer' }}>
                                                                    <img src={img.preview} alt="h" className={`mini-preview ${scenario.heroineImage === img.preview ? 'selected' : ''}`} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: scenario.heroineImage === img.preview ? '3px solid #3b82f6' : '2px solid transparent' }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            {scenario.type === 'dialog' && (
                                <div className="inline-add-wrapper">
                                    <button className="inline-add-btn" onClick={() => insertScenarioAfter(index, scenario)}>+</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="action-btn secondary" onClick={addScenarioInput} style={{ flex: 1 }}>+ 대사 추가</button>
                    
                    {!cgImage && (
                        <label className="action-btn" style={{ flex: 1, backgroundColor: '#845ef7', cursor: 'pointer', textAlign: 'center', lineHeight: '36px' }}>
                            🖼️ CG 일러 추가
                            <input type="file" accept="image/*" onChange={handleCgUpload} style={{ display: 'none' }} />
                        </label>
                    )}

                    {isCgMode && (
                        <button className="action-btn" onClick={exitCgMode} style={{ flex: 1, backgroundColor: '#5c7cfa' }}>⏹️ CG 대화 종료</button>
                    )}

                    {currentBranch === 'main' && !isCgMode && (
                        <button className="action-btn" onClick={addChoiceInput} style={{ flex: 1, backgroundColor: '#adb5bd' }}>+ 선택지 분기 추가</button>
                    )}
                </div>

                {currentBranch === 'option1' && (
                    <button className="action-btn" onClick={finishOption1} style={{ backgroundColor: '#40c057' }}>✔️ 선택지 1번 작성 완료 (2번 작성 시작)</button>
                )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button className="action-btn secondary" onClick={() => navigate('/step/2')}>이전</button>
                <button className="action-btn" onClick={() => navigate('/step/4')}>다음</button>
            </div>
        </div>
    );
}