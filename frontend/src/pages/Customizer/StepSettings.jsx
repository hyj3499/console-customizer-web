// ==============================================================================
// 📄 파일 경로 : src/pages/Customizer/StepSettings.jsx
// 🎯 주요 역할 : 게임 커스터마이징 Step 2 (등장인물/주인공 설정 및 UI 테마 커스텀)
// 💡 추가 기능 : 타이핑 애니메이션 연출, 캐릭터별 타이핑 효과음, 외곽선 및 네임칸 반응형
// ==============================================================================

import { useState, useEffect, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepSettings.css'; 

// --------------------------------------------------------
// 1. 상수 및 데이터 유틸리티 모음
// --------------------------------------------------------
const PRESET_COLORS = [
    { id: 'pink', name: '핑크', value: 'rgba(255,182,193,0.8)', colors: ['#ffb6c1', '#faafbe'] },
    { id: 'black', name: '블랙', value: 'rgba(0,0,0,0.8)', colors: ['#444444', '#000000'] },
    { id: 'white', name: '화이트', value: 'rgba(255,255,255,0.8)', colors: ['#ffffff', '#e0e0e0'] },
    { id: 'blue', name: '블루', value: 'rgba(173,216,230,0.8)', colors: ['#add8e6', '#87ceeb'] },
    { id: 'purple', name: '퍼플', value: 'rgba(205,180,219,0.8)', colors: ['#d8bfd8', '#b19cd9'] }
];

const getColorId = (rgbaValue) => PRESET_COLORS.find(c => c.value === rgbaValue)?.id || 'pink';

const getImgUrl = (imgData) => {
    if (!imgData) return null;
    if (typeof imgData === 'string') return imgData;
    if (typeof imgData === 'object' && imgData.preview) return imgData.preview;
    return null;
};

const PREVIEW_BACKGROUNDS = [
    { name: '기본 (투명/격자)', value: 'default' },
    { name: '교실 (낮)', value: '/images/bg_school.png' },
    { name: '교실 (밤)', value: 'https://via.placeholder.com/1920x1080/2c3e50/ffffff?text=Classroom+(Night)' },
    { name: '바다', value: 'https://via.placeholder.com/1920x1080/87cefa/000000?text=Sea' },
    { name: '숲', value: 'https://via.placeholder.com/1920x1080/228b22/ffffff?text=Forest' }
];

// ⭐ 타이핑 효과음 목록 설정
const SOUND_EFFECTS = [
    { id: 'type1', name: '일반 타자기 (Type 1)', src: '/sounds/type1.wav' }, 
    { id: 'type2', name: '경쾌한 키보드 (Type 2)', src: '/sounds/type2.wav' },
    { id: 'type3', name: '전자음 띡띡 (Type 3)', src: '/sounds/type3.wav' },
    { id: 'type4', name: '묵직한 기계음 (Type 4)', src: '/sounds/type4.wav' },
    { id: 'none', name: '음소거', src: null }
];

const UI_ASSETS = {
    dialog: {
        simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        gothic: (bg, border='#a9a9a9') => ({ name: '고딕풍', type: 'css', border: `4px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ name: '큐티', type: 'css', border: `3px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로', type: 'image', src: `/images/retro_dialog_${getColorId(bg)}.png` }) 
    },
    namebox: {
        simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        gothic: (bg, border='#a9a9a9') => ({ name: '고딕풍', type: 'css', border: `3px double ${border}`, borderRadius: '0px' }),
        cute:   (bg, border='#ffb3c6') => ({ name: '큐티', type: 'css', border: `2px dashed ${border}`, borderRadius: '15px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로', type: 'image', src: `/images/retro_namebox_${getColorId(bg)}.png` })
    },
    portrait: {
        square:  (bg, border='#dddddd') => ({ name: '기본 사각형', type: 'css', border: `3px solid ${border}`, borderRadius: '0%' }),
        rounded: (bg, border='#dddddd') => ({ name: '부드러운 사각', type: 'css', border: `3px solid ${border}`, borderRadius: '12%' }),
        circle:  (bg, border='#dddddd') => ({ name: '완벽한 원형', type: 'css', border: `3px solid ${border}`, borderRadius: '50%' }),
        retro:   (bg) => ({ name: '🎮 레트로 프레임', type: 'image', src: `/images/retro_frame_${getColorId(bg)}.png`, mask: '/images/retro_frame_mask.png' }),
        reborn:  (bg) => ({ name: '🕹️ 리본', type: 'image', src: `/images/reborn_frame_${getColorId(bg)}.png` , mask: '/images/retro_frame_mask.png' }) 
    },
    calendar: {
        simple: (bg, border='#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '4px' }),
        retro:  (bg) => ({ name: '🕹️ 레트로', type: 'image', src: `/images/retro_calendar_${getColorId(bg)}.png` }) 
    }
};

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
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --------------------------------------------------------
// 2. 모듈화된 서브 컴포넌트들
// --------------------------------------------------------

const SmartColorPicker = ({ label, rgba, borderColor, onChange, onBorderChange, isImageTheme, useBorder, onUseBorderChange }) => {
    const { hex, alpha } = parseRgba(rgba || 'rgba(255,182,193,0.8)');
    const borderHex = parseRgba(borderColor || '#dddddd').hex;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '250px' }}>
            <label className="input-label">{label}</label>
            {isImageTheme ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {PRESET_COLORS.map(c => (
                        <div key={c.value} title={c.name} onClick={() => onChange(c.value)}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${c.colors[0]} 50%, ${c.colors[1]} 50%)`, cursor: 'pointer', border: rgba === c.value ? '3px solid #1971c2' : '2px solid #fff', outline: rgba === c.value ? '2px solid #1971c2' : '1px solid #dee2e6', transform: rgba === c.value ? 'scale(1.1)' : 'scale(1)' }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: rgba, border: '2px solid #fff', outline: '1px solid #dee2e6', position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
                            <input type="color" value={hex} onChange={(e) => onChange(toRgba(e.target.value, alpha))} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={(e) => onChange(toRgba(hex, e.target.value))} style={{ width: '45px' }} />
                    </div>
                    
                    {onBorderChange && onUseBorderChange !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #dee2e6', paddingLeft: '15px' }}>
                            <input 
                                type="checkbox" 
                                id={`border-check-${label}`}
                                checked={useBorder} 
                                onChange={(e) => onUseBorderChange(e.target.checked)} 
                                style={{ cursor: 'pointer' }} 
                            />
                            <label htmlFor={`border-check-${label}`} style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', cursor: 'pointer' }}>외곽선</label>
                            
                            {useBorder && (
                                <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: borderHex, border: '1px solid #ced4da', position: 'relative', overflow: 'hidden' }}>
                                    <input type="color" value={borderHex} onChange={(e) => onBorderChange(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
const MiniPreview = ({ type, frameKey, color, borderColor }) => {
    const fallbackKey = type === 'portrait' ? 'square' : 'simple';
    const assetResolver = UI_ASSETS[type][frameKey] || UI_ASSETS[type][fallbackKey];
    const asset = assetResolver(color, borderColor); 
    const isPortrait = type === 'portrait';
    
    return (
        <div style={{ width: '100px', height: '60px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ced4da', overflow: 'hidden' }}>
            {asset.type === 'image' ? <img src={asset.src} alt="preview" style={{ width: '90%', height: '90%', objectFit: 'contain' }} /> : <div style={{ width: isPortrait ? '40px' : '80%', height: isPortrait ? '40px' : '50%', backgroundColor: color || '#333', border: asset.border, borderRadius: asset.borderRadius }} />}
        </div>
    );
};

const CharacterForm = ({ charData, isProtagonist, onUpdate, onImageUpload, onRemoveImage, onRemoveChar, totalCount }) => {
    const typeText = isProtagonist ? '😎 주인공 (Player)' : `🎭 등장인물`;
    const themeClass = isProtagonist ? 'protagonist' : 'character';
    return (
        <div className="char-card">
            {!isProtagonist && totalCount > 1 && <button className="btn-delete-char" onClick={() => onRemoveChar(charData.id)}>삭제</button>}
            <h4 className={`char-card-title ${themeClass}`}>{typeText}</h4>
            <div className="input-row">
                <label className="input-label">이름</label>
                <input type="text" className="text-input" placeholder="이름 입력" value={charData.name} onChange={(e) => onUpdate('name', e.target.value)} />
            </div>
            <div className="input-row">
                <label className="input-label">스탠딩 사진 업로드 {isProtagonist && "(1:1 정사각형, 최대 10장)"}</label>
                <input type="file" multiple accept="image/*" onChange={onImageUpload} />
            </div>
            <div className="thumbnail-list">
                {charData.images.map((img, idx) => (
                    <div key={idx} className="thumbnail-item">
                        <img src={getImgUrl(img)} alt="thumb" className="thumbnail-img" />
                        <button className="btn-del-img" onClick={() => onRemoveImage(idx)}>×</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🎨 테마 설정 블록
const ThemeSettingsBlock = ({ title, themeClass, fontStyle, onUpdate, fontOptions, showPortrait }) => {
    
    const playSound = (soundId) => {
        const sound = SOUND_EFFECTS.find(s => s.id === soundId);
        if (sound && sound.src) {
            const audio = new Audio(sound.src);
            audio.play().catch(e => console.log('미디어 재생 정책에 의해 자동재생이 막혔거나 파일이 없습니다.', e));
        }
    };

    return (
        <div className={`theme-block ${themeClass}`}>
            <h4 style={{ margin: '0 0 15px 0' }} className={`char-card-title ${themeClass}`}>{title}</h4>
            
            <div className="theme-row">
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="input-label">폰트</label>
                    <select className="theme-select" value={fontStyle.font} onChange={(e) => onUpdate({ font: e.target.value })}>
                    {fontOptions.map((opt, index) => <option key={`${opt.value}-${index}`} value={opt.value}>{opt.name}</option>)}                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <div><label className="input-label">글자색</label><input type="color" value={parseRgba(fontStyle.color).hex} onChange={(e) => onUpdate({ color: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>
                    <div><label className="input-label">외곽선</label><input type="checkbox" checked={fontStyle.useOutline} onChange={(e) => onUpdate({ useOutline: e.target.checked })} /></div>
                    {fontStyle.useOutline && <div><label className="input-label">선 색상</label><input type="color" value={parseRgba(fontStyle.outline).hex} onChange={(e) => onUpdate({ outline: e.target.value })} style={{ width: '30px', height: '30px' }} /></div>}
                </div>
            </div>

            <div className="theme-divider" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <label className="input-label">🎵 타이핑 효과음</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="theme-select" value={fontStyle.typingSound || 'type1'} onChange={(e) => onUpdate({ typingSound: e.target.value })}>
                            {SOUND_EFFECTS.map(sound => <option key={sound.id} value={sound.id}>{sound.name}</option>)}
                        </select>
                        <button 
                            onClick={() => playSound(fontStyle.typingSound || 'type1')} 
                            style={{ padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >▶️ 듣기</button>
                    </div>
                </div>
            </div>

            <div className="theme-divider">
                <div className="theme-select-group">
                    <MiniPreview type="dialog" frameKey={fontStyle.dialogFrame} color={fontStyle.dialogColor} borderColor={fontStyle.useDialogBorder !== false ? fontStyle.dialogBorderColor : 'transparent'} />
                    <div style={{ flex: 1 }}>
                        <label className="input-label">💬 대화창 테마</label>
                        <select className="theme-select" value={fontStyle.dialogFrame || 'simple'} onChange={(e) => onUpdate({ dialogFrame: e.target.value })}>
                            {Object.keys(UI_ASSETS.dialog).map(key => <option key={key} value={key}>{UI_ASSETS.dialog[key]().name}</option>)}
                        </select>
                    </div>
                </div>
                <SmartColorPicker 
                    label="🎨 대화창 색상" 
                    rgba={fontStyle.dialogColor} 
                    borderColor={fontStyle.dialogBorderColor} 
                    isImageTheme={UI_ASSETS.dialog[fontStyle.dialogFrame || 'simple']().type === 'image'} 
                    onChange={(val) => onUpdate({ dialogColor: val })} 
                    onBorderChange={(val) => onUpdate({ dialogBorderColor: val })} 
                    useBorder={fontStyle.useDialogBorder !== false} 
                    onUseBorderChange={(val) => onUpdate({ useDialogBorder: val })}
                />
            </div>

            <div className="theme-divider">
                <div className="theme-select-group">
                    <MiniPreview type="namebox" frameKey={fontStyle.nameFrame} color={fontStyle.nameColor} borderColor={fontStyle.useNameBorder !== false ? fontStyle.nameBorderColor : 'transparent'} />
                    <div style={{ flex: 1 }}>
                        <label className="input-label">🏷️ 네임칸 테마</label>
                        <select className="theme-select" value={fontStyle.nameFrame || 'simple'} onChange={(e) => onUpdate({ nameFrame: e.target.value })}>
                            {Object.keys(UI_ASSETS.namebox).map(key => <option key={key} value={key}>{UI_ASSETS.namebox[key]().name}</option>)}
                        </select>
                    </div>
                </div>
                <SmartColorPicker 
                    label="🎨 네임칸 색상" 
                    rgba={fontStyle.nameColor} 
                    borderColor={fontStyle.nameBorderColor} 
                    isImageTheme={UI_ASSETS.namebox[fontStyle.nameFrame || 'simple']().type === 'image'} 
                    onChange={(val) => onUpdate({ nameColor: val })} 
                    onBorderChange={(val) => onUpdate({ nameBorderColor: val })} 
                    useBorder={fontStyle.useNameBorder !== false} 
                    onUseBorderChange={(val) => onUpdate({ useNameBorder: val })}
                />
            </div>

            {showPortrait && (
                <div className="theme-divider">
                    <div className="theme-select-group">
                        <MiniPreview type="portrait" frameKey={fontStyle.portraitStyle} color={fontStyle.portraitColor} borderColor={fontStyle.usePortraitBorder !== false ? fontStyle.portraitBorderColor : 'transparent'} />
                        <div style={{ flex: 1 }}>
                            <label className="input-label">🖼️ 초상화 프레임</label>
                            <select className="theme-select" value={fontStyle.portraitStyle || 'square'} onChange={(e) => onUpdate({ portraitStyle: e.target.value })}>
                                {Object.keys(UI_ASSETS.portrait).map(key => <option key={key} value={key}>{UI_ASSETS.portrait[key]().name}</option>)}
                            </select>
                        </div>
                    </div>
                    <SmartColorPicker 
                        label="🎨 초상화 배경색" 
                        rgba={fontStyle.portraitColor} 
                        borderColor={fontStyle.portraitBorderColor} 
                        isImageTheme={UI_ASSETS.portrait[fontStyle.portraitStyle || 'square']().type === 'image'} 
                        onChange={(val) => onUpdate({ portraitColor: val })} 
                        onBorderChange={(val) => onUpdate({ portraitBorderColor: val })} 
                        useBorder={fontStyle.usePortraitBorder !== false} 
                        onUseBorderChange={(val) => onUpdate({ usePortraitBorder: val })}
                    />
                </div>
            )}
        </div>
    );
};

// 📺 인게임 미리보기 화면
const InGamePreview = ({ 
    previewBg, standingImg, currentGlobalUi, textShadowStr, 
    isP, pAsset, nAsset, dAsset, cAsset, activeStyle, renderFontFamily, 
    activeChar, protagonist 
}) => {
    
    const charName = activeChar?.name || (isP ? '주인공' : '등장인물');
    const fullText = `"${charName}의 대사가 이곳에 출력됩니다. 설정한 타이핑 속도로 한 글자씩 표시됩니다!"`;
    
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    
    const audioRef = useRef(null);

    useEffect(() => {
        setDisplayedText("");
        setIsTyping(true);
        
        const soundId = activeStyle.typingSound || 'type1';
        const sound = SOUND_EFFECTS.find(s => s.id === soundId);
        
        if (sound && sound.src) {
            audioRef.current = new Audio(sound.src);
            audioRef.current.loop = true; 
        } else {
            audioRef.current = null;
        }
    }, [activeChar, isP, activeStyle.typingSound]);

    useEffect(() => {
        if (!isTyping) return;

        let currentIndex = 0;
        
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("자동재생 막힘"));
        }

        const typingInterval = setInterval(() => {
            if (currentIndex < fullText.length) {
                setDisplayedText(prev => prev + fullText[currentIndex]);
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                setIsTyping(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                
                setTimeout(() => {
                    setDisplayedText("");
                    setIsTyping(true);
                }, 3000);
            }
        }, 50);

        return () => {
            clearInterval(typingInterval);
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isTyping, fullText]);

    const finalDialogBorder = activeStyle.useDialogBorder === false ? 'none' : dAsset.border;
    const finalNameBorder = activeStyle.useNameBorder === false ? 'none' : nAsset.border;
    const finalPortraitBorder = activeStyle.usePortraitBorder === false ? 'none' : (pAsset ? pAsset.border : 'none');

    // ⭐ [수정] 폰트 외곽선(텍스트 섀도우) 생성 로직 추가
    const outlineColor = parseRgba(activeStyle.outline).hex;
    const charTextShadowStr = activeStyle.useOutline 
        ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}` 
        : 'none';

    return (
        <div className="preview-container" style={{
            backgroundColor: '#1a1b1e',
            backgroundImage: previewBg === 'default' ? 'radial-gradient(circle, #343a40 10%, transparent 10%), radial-gradient(circle, #343a40 10%, transparent 10%)' : `url(${previewBg})`,
            backgroundSize: previewBg === 'default' ? '20px 20px' : 'cover', backgroundPosition: previewBg === 'default' ? '0 0, 10px 10px' : 'center'
        }}>
            {standingImg && <img src={standingImg} alt="스탠딩" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: '92.6%', objectFit: 'contain' }} />}

            <div className="ig-calendar-group">
                <div className="ig-calendar-box" style={{ backgroundColor: cAsset.type === 'image' ? 'transparent' : currentGlobalUi.calendarColor, backgroundImage: cAsset.type === 'image' ? `url(${cAsset.src})` : 'none', border: cAsset.type === 'css' ? cAsset.border : 'none', borderRadius: cAsset.type === 'css' ? cAsset.borderRadius : '0' }}>
                    <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '5cqh', color: '#5C4033', fontWeight: 'bold', textShadow: textShadowStr, marginTop: '10px' }}>12</span>
                </div>
                <div className="ig-calendar-text">
                    <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '3cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: textShadowStr }}>DATE: OCT 12</span>
                    <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '3cqh', fontWeight: 'bold', color: currentGlobalUi.calendarTextColor, textShadow: textShadowStr }}>TIME: 14:30</span>
                </div>
            </div>

            {isP && pAsset && (
                <div className="ig-portrait-area">
                    {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 1 }} />}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundColor: pAsset.type === 'image' ? 'transparent' : activeStyle.portraitColor, WebkitMaskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', maskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', 
                        border: pAsset.type === 'css' ? finalPortraitBorder : 'none',
                    overflow: 'hidden' }}>
                        {protagonist.images.length > 0 ? <img src={getImgUrl(protagonist.images[0])} alt="주인공" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>👤</div>}
                    </div>
                </div>
            )}

            {/* ⭐ [수정] 네임칸 반응형 중앙 정렬 및 우측 앵커용 가이드 추가 */}
            <div className="ig-namebox" style={{ 
                backgroundColor: nAsset.type === 'image' ? 'transparent' : activeStyle.nameColor, 
                backgroundImage: nAsset.type === 'image' ? `url(${nAsset.src})` : 'none', 
                border: nAsset.type === 'css' ? finalNameBorder : 'none', 
                borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0',
                
                // --- 반응형 너비 및 중앙 정렬 로직 ---
                width: 'fit-content',
                minWidth: '150px', // 네임칸의 최소 너비 방어
                padding: '10px 30px', // 좌우 여백을 주어 글자수에 비례해 늘어나도록 유도
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                // 💡 [안내] 오른쪽 고정을 확실히 하려면 CSS(StepSettings.css)의 .ig-namebox 클래스에서 
                // left: auto; 로 초기화해주시고, right: 10% (원하는 우측 앵커값) 형태로 지정해야 합니다!
            }}>
                {/* ⭐ [수정] 캐릭터 이름에 외곽선(textShadow) 적용 */}
                <span style={{ fontFamily: renderFontFamily, color: activeStyle.color, fontWeight: 'bold', textShadow: charTextShadowStr }}>
                    {charName}
                </span>
            </div>

            <div className="ig-dialogbox" style={{ backgroundColor: dAsset.type === 'image' ? 'transparent' : activeStyle.dialogColor, backgroundImage: dAsset.type === 'image' ? `url(${dAsset.src})` : 'none', 
                border: dAsset.type === 'css' ? finalDialogBorder : 'none',
            borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0' }}>
                {/* ⭐ [수정] 대화 텍스트에 외곽선(textShadow) 적용 */}
                <p style={{ fontFamily: renderFontFamily, color: activeStyle.color, fontSize: '3cqh', margin: 0, whiteSpace: 'pre-wrap', textShadow: charTextShadowStr }}>
                    {displayedText}
                </p>
            </div>
        </div>
    );
};

// --------------------------------------------------------
// 3. 메인 부모 컴포넌트
// --------------------------------------------------------
export default function StepSettings() {
    const { 
        protagonist, setProtagonist, pFontStyle, setPFontStyle, characters, setCharacters, 
        customFonts, addCustomFont, globalUi, setGlobalUi 
    } = useCustomizerStore();
    
    const [previewTarget, setPreviewTarget] = useState('protagonist');
    const [previewBg, setPreviewBg] = useState('default');

    // ⭐ [추가] 초기 렌더링 시 이름이 비어있다면 기본 이름으로 덮어쓰기
    useEffect(() => {
        if (!protagonist.name) {
            setProtagonist({ ...protagonist, name: '주인공' });
        }
        
        const hasEmptyNameChar = characters.some(c => !c.name);
        if (hasEmptyNameChar) {
            setCharacters(characters.map((c, index) => 
                c.name ? c : { ...c, name: `등장인물 ${index + 1}` }
            ));
        }
    }, []); // 처음 렌더링될 때 딱 한 번만 실행

    const currentGlobalUi = globalUi || { calendarFrame: 'retro', calendarColor: 'rgba(255,182,193,0.8)', calendarTextColor: '#5C4033', calendarTextUseOutline: true, calendarTextOutlineColor: '#ffffff', systemFont: 'Pretendard', cursor: 'default', saveLoadStyle: 'modern' };
    const safeSetGlobalUi = setGlobalUi || (() => {});
    
    const fontOptions = [{ name: 'Pretendard (기본)', value: 'Pretendard' }, { name: '둥근모꼴', value: 'DungGeunMo' }, ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))];

    const addCharacter = () => {
        if (characters.length >= 10) return alert('최대 10명!');
        const nextNum = characters.length + 1;
        setCharacters([ ...characters, { 
            id: Date.now(), name: `등장인물 ${nextNum}`, images: [], 
            fontStyle: { 
                font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', 
                dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)',
                typingSound: 'type1' 
            } 
        }]);
    };
    
    const handleImageUpload = async (e, targetId) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const newImageData = [];
        for (let file of files) {
            const previewUrl = URL.createObjectURL(file);
            if (targetId === 'protagonist') {
                const isValid = await new Promise((resolve) => {
                    const img = new Image(); img.src = previewUrl;
                    img.onload = () => resolve(img.width === img.height);
                });
                if (!isValid) { alert(`🚨 '${file.name}'은 1:1 비율이 아닙니다!`); continue; }
            }
            newImageData.push({ file, preview: previewUrl });
        }
        if (targetId === 'protagonist') setProtagonist({ ...protagonist, images: [...protagonist.images, ...newImageData] });
        else setCharacters(characters.map(char => char.id === targetId ? { ...char, images: [...char.images, ...newImageData] } : char));
    };

    // StepSettings.jsx의 handleFontUpload 함수 수정
    const handleFontUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fontName = file.name.split('.')[0];

        // 🌟 추가: 이미 등록된 폰트인지 검사
        if (customFonts.some(f => f.name === fontName)) {
            alert(`'${fontName}' 폰트는 이미 등록되어 있습니다.`);
            e.target.value = ''; // input 초기화
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const fontUrl = event.target.result;
            const newFont = new FontFace(fontName, `url(${fontUrl})`);
            newFont.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                addCustomFont(fontName, fontUrl, file); 
                alert(`폰트 '${fontName}' 등록 완료!`);
            });
        };
        reader.readAsDataURL(file);
    };

    const isP = previewTarget === 'protagonist';
    const activeChar = isP ? protagonist : characters.find(c => c.id === previewTarget);
    const activeStyle = isP ? pFontStyle : (activeChar?.fontStyle || pFontStyle);
    
    let standingImg = null;
    if (!isP && activeChar?.images?.length > 0) standingImg = getImgUrl(activeChar.images[0]);
    else if (isP && characters.length > 0 && characters[0].images.length > 0) standingImg = getImgUrl(characters[0].images[0]);

    const dAsset = (UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle.dialogColor, activeStyle.dialogBorderColor);
    const nAsset = (UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle.nameColor, activeStyle.nameBorderColor);
    const pAsset = isP ? (UI_ASSETS.portrait[activeStyle.portraitStyle] || UI_ASSETS.portrait.square)(activeStyle.portraitColor, activeStyle.portraitBorderColor) : null;
    const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.retro)(currentGlobalUi.calendarColor); 

    const renderFontFamily = activeStyle.font || currentGlobalUi.systemFont || 'sans-serif';
    const textShadowStr = currentGlobalUi.calendarTextUseOutline ? `-1px -1px 0 ${currentGlobalUi.calendarTextOutlineColor}, 1px -1px 0 ${currentGlobalUi.calendarTextOutlineColor}, -1px 1px 0 ${currentGlobalUi.calendarTextOutlineColor}, 1px 1px 0 ${currentGlobalUi.calendarTextOutlineColor}` : 'none';

    return (
        <div className="settings-container">
            <h2 className="section-title">등장인물 및 스타일 설정</h2>
            <p className="section-desc">주인공과 등장인물의 이름, 일러스트, 폰트 및 UI 디자인을 설정해 주세요.</p>

            <div className="preview-section">
                <div className="preview-header">
                    <h4 style={{ margin: 0 }}>📺 인게임 미리보기</h4>
                    <select className="preview-bg-select" value={previewBg} onChange={(e) => setPreviewBg(e.target.value)}>
                        {PREVIEW_BACKGROUNDS.map(bg => <option key={bg.value} value={bg.value}>{bg.name}</option>)}
                    </select>
                </div>
                
                <div className="preview-tabs">
                    <button className={`tab-btn ${isP ? 'active-p' : 'inactive'}`} onClick={() => setPreviewTarget('protagonist')}>😎 주인공 시점</button>
                    {characters.map(char => <button key={char.id} className={`tab-btn ${!isP && previewTarget === char.id ? 'active-c' : 'inactive'}`} onClick={() => setPreviewTarget(char.id)}>🎭 {char.name || '캐릭터'} 시점</button>)}
                </div>

                <InGamePreview 
                    previewBg={previewBg} standingImg={standingImg} currentGlobalUi={currentGlobalUi} 
                    textShadowStr={textShadowStr} isP={isP} pAsset={pAsset} nAsset={nAsset} 
                    dAsset={dAsset} cAsset={cAsset} activeStyle={activeStyle} renderFontFamily={renderFontFamily} 
                    activeChar={activeChar} protagonist={protagonist} 
                />
            </div>

            <h4 className="sub-header">👤 2. 이름 및 스탠딩 일러 설정</h4>
            <div className="char-list-container">
                <CharacterForm charData={protagonist} isProtagonist={true} onUpdate={(k, v) => setProtagonist({...protagonist, [k]: v})} onImageUpload={(e) => handleImageUpload(e, 'protagonist')} onRemoveImage={(idx) => setProtagonist({...protagonist, images: protagonist.images.filter((_, i) => i !== idx)})} />
                {characters.map(char => (
                    <CharacterForm key={char.id} charData={char} isProtagonist={false} totalCount={characters.length} onUpdate={(k, v) => setCharacters(characters.map(c => c.id === char.id ? { ...c, [k]: v } : c))} onImageUpload={(e) => handleImageUpload(e, char.id)} onRemoveImage={(idx) => setCharacters(characters.map(c => c.id === char.id ? { ...c, images: c.images.filter((_, i) => i !== idx) } : c))} onRemoveChar={(id) => setCharacters(characters.filter(c => c.id !== id))} />
                ))}
                <button onClick={addCharacter} style={{ padding: '15px', backgroundColor: '#f1f3f5', border: '2px dashed #adb5bd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#495057' }}>➕ 등장인물 추가하기 ({characters.length} / 10)</button>
            </div>

            <h4 className="sub-header">🎮 3. 게임 전역 UI 셋팅</h4>
            <div style={{ backgroundColor: '#fdf3f5', border: '1px solid #fcc2d7', padding: '20px', borderRadius: '8px', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🔤 시스템 기본 폰트</label>
                        <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} value={currentGlobalUi.systemFont} onChange={(e) => safeSetGlobalUi({ systemFont: e.target.value })}>
                        {fontOptions.map((opt, index) => <option key={`${opt.value}-${index}`} value={opt.value}>{opt.name}</option>)}                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <MiniPreview type="calendar" frameKey={currentGlobalUi.calendarFrame} color={currentGlobalUi.calendarColor} />
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📅 달력 틀 테마</label>
                                <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }} value={currentGlobalUi.calendarFrame} onChange={(e) => safeSetGlobalUi({ calendarFrame: e.target.value })}>
                                    {Object.keys(UI_ASSETS.calendar).map((key) => <option key={key} value={key}>{UI_ASSETS.calendar[key]().name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px dashed #fcc2d7', paddingTop: '20px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <SmartColorPicker label="🎨 달력 틀 색상" rgba={currentGlobalUi.calendarColor} isImageTheme={UI_ASSETS.calendar[currentGlobalUi.calendarFrame || 'simple']().type === 'image'} onChange={(val) => safeSetGlobalUi({ calendarColor: val })} />
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
            </div>

            <h4 className="sub-header">🎨 4. 대화창 및 폰트 테마 설정</h4>
            <div className="input-row" style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <label className="input-label">➕ 커스텀 폰트 파일 추가 (.ttf, .otf)</label>
                <input type="file" accept=".ttf, .otf, .woff, .woff2" onChange={handleFontUpload} style={{ display: 'block', marginTop: '5px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ThemeSettingsBlock title={`😎 ${protagonist.name || '주인공'} 전용 스타일`} themeClass="protagonist" fontStyle={pFontStyle} fontOptions={fontOptions} onUpdate={(updates) => setPFontStyle({...pFontStyle, ...updates})} showPortrait={true} />
                {characters.map((char, index) => (
                    <ThemeSettingsBlock key={char.id} title={`🎭 ${char.name || `등장인물 ${index + 1}`} 전용 스타일`} themeClass="character" fontStyle={char.fontStyle} fontOptions={fontOptions} onUpdate={(updates) => setCharacters(characters.map(c => c.id === char.id ? { ...c, fontStyle: { ...c.fontStyle, ...updates } } : c))} showPortrait={false} />
                ))}
            </div>
            
            <div style={{ height: '100px' }} /> 
        </div>
    );
}