// src/pages/Customizer/StepSettings.jsx
import { useState } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';

// ==========================================
// 💡 이미지 테마 색상 연동 시스템
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

// ==========================================
// 💡 미리보기용 배경 이미지 목록
// ==========================================
const PREVIEW_BACKGROUNDS = [
    { name: '기본 (투명/격자)', value: 'default' },
    { name: '교실 (낮)', value: '/images/bg_school.png' },
    { name: '교실 (밤)', value: 'https://via.placeholder.com/1920x1080/2c3e50/ffffff?text=Classroom+(Night)' },
    { name: '바다', value: 'https://via.placeholder.com/1920x1080/87cefa/000000?text=Sea' },
    { name: '숲', value: 'https://via.placeholder.com/1920x1080/228b22/ffffff?text=Forest' }
];

// ==========================================
// 💡 UI 에셋 통합 관리 (+ 달력 추가)
// ==========================================
const UI_ASSETS = {
    dialog: {
        simple: (bg, border='#dddddd') => ({ name: '심플형 (깔끔한 테두리)', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        gothic: (bg, border='#a9a9a9') => ({ name: '고딕풍 (클래식/판타지)', type: 'css', border: `4px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ name: '큐티 (둥글고 귀여운)', type: 'css', border: `3px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로 (이미지)', type: 'image', src: `/images/retro_dialog_${getColorId(bg)}.png` }) 
    },
    namebox: {
        simple: (bg, border='#dddddd') => ({ name: '심플형 (깔끔한 테두리)', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        gothic: (bg, border='#a9a9a9') => ({ name: '고딕풍 (클래식/판타지)', type: 'css', border: `3px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ name: '큐티 (둥글고 귀여운)', type: 'css', border: `2px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로 (이미지)', type: 'image', src: `/images/retro_namebox_${getColorId(bg)}.png` })
    },
    portrait: {
        square:  (bg, border='#dddddd') => ({ name: '기본 사각형 (Square)', type: 'css', border: `3px solid ${border}`, borderRadius: '0%' }),
        rounded: (bg, border='#dddddd') => ({ name: '부드러운 사각 (Rounded)', type: 'css', border: `3px solid ${border}`, borderRadius: '12%' }),
        circle:  (bg, border='#dddddd') => ({ name: '완벽한 원형 (Circle)', type: 'css', border: `3px solid ${border}`, borderRadius: '50%' }),
        retro:   (bg) => ({ name: '🎮 레트로 프레임 (이미지)', type: 'image', src: `/images/retro_frame_${getColorId(bg)}.png`, mask: '/images/retro_frame_mask.png' }),
        reborn:  (bg) => ({ name: '🕹️ 리본(이미지)', type: 'image', src: `/images/reborn_frame_${getColorId(bg)}.png` , mask: '/images/retro_frame_mask.png' }) 
    },
    calendar: {
        simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로 (이미지)', type: 'image', src: `/images/retro_calendar_${getColorId(bg)}.png` }) 
    }
};

// --- 색상 변환 유틸리티 ---
const parseRgba = (color) => {
    if (!color) return { hex: '#000000', alpha: 1 };
    if (color.startsWith('#')) return { hex: color, alpha: 1 };
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { hex: '#000000', alpha: 1 };
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return { hex: `#${r}${g}${b}`, alpha: match[4] !== undefined ? parseFloat(match[4]) : 1 };
};
const toRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ==========================================
// 💡 스마트 색상 선택기
// ==========================================
const SmartColorPicker = ({ label, rgba, borderColor, onChange, onBorderChange, isImageTheme }) => {
    const { hex, alpha } = parseRgba(rgba || 'rgba(255,182,193,0.8)');
    const borderHex = parseRgba(borderColor || '#dddddd').hex;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '250px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>{label}</label>
            {isImageTheme ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {PRESET_COLORS.map((c) => (
                        <div key={c.value} title={c.name} onClick={() => onChange(c.value)}
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.colors[0]} 50%, ${c.colors[1]} 50%)`, cursor: 'pointer',
                                border: rgba === c.value ? '3px solid #1971c2' : '2px solid #fff', outline: rgba === c.value ? '2px solid #1971c2' : '1px solid #dee2e6',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transition: 'transform 0.2s', transform: rgba === c.value ? 'scale(1.1)' : 'scale(1)'
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: rgba, border: '2px solid #fff', outline: '1px solid #dee2e6', position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
                            <input type="color" value={hex} onChange={(e) => onChange(toRgba(e.target.value, alpha))} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontSize: '10px', color: '#666' }}>투명도</span>
                            <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={(e) => onChange(toRgba(hex, e.target.value))} style={{ width: '45px' }} />
                        </div>
                    </div>
                    {onBorderChange && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #dee2e6', paddingLeft: '15px' }}>
                            <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>외곽선</span>
                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: borderHex, border: '1px solid #ced4da', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                                <input type="color" value={borderHex} onChange={(e) => onBorderChange(e.target.value)} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MiniPreview = ({ type, frameKey, color, borderColor }) => {
    const assetResolver = UI_ASSETS[type][frameKey] || UI_ASSETS[type]['simple'];
    const asset = assetResolver(color, borderColor); 
    const isPortrait = type === 'portrait';

    return (
        <div style={{ width: '100px', height: '60px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ced4da', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
            {asset.type === 'image' ? (
                <img src={asset.src} alt="preview" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
            ) : (
                <div style={{ width: isPortrait ? '40px' : '80%', height: isPortrait ? '40px' : '50%', backgroundColor: color || '#333', border: asset.border, borderRadius: asset.borderRadius }} />
            )}
        </div>
    );
};

// --- 메인 컴포넌트 ---
export default function StepSettings() {
    const { 
        protagonist, setProtagonist, pFontStyle, setPFontStyle, characters, setCharacters, 
        customFonts, addCustomFont,
        globalUi, setGlobalUi 
    } = useCustomizerStore();
    
    const [previewTarget, setPreviewTarget] = useState('protagonist');
    const [previewBg, setPreviewBg] = useState('default'); // 미리보기 배경 상태

    // 스토어 데이터 안전망
    const currentGlobalUi = globalUi || { 
        calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', 
        calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff',
        systemFont: 'Pretendard', cursor: 'default', saveLoadStyle: 'modern' 
    };
    const safeSetGlobalUi = setGlobalUi || (() => console.warn('스토어에 setGlobalUi가 없습니다.'));

    const fontOptions = [
        { name: 'Pretendard (기본)', value: 'Pretendard' },
        { name: '둥근모꼴', value: 'DungGeunMo' },
        ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))
    ];

    const addCharacter = () => {
        if (characters.length >= 10) return alert('최대 10명까지만 추가할 수 있습니다!');
        setCharacters([...characters, { id: Date.now(), name: '', images: [], fontStyle: { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)' } }]);
    };
    const removeCharacter = (targetId) => setCharacters(characters.filter(char => char.id !== targetId));
    const updateCharacter = (id, field, value) => setCharacters(characters.map(char => char.id === id ? { ...char, [field]: value } : char));

    const checkIsSquare = (file) => new Promise((resolve) => {
        const img = new Image(); img.onload = () => resolve(img.width === img.height); img.src = URL.createObjectURL(file);
    });

    const handleImageUpload = async (e, targetId = 'protagonist') => {
        const files = Array.from(e.target.files);
        const MAX_IMAGES = 10;
        if (targetId === 'protagonist') {
            if (protagonist.images.length + files.length > MAX_IMAGES) return alert(`최대 ${MAX_IMAGES}장까지만 등록할 수 있습니다!`);
            for (let file of files) {
                if (!(await checkIsSquare(file))) return alert('🚨 주인공 초상화는 반드시 1:1 비율의 정사각형 이미지만 업로드 가능합니다!');
            }
            setProtagonist({ ...protagonist, images: [...protagonist.images, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))] });
        } else {
            const char = characters.find(c => c.id === targetId);
            if (char.images.length + files.length > MAX_IMAGES) return alert(`최대 ${MAX_IMAGES}장까지만 등록할 수 있습니다!`);
            updateCharacter(targetId, 'images', [...char.images, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
        }
    };
    
    const removeImage = (indexToRemove, targetId = 'protagonist') => {
        if (targetId === 'protagonist') setProtagonist({ ...protagonist, images: protagonist.images.filter((_, idx) => idx !== indexToRemove) });
        else updateCharacter(targetId, 'images', characters.find(c => c.id === targetId).images.filter((_, idx) => idx !== indexToRemove));
    };

    const handleFontUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fontName = file.name.split('.')[0];
            const newFont = new FontFace(fontName, `url(${event.target.result})`);
            
            newFont.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                
                // 💡 수정 포인트: 이름, 데이터(base64), 그리고 실제 'file' 객체까지 저장
                addCustomFont(fontName, event.target.result, file); 
                
                alert(`${fontName} 등록 완료!`);
            }).catch(err => {
                console.error("폰트 로드 실패:", err);
                alert("폰트 파일 로드에 실패했습니다.");
            });
        };
        reader.readAsDataURL(file);
    };

    const isP = previewTarget === 'protagonist';
    const activeChar = isP ? protagonist : characters.find(c => c.id === previewTarget);
    const activeStyle = isP ? pFontStyle : (activeChar?.fontStyle || pFontStyle);
    
    let standingImg = null;
    if (!isP && activeChar?.images?.length > 0) standingImg = activeChar.images[0].preview;
    else if (isP && characters.length > 0 && characters[0].images.length > 0) standingImg = characters[0].images[0].preview;

    // 에셋 생성
    const dAsset = (UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle.dialogColor, activeStyle.dialogBorderColor);
    const nAsset = (UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle.nameColor, activeStyle.nameBorderColor);
    const pAsset = isP ? (UI_ASSETS.portrait[activeStyle.portraitStyle] || UI_ASSETS.portrait.square)(activeStyle.portraitColor, activeStyle.portraitBorderColor) : null;
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.retro)(currentGlobalUi.calendarColor); 

    const renderFontFamily = activeStyle.font && activeStyle.font !== '' ? activeStyle.font : (currentGlobalUi.systemFont || 'sans-serif');

    const getCalendarTextShadow = () => {
        if (!currentGlobalUi.calendarTextUseOutline) return 'none';
        const oc = currentGlobalUi.calendarTextOutlineColor || '#ffffff';
        return `-1px -1px 0 ${oc}, 1px -1px 0 ${oc}, -1px 1px 0 ${oc}, 1px 1px 0 ${oc}`;
    };

    // 미리보기 배경 설정 로직
    const previewContainerStyle = {
        position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', border: '4px solid #333', overflow: 'hidden', containerType: 'size'
    };
    if (previewBg === 'default') {
        previewContainerStyle.backgroundColor = '#1a1b1e';
        previewContainerStyle.backgroundImage = 'radial-gradient(circle, #343a40 10%, transparent 10%), radial-gradient(circle, #343a40 10%, transparent 10%)';
        previewContainerStyle.backgroundSize = '20px 20px';
        previewContainerStyle.backgroundPosition = '0 0, 10px 10px';
    } else {
        previewContainerStyle.backgroundImage = `url(${previewBg})`;
        previewContainerStyle.backgroundSize = 'cover';
        previewContainerStyle.backgroundPosition = 'center';
    }

    return (
        <div className="customizer-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>등장인물 및 스타일 설정</h2>
            <p style={{ color: '#666', marginBottom: '40px', textAlign: 'center' }}>주인공과 등장인물의 이름, 일러스트, 폰트 및 UI 디자인을 설정해 주세요.</p>

            {/* 📺 1. 인게임 미리보기 화면 */}
            <div className="preview-section" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>📺 1920x1080 비율 인게임 미리보기</h4>
                    {/* ⭐ 배경 선택 콤보박스 추가 */}
                    <select 
                        value={previewBg} 
                        onChange={(e) => setPreviewBg(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px', cursor: 'pointer' }}
                    >
                        {PREVIEW_BACKGROUNDS.map(bg => (
                            <option key={bg.value} value={bg.value}>{bg.name}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setPreviewTarget('protagonist')} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: isP ? '#1971c2' : '#e9ecef', color: isP ? 'white' : '#333', fontWeight: isP ? 'bold' : 'normal' }}>😎 주인공 시점</button>
                    {characters.map((char, index) => (
                        <button key={char.id} onClick={() => setPreviewTarget(char.id)} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: previewTarget === char.id ? '#d6336c' : '#e9ecef', color: previewTarget === char.id ? 'white' : '#333', fontWeight: previewTarget === char.id ? 'bold' : 'normal' }}>🎭 {char.name || `등장인물 ${index + 1}`} 시점</button>
                    ))}
                </div>

                <div style={previewContainerStyle}>
                    {standingImg && <img src={standingImg} alt="스탠딩" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '92.6%', objectFit: 'contain' }} />}

                    {/* ⭐ 상단 달력/시간 패널 */}
                    <div style={{ position: 'absolute', left: '13.02%', top: '4.63%', display: 'flex', alignItems: 'center', gap: '1.3cqw', zIndex: 11 }}>
                        <div style={{
                            width: '7.81cqw', height: '7.81cqw', 
                            backgroundColor: cAsset.type === 'image' ? 'transparent' : (currentGlobalUi.calendarColor || 'rgba(255,255,255,0.8)'),
                            backgroundImage: cAsset.type === 'image' ? `url(${cAsset.src})` : 'none',
                            backgroundSize: '100% 100%', border: cAsset.type === 'css' ? cAsset.border : 'none', borderRadius: cAsset.type === 'css' ? cAsset.borderRadius : '0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {/* ⭐ 시스템 폰트 적용된 달력 숫자 */}
                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontSize: '5cqh', color: '#5C4033', fontWeight: 'bold', textShadow: getCalendarTextShadow(), marginTop: '10px' }}>12</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8cqh' }}>
                            {/* ⭐ 시스템 폰트 적용된 옆 텍스트 */}
                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontSize: '3cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>DATE: OCT 12</span>
                            <span style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontSize: '3cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: getCalendarTextShadow() }}>TIME: 14:30</span>
                        </div>
                    </div>

                    {isP && pAsset && (
                        <div style={{ position: 'absolute', left: '13.02%', top: '72.22%', width: '13.02%', height: '23.15%', zIndex: 10, overflow: 'visible' }}>
                            {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 1 }} />}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%', zIndex: 2,
                                backgroundColor: pAsset.type === 'image' ? 'transparent' : (activeStyle.portraitColor || 'rgba(255,182,193,0.8)'),
                                WebkitMaskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', maskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none',
                                WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                                borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', border: pAsset.type === 'css' ? pAsset.border : 'none', boxSizing: 'border-box', overflow: 'hidden'
                            }}>
                                {protagonist.images.length > 0 ? ( <img src={protagonist.images[0].preview} alt="주인공" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : ( <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>👤</div> )}
                            </div>
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', left: '27.6%', top: '66.66%', width: '9.37%', height: '4.63%',
                        backgroundColor: nAsset.type === 'image' ? 'transparent' : (activeStyle.nameColor || 'rgba(0,0,0,0.8)'),
                        backgroundImage: nAsset.type === 'image' && nAsset.src ? `url(${nAsset.src})` : 'none', backgroundSize: '100% 100%',
                        border: nAsset.type === 'css' ? nAsset.border : 'none', borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11
                    }}>
                        <span style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '2.5cqh', fontWeight: 'bold', display: 'block', width: '100%', textAlign: 'center' }}>
                            {activeChar?.name || (isP ? '주인공' : '등장인물')}
                        </span>
                    </div>

                    <div style={{
                        position: 'absolute', left: '27.6%', top: '72.22%', width: '57.3%', height: '23.15%',
                        backgroundColor: dAsset.type === 'image' ? 'transparent' : (activeStyle.dialogColor || 'rgba(0,0,0,0.8)'),
                        backgroundImage: dAsset.type === 'image' && dAsset.src ? `url(${dAsset.src})` : 'none', backgroundSize: '100% 100%',
                        border: dAsset.type === 'css' ? dAsset.border : 'none', borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0',
                        padding: '3cqh 4cqw', boxSizing: 'border-box', zIndex: 11
                    }}>
                        <p style={{ fontFamily: renderFontFamily, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh', marginTop: 0 }}>
                            "{activeChar?.name || (isP ? '주인공' : '등장인물')}의 대사가 이곳에 출력됩니다."
                        </p>
                    </div>
                </div>
            </div>

            {/* 👤 2. 이름 및 스탠딩 일러 설정 */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>👤 2. 이름 및 스탠딩 일러 설정</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                <div className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#1971c2' }}>😎 주인공 (Player)</h4>
                    <div className="input-group" style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label><input type="text" className="text-input" placeholder="이름 입력" value={protagonist.name} onChange={(e) => setProtagonist({...protagonist, name: e.target.value})} /></div>
                    <div className="input-group"><label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드 (1:1 정사각형, 최대 10장)</label><input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'protagonist')} className="file-input" /></div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>{protagonist.images.map((img, idx) => (<div key={idx} style={{ position: 'relative' }}><img src={img.preview} alt="p" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => removeImage(idx, 'protagonist')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>))}</div>
                </div>

                {characters.map((char, index) => (
                    <div key={char.id} className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px', position: 'relative' }}>
                        {characters.length > 1 && <button onClick={() => removeCharacter(char.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ff6b6b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>삭제</button>}
                        <h4 style={{ marginTop: 0, color: '#d6336c' }}>🎭 등장인물 {index + 1}</h4>
                        <div className="input-group" style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label><input type="text" className="text-input" placeholder="이름 입력" value={char.name} onChange={(e) => updateCharacter(char.id, 'name', e.target.value)} /></div>
                        <div className="input-group"><label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드 (최대 10장)</label><input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, char.id)} className="file-input" /></div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>{char.images.map((img, idx) => (<div key={idx} style={{ position: 'relative' }}><img src={img.preview} alt="c" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => removeImage(idx, char.id)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>))}</div>
                    </div>
                ))}
                <button onClick={addCharacter} style={{ padding: '15px', backgroundColor: '#f1f3f5', border: '2px dashed #adb5bd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#495057' }}>➕ 등장인물 추가하기 ({characters.length} / 10)</button>
            </div>

            {/* ⭐ 3. 게임 전역 UI 셋팅 */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>🎮 3. 게임 전역 UI 셋팅</h4>
            <div style={{ backgroundColor: '#fdf3f5', border: '1px solid #fcc2d7', padding: '20px', borderRadius: '8px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1층: 시스템 폰트 및 달력 틀 설정 */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🔤 시스템 기본 폰트</label>
                        <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} 
                            value={currentGlobalUi.systemFont} onChange={(e) => safeSetGlobalUi({ systemFont: e.target.value })}>
                            {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                        </select>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <MiniPreview type="calendar" frameKey={currentGlobalUi.calendarFrame} color={currentGlobalUi.calendarColor} />
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📅 달력 틀 테마</label>
                                <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} 
                                    value={currentGlobalUi.calendarFrame} onChange={(e) => safeSetGlobalUi({ calendarFrame: e.target.value })}>
                                    {Object.keys(UI_ASSETS.calendar).map((key) => <option key={key} value={key}>{UI_ASSETS.calendar[key]().name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2층: 달력 틀 색상 및 글자 색상/외곽선 */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px dashed #fcc2d7', paddingTop: '20px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <SmartColorPicker 
                            label="🎨 달력 틀 색상" 
                            rgba={currentGlobalUi.calendarColor} 
                            isImageTheme={UI_ASSETS.calendar[currentGlobalUi.calendarFrame || 'simple']().type === 'image'} 
                            onChange={(val) => safeSetGlobalUi({ calendarColor: val })} 
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📝 날짜/시간 글자 스타일</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#666' }}>글자색</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: currentGlobalUi.calendarTextColor, border: '1px solid #ced4da', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                                    <input type="color" value={currentGlobalUi.calendarTextColor} onChange={(e) => safeSetGlobalUi({ calendarTextColor: e.target.value })} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #dee2e6', paddingLeft: '15px' }}>
                                <input type="checkbox" id="cal-outline-check" checked={currentGlobalUi.calendarTextUseOutline} onChange={(e) => safeSetGlobalUi({ calendarTextUseOutline: e.target.checked })} style={{ cursor: 'pointer' }} />
                                <label htmlFor="cal-outline-check" style={{ fontSize: '11px', color: '#666', cursor: 'pointer' }}>외곽선</label>
                                {currentGlobalUi.calendarTextUseOutline && (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: currentGlobalUi.calendarTextOutlineColor, border: '1px solid #ced4da', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                                        <input type="color" value={currentGlobalUi.calendarTextOutlineColor} onChange={(e) => safeSetGlobalUi({ calendarTextOutlineColor: e.target.value })} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3층: 마우스 및 저장/로드 스타일 */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px dashed #fcc2d7', paddingTop: '20px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🖱️ 마우스 커서 스타일</label>
                        <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} 
                            value={currentGlobalUi.cursor} onChange={(e) => safeSetGlobalUi({ cursor: e.target.value })}>
                            <option value="default">기본 화살표</option>
                            <option value="retro">픽셀 레트로</option>
                            <option value="magic">마법 지팡이</option>
                            <option value="cat">고양이 발바닥</option>
                        </select>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💾 세이브/로드 화면 스타일</label>
                        <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} 
                            value={currentGlobalUi.saveLoadStyle} onChange={(e) => safeSetGlobalUi({ saveLoadStyle: e.target.value })}>
                            <option value="modern">모던 (깔끔한 반투명)</option>
                            <option value="retro">레트로 (픽셀 팝업창)</option>
                            <option value="fantasy">판타지 (양피지 두루마리)</option>
                            <option value="sf">SF (홀로그램 패널)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* 🎨 4. 대화창 및 폰트 테마 설정 */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>🎨 4. 대화창 및 폰트 테마 설정</h4>
            <div className="input-group" style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}><label style={{ fontWeight: 'bold' }}>➕ 커스텀 폰트 파일 추가 (.ttf, .otf)</label><input type="file" accept=".ttf, .otf, .woff, .woff2" onChange={handleFontUpload} className="file-input" style={{ display: 'block', marginTop: '5px' }} /></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 😎 주인공 스타일/UI 설정 */}
                <div style={{ padding: '20px', backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #d0ebff' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#1971c2' }}>😎 {protagonist.name || '주인공'} 전용 스타일</h4>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}><label style={{ fontSize: '13px' }}>폰트</label><select style={{ width: '100%', padding: '6px' }} value={pFontStyle.font} onChange={(e) => setPFontStyle({ font: e.target.value })}>{fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}</select></div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            <div><label style={{ fontSize: '13px', display: 'block' }}>글자색</label><input type="color" value={parseRgba(pFontStyle.color).hex} onChange={(e) => setPFontStyle({ color: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>
                            <div><label style={{ fontSize: '13px', display: 'block' }}>외곽선</label><input type="checkbox" checked={pFontStyle.useOutline} onChange={(e) => setPFontStyle({ useOutline: e.target.checked })} /></div>
                            {pFontStyle.useOutline && <div><label style={{ fontSize: '13px', display: 'block' }}>선 색상</label><input type="color" value={parseRgba(pFontStyle.outline).hex} onChange={(e) => setPFontStyle({ outline: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #74c0fc', paddingTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                            <MiniPreview type="dialog" frameKey={pFontStyle.dialogFrame} color={pFontStyle.dialogColor} borderColor={pFontStyle.dialogBorderColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>💬 대화창 테마</label>
                            <select style={{ width: '100%', padding: '6px' }} value={pFontStyle.dialogFrame || 'simple'} onChange={(e) => setPFontStyle({ dialogFrame: e.target.value })}>
                                {Object.keys(UI_ASSETS.dialog).map((key) => <option key={key} value={key}>{UI_ASSETS.dialog[key]().name}</option>)}
                            </select></div>
                        </div>
                        <SmartColorPicker label="🎨 대화창 색상" rgba={pFontStyle.dialogColor} borderColor={pFontStyle.dialogBorderColor} isImageTheme={UI_ASSETS.dialog[pFontStyle.dialogFrame || 'simple']().type === 'image'} onChange={(val) => setPFontStyle({ dialogColor: val })} onBorderChange={(val) => setPFontStyle({ dialogBorderColor: val })} />
                    </div>

                    <div style={{ borderTop: '1px dashed #74c0fc', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                            <MiniPreview type="namebox" frameKey={pFontStyle.nameFrame} color={pFontStyle.nameColor} borderColor={pFontStyle.nameBorderColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🏷️ 네임칸 테마</label>
                            <select style={{ width: '100%', padding: '6px' }} value={pFontStyle.nameFrame || 'simple'} onChange={(e) => setPFontStyle({ nameFrame: e.target.value })}>
                                {Object.keys(UI_ASSETS.namebox).map((key) => <option key={key} value={key}>{UI_ASSETS.namebox[key]().name}</option>)}
                            </select></div>
                        </div>
                        <SmartColorPicker label="🎨 네임칸 색상" rgba={pFontStyle.nameColor} borderColor={pFontStyle.nameBorderColor} isImageTheme={UI_ASSETS.namebox[pFontStyle.nameFrame || 'simple']().type === 'image'} onChange={(val) => setPFontStyle({ nameColor: val })} onBorderChange={(val) => setPFontStyle({ nameBorderColor: val })} />
                    </div>

                    <div style={{ borderTop: '1px dashed #74c0fc', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                            <MiniPreview type="portrait" frameKey={pFontStyle.portraitStyle} color={pFontStyle.portraitColor} borderColor={pFontStyle.portraitBorderColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🖼️ 초상화 프레임</label>
                            <select style={{ width: '100%', padding: '6px' }} value={pFontStyle.portraitStyle || 'square'} onChange={(e) => setPFontStyle({ portraitStyle: e.target.value })}>
                                {Object.keys(UI_ASSETS.portrait).map((key) => <option key={key} value={key}>{UI_ASSETS.portrait[key]().name}</option>)}
                            </select></div>
                        </div>
                        <SmartColorPicker label="🎨 초상화 배경색" rgba={pFontStyle.portraitColor} borderColor={pFontStyle.portraitBorderColor} isImageTheme={UI_ASSETS.portrait[pFontStyle.portraitStyle || 'square']().type === 'image'} onChange={(val) => setPFontStyle({ portraitColor: val })} onBorderChange={(val) => setPFontStyle({ portraitBorderColor: val })} />
                    </div>
                </div>

                {/* 🎭 등장인물 스타일/UI 설정 반복 */}
                {characters.map((char, index) => (
                    <div key={char.id} style={{ padding: '20px', backgroundColor: '#fff0f6', borderRadius: '8px', border: '1px solid #ffdeeb' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#d6336c' }}>🎭 {char.name || `등장인물 ${index + 1}`} 전용 스타일</h4>
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}><label style={{ fontSize: '13px' }}>폰트</label><select style={{ width: '100%', padding: '6px' }} value={char.fontStyle.font} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, font: e.target.value })}>{fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}</select></div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                                <div><label style={{ fontSize: '13px', display: 'block' }}>글자색</label><input type="color" value={parseRgba(char.fontStyle.color).hex} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, color: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>
                                <div><label style={{ fontSize: '13px', display: 'block' }}>외곽선</label><input type="checkbox" checked={char.fontStyle.useOutline} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, useOutline: e.target.checked })} /></div>
                                {char.fontStyle.useOutline && <div><label style={{ fontSize: '13px', display: 'block' }}>선 색상</label><input type="color" value={parseRgba(char.fontStyle.outline).hex} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, outline: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #faa2c1', paddingTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                                <MiniPreview type="dialog" frameKey={char.fontStyle.dialogFrame} color={char.fontStyle.dialogColor} borderColor={char.fontStyle.dialogBorderColor} />
                                <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>💬 대화창 테마</label>
                                <select style={{ width: '100%', padding: '6px' }} value={char.fontStyle.dialogFrame || 'simple'} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, dialogFrame: e.target.value })}>
                                    {Object.keys(UI_ASSETS.dialog).map((key) => <option key={key} value={key}>{UI_ASSETS.dialog[key]().name}</option>)}
                                </select></div>
                            </div>
                            <SmartColorPicker label="🎨 대화창 색상" rgba={char.fontStyle.dialogColor} borderColor={char.fontStyle.dialogBorderColor} isImageTheme={UI_ASSETS.dialog[char.fontStyle.dialogFrame || 'simple']().type === 'image'} onChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, dialogColor: val })} onBorderChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, dialogBorderColor: val })} />
                        </div>

                        <div style={{ borderTop: '1px dashed #faa2c1', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                                <MiniPreview type="namebox" frameKey={char.fontStyle.nameFrame} color={char.fontStyle.nameColor} borderColor={char.fontStyle.nameBorderColor} />
                                <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🏷️ 네임칸 테마</label>
                                <select style={{ width: '100%', padding: '6px' }} value={char.fontStyle.nameFrame || 'simple'} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, nameFrame: e.target.value })}>
                                    {Object.keys(UI_ASSETS.namebox).map((key) => <option key={key} value={key}>{UI_ASSETS.namebox[key]().name}</option>)}
                                </select></div>
                            </div>
                            <SmartColorPicker label="🎨 네임칸 색상" rgba={char.fontStyle.nameColor} borderColor={char.fontStyle.nameBorderColor} isImageTheme={UI_ASSETS.namebox[char.fontStyle.nameFrame || 'simple']().type === 'image'} onChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, nameColor: val })} onBorderChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, nameBorderColor: val })} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}