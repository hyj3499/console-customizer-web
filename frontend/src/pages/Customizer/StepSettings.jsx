// src/pages/Customizer/StepSettings.jsx
import { useState } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';

// ==========================================
// 💡 UI 에셋 통합 관리 객체
// ==========================================
const UI_ASSETS = {
    dialog: {
        simple: { name: '심플형 (깔끔한 테두리)', type: 'css', border: '1px solid #ddd', borderRadius: '4px' },
        gothic: { name: '고딕풍 (클래식/판타지)', type: 'css', border: '3px double #a9a9a9', borderRadius: '0px' },
        cute:   { name: '큐티 (둥글고 귀여운)', type: 'css', border: '2px dashed #ffb3c6', borderRadius: '15px' },
        retro:  { name: '🕹️ 레트로 (이미지)', type: 'image', src: '/images/retro_dialog.png' } 
    },
    namebox: {
        simple: { name: '심플형 (깔끔한 테두리)', type: 'css', border: '1px solid #ddd', borderRadius: '4px' },
        gothic: { name: '고딕풍 (클래식/판타지)', type: 'css', border: '3px double #a9a9a9', borderRadius: '0px' },
        cute:   { name: '큐티 (둥글고 귀여운)', type: 'css', border: '2px dashed #ffb3c6', borderRadius: '15px' },
        retro:  { name: '🕹️ 레트로 (이미지)', type: 'image', src: '/images/retro_namebox.png' } 
    },
    portrait: {
        square:  { name: '기본 사각형 (Square)', type: 'css', borderRadius: '0%' },
        rounded: { name: '부드러운 사각 (Rounded)', type: 'css', borderRadius: '12%' },
        circle:  { name: '완벽한 원형 (Circle)', type: 'css', borderRadius: '50%' },
        retro:   { name: '🎮 레트로 프레임 (이미지)', type: 'image', src: '/images/retro_frame.png', mask: '/images/retro_frame_mask.png' }
    }
};

// 이미지 테마일 때 제공할 고정 색상 팔레트
const PRESET_COLORS = [
    { name: '블랙', value: 'rgba(0,0,0,0.8)' },
    { name: '화이트', value: 'rgba(255,255,255,0.8)' },
    { name: '핑크', value: 'rgba(255,182,193,0.8)' },
    { name: '블루', value: 'rgba(173,216,230,0.8)' },
    { name: '퍼플', value: 'rgba(205,180,219,0.8)' }
];

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
// 💡 [요구사항 1, 2] 스마트 색상 선택기 컴포넌트
// 테마 타입(isImageTheme)에 따라 CSS자유모드와 이미지고정모드로 분기
// ==========================================
const SmartColorPicker = ({ label, rgba, onChange, isImageTheme }) => {
    const { hex, alpha } = parseRgba(rgba || 'rgba(0,0,0,0.8)');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>{label}</label>
            
            {/* ⭐ 이미지 테마일 경우: 정해진 팔레트에서 선택 */}
            {isImageTheme ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {PRESET_COLORS.map((c) => (
                        <div 
                            key={c.value}
                            title={c.name}
                            onClick={() => onChange(c.value)}
                            style={{
                                width: '28px', height: '28px', borderRadius: '50%', 
                                backgroundColor: c.value, cursor: 'pointer',
                                // 선택된 색상은 테두리로 강조
                                border: rgba === c.value ? '3px solid #1971c2' : '2px solid #dee2e6',
                                boxShadow: rgba === c.value ? '0 0 5px rgba(25,113,194,0.5)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        />
                    ))}
                </div>
            ) : (
                /* ⭐ CSS 테마일 경우: 자유 RGB 및 투명도 선택 */
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '50%', backgroundColor: rgba, 
                        border: '3px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0
                    }}>
                        <input type="color" value={hex} onChange={(e) => onChange(toRgba(e.target.value, alpha))}
                            style={{ opacity: 0, position: 'absolute', top: '-10px', left: '-10px', width: '50px', height: '50px', cursor: 'pointer' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                        <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>불투명도</span>
                        <input type="range" min="0" max="1" step="0.05" value={alpha}
                            onChange={(e) => onChange(toRgba(hex, e.target.value))} style={{ flex: 1 }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// 미니 미리보기 컴포넌트
const MiniPreview = ({ type, frameKey, color }) => {
    const asset = UI_ASSETS[type][frameKey] || UI_ASSETS[type]['simple'];
    return (
        <div style={{ 
            width: '45px', height: '45px', backgroundColor: '#e9ecef', borderRadius: '6px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ced4da', flexShrink: 0 
        }}>
            {asset.type === 'image' ? (
                <img src={asset.src} alt="preview" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
            ) : (
                <div style={{ width: '70%', height: '50%', backgroundColor: color || '#333', border: asset.border, borderRadius: asset.borderRadius }} />
            )}
        </div>
    );
};

export default function StepSettings() {
    const { protagonist, setProtagonist, pFontStyle, setPFontStyle, characters, setCharacters, customFonts, addCustomFont } = useCustomizerStore();
    const [previewTarget, setPreviewTarget] = useState('protagonist');

    const fontOptions = [
        { name: 'Pretendard (기본)', value: 'Pretendard' },
        { name: '둥근모꼴', value: 'DungGeunMo' },
        ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))
    ];

    // --- 기능 ---
    const addCharacter = () => {
        if (characters.length >= 8) return alert('최대 8명까지만 추가할 수 있습니다!');
        setCharacters([...characters, { id: Date.now(), name: '', images: [], fontStyle: { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', nameFrame: 'simple', nameColor: 'rgba(0,0,0,0.8)' } }]);
    };
    const removeCharacter = (targetId) => setCharacters(characters.filter(char => char.id !== targetId));
    const updateCharacter = (id, field, value) => setCharacters(characters.map(char => char.id === id ? { ...char, [field]: value } : char));

    const handleImageUpload = (e, targetId = 'protagonist') => {
        const files = Array.from(e.target.files);
        if (targetId === 'protagonist') {
            if (protagonist.images.length + files.length > 8) return alert('최대 8장!');
            setProtagonist({ ...protagonist, images: [...protagonist.images, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))] });
        } else {
            const char = characters.find(c => c.id === targetId);
            if (char.images.length + files.length > 8) return alert('최대 8장!');
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
            const newFont = new FontFace(file.name.split('.')[0], `url(${event.target.result})`);
            newFont.load().then((loadedFont) => {
                document.fonts.add(loadedFont); addCustomFont(file.name.split('.')[0], event.target.result); alert(`${file.name.split('.')[0]} 등록 완료!`);
            });
        };
        reader.readAsDataURL(file);
    };

    // --- 렌더링 데이터 ---
    const isP = previewTarget === 'protagonist';
    const activeChar = isP ? protagonist : characters.find(c => c.id === previewTarget);
    const activeStyle = isP ? pFontStyle : (activeChar?.fontStyle || pFontStyle);
    
    let standingImg = null;
    if (!isP && activeChar?.images?.length > 0) standingImg = activeChar.images[0].preview;
    else if (isP && characters.length > 0 && characters[0].images.length > 0) standingImg = characters[0].images[0].preview;

    const dAsset = UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple;
    const nAsset = UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple;
    const pAsset = isP ? (UI_ASSETS.portrait[activeStyle.portraitStyle] || UI_ASSETS.portrait.square) : null;

    return (
        <div className="customizer-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>등장인물 및 스타일 설정</h2>
            <p style={{ color: '#666', marginBottom: '40px', textAlign: 'center' }}>주인공과 등장인물의 이름, 일러스트, 폰트 및 UI 디자인을 설정해 주세요.</p>

            {/* 📺 1. 인게임 미리보기 화면 */}
            <div className="preview-section" style={{ marginBottom: '30px' }}>
                <h4 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>📺 1920x1080 비율 인게임 미리보기</h4>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setPreviewTarget('protagonist')} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: isP ? '#1971c2' : '#e9ecef', color: isP ? 'white' : '#333', fontWeight: isP ? 'bold' : 'normal' }}>😎 주인공 시점</button>
                    {characters.map((char, index) => (
                        <button key={char.id} onClick={() => setPreviewTarget(char.id)} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: previewTarget === char.id ? '#d6336c' : '#e9ecef', color: previewTarget === char.id ? 'white' : '#333', fontWeight: previewTarget === char.id ? 'bold' : 'normal' }}>🎭 {char.name || `등장인물 ${index + 1}`} 시점</button>
                    ))}
                </div>

                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#1a1b1e', backgroundImage: 'radial-gradient(circle, #343a40 10%, transparent 10%), radial-gradient(circle, #343a40 10%, transparent 10%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px', borderRadius: '8px', border: '4px solid #333', overflow: 'hidden', containerType: 'size' }}>
                    {standingImg && <img src={standingImg} alt="스탠딩" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '92.6%', objectFit: 'contain' }} />}

                    {isP && pAsset && (
                        <div style={{ position: 'absolute', left: '13.02%', top: '72.22%', width: '13.02%', height: '23.15%', zIndex: 10, overflow: 'visible' }}>
                            {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 1 }} />}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%', zIndex: 2,
                                backgroundColor: pAsset.type === 'image' ? activeStyle.portraitColor : (activeStyle.portraitColor || 'transparent'),
                                WebkitMaskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none',
                                maskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none',
                                WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                                borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', overflow: 'hidden'
                            }}>
                                {protagonist.images.length > 0 ? (
                                    <img src={protagonist.images[0].preview} alt="주인공" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>👤</div>
                                )}
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
                        <span style={{ fontFamily: activeStyle.font, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '2.5cqh', fontWeight: 'bold' }}>
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
                        <p style={{ fontFamily: activeStyle.font, color: activeStyle.color || '#fff', textShadow: activeStyle.useOutline ? `-1px -1px 0 ${activeStyle.outline}, 1px -1px 0 ${activeStyle.outline}, -1px 1px 0 ${activeStyle.outline}, 1px 1px 0 ${activeStyle.outline}` : 'none', fontSize: '3cqh', marginTop: 0 }}>
                            "{activeChar?.name || (isP ? '주인공' : '등장인물')}의 대사가 이곳에 출력됩니다."
                        </p>
                    </div>
                </div>
            </div>

            {/* 👤 2. 이름 및 스탠딩 일러 설정 */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>👤 이름 및 스탠딩 일러 설정</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                <div className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#1971c2' }}>😎 주인공 (Player)</h4>
                    <div className="input-group" style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label><input type="text" className="text-input" placeholder="이름 입력" value={protagonist.name} onChange={(e) => setProtagonist({...protagonist, name: e.target.value})} /></div>
                    <div className="input-group"><label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드 (첫 사진이 초상화로 쓰입니다)</label><input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'protagonist')} className="file-input" /></div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>{protagonist.images.map((img, idx) => (<div key={idx} style={{ position: 'relative' }}><img src={img.preview} alt="p" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => removeImage(idx, 'protagonist')} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>))}</div>
                </div>

                {characters.map((char, index) => (
                    <div key={char.id} className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px', position: 'relative' }}>
                        {characters.length > 1 && <button onClick={() => removeCharacter(char.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ff6b6b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>삭제</button>}
                        <h4 style={{ marginTop: 0, color: '#d6336c' }}>🎭 등장인물 {index + 1}</h4>
                        <div className="input-group" style={{ marginBottom: '15px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label><input type="text" className="text-input" placeholder="이름 입력" value={char.name} onChange={(e) => updateCharacter(char.id, 'name', e.target.value)} /></div>
                        <div className="input-group"><label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드</label><input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, char.id)} className="file-input" /></div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>{char.images.map((img, idx) => (<div key={idx} style={{ position: 'relative' }}><img src={img.preview} alt="c" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => removeImage(idx, char.id)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>×</button></div>))}</div>
                    </div>
                ))}
                <button onClick={addCharacter} style={{ padding: '15px', backgroundColor: '#f1f3f5', border: '2px dashed #adb5bd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#495057' }}>➕ 등장인물 추가하기 ({characters.length} / 8)</button>
            </div>
            
            {/* 🎨 3. 폰트 및 UI 테마 설정 */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333' }}>🎨 폰트 및 UI 테마 설정</h4>
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
                            <MiniPreview type="dialog" frameKey={pFontStyle.dialogFrame} color={pFontStyle.dialogColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>💬 대화창 테마</label><select style={{ width: '100%', padding: '6px' }} value={pFontStyle.dialogFrame || 'simple'} onChange={(e) => setPFontStyle({ dialogFrame: e.target.value })}>{Object.entries(UI_ASSETS.dialog).map(([key, asset]) => <option key={key} value={key}>{asset.name}</option>)}</select></div>
                        </div>
                        {/* ⭐ SmartColorPicker: 테마가 image면 팔레트, css면 자유 선택기 표시 */}
                        <SmartColorPicker label="🎨 대화창 색상" rgba={pFontStyle.dialogColor} isImageTheme={UI_ASSETS.dialog[pFontStyle.dialogFrame || 'simple'].type === 'image'} onChange={(val) => setPFontStyle({ dialogColor: val })} />
                    </div>

                    <div style={{ borderTop: '1px dashed #74c0fc', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                            <MiniPreview type="namebox" frameKey={pFontStyle.nameFrame} color={pFontStyle.nameColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🏷️ 네임칸 테마</label><select style={{ width: '100%', padding: '6px' }} value={pFontStyle.nameFrame || 'simple'} onChange={(e) => setPFontStyle({ nameFrame: e.target.value })}>{Object.entries(UI_ASSETS.namebox).map(([key, asset]) => <option key={key} value={key}>{asset.name}</option>)}</select></div>
                        </div>
                        <SmartColorPicker label="🎨 네임칸 색상" rgba={pFontStyle.nameColor} isImageTheme={UI_ASSETS.namebox[pFontStyle.nameFrame || 'simple'].type === 'image'} onChange={(val) => setPFontStyle({ nameColor: val })} />
                    </div>

                    <div style={{ borderTop: '1px dashed #74c0fc', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                            <MiniPreview type="portrait" frameKey={pFontStyle.portraitStyle} color={pFontStyle.portraitColor} />
                            <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🖼️ 초상화 프레임</label><select style={{ width: '100%', padding: '6px' }} value={pFontStyle.portraitStyle || 'square'} onChange={(e) => setPFontStyle({ portraitStyle: e.target.value })}>{Object.entries(UI_ASSETS.portrait).map(([key, asset]) => <option key={key} value={key}>{asset.name}</option>)}</select></div>
                        </div>
                        <SmartColorPicker label="🎨 초상화 배경색" rgba={pFontStyle.portraitColor} isImageTheme={UI_ASSETS.portrait[pFontStyle.portraitStyle || 'square'].type === 'image'} onChange={(val) => setPFontStyle({ portraitColor: val })} />
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
                                <MiniPreview type="dialog" frameKey={char.fontStyle.dialogFrame} color={char.fontStyle.dialogColor} />
                                <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>💬 대화창 테마</label><select style={{ width: '100%', padding: '6px' }} value={char.fontStyle.dialogFrame || 'simple'} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, dialogFrame: e.target.value })}>{Object.entries(UI_ASSETS.dialog).map(([key, asset]) => <option key={key} value={key}>{asset.name}</option>)}</select></div>
                            </div>
                            <SmartColorPicker label="🎨 대화창 색상" rgba={char.fontStyle.dialogColor} isImageTheme={UI_ASSETS.dialog[char.fontStyle.dialogFrame || 'simple'].type === 'image'} onChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, dialogColor: val })} />
                        </div>

                        <div style={{ borderTop: '1px dashed #faa2c1', paddingTop: '15px', marginTop: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
                                <MiniPreview type="namebox" frameKey={char.fontStyle.nameFrame} color={char.fontStyle.nameColor} />
                                <div style={{ flex: 1 }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>🏷️ 네임칸 테마</label><select style={{ width: '100%', padding: '6px' }} value={char.fontStyle.nameFrame || 'simple'} onChange={(e) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, nameFrame: e.target.value })}>{Object.entries(UI_ASSETS.namebox).map(([key, asset]) => <option key={key} value={key}>{asset.name}</option>)}</select></div>
                            </div>
                            <SmartColorPicker label="🎨 네임칸 색상" rgba={char.fontStyle.nameColor} isImageTheme={UI_ASSETS.namebox[char.fontStyle.nameFrame || 'simple'].type === 'image'} onChange={(val) => updateCharacter(char.id, 'fontStyle', { ...char.fontStyle, nameColor: val })} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}