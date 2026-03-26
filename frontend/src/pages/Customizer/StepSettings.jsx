// ==============================================================================
// 📄 파일 경로 : src/pages/Customizer/StepSettings.jsx
// 🎯 주요 역할 : 게임 커스터마이징 Step 2 (캐릭터 설정 및 UI 테마 커스텀)
// ==============================================================================

import { useState, useEffect } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepSettings.css';
import { SHARED_FONT } from '../../assets/assets';

// ==============================================================================
// 1. 상수 및 데이터 유틸리티 모음
// ==============================================================================

const PRESET_COLORS = [
  { id: 'pink', name: '핑크', value: 'rgba(255,182,193,0.8)', colors: ['#ffb6c1', '#faafbe'] },
  { id: 'black', name: '와인', value: 'rgba(0,0,0,0.8)', colors: ['#444444', '#000000'] },
  { id: 'white', name: '화이트', value: 'rgba(255,255,255,0.8)', colors: ['#ffffff', '#e0e0e0'] },
  { id: 'blue', name: '블루', value: 'rgba(173,216,230,0.8)', colors: ['#add8e6', '#87ceeb'] },
  { id: 'purple', name: '퍼플', value: 'rgba(205,180,219,0.8)', colors: ['#d8bfd8', '#b19cd9'] },
];

const getColorId = (rgbaValue) => PRESET_COLORS.find((c) => c.value === rgbaValue)?.id || 'pink';

const getImgUrl = (imgData) => {
  if (!imgData) return null;
  if (typeof imgData === 'string') return imgData;
  if (typeof imgData === 'object' && imgData.preview) return imgData.preview;
  return null;
};

const PREVIEW_BACKGROUNDS = [
  { name: '기본 (투명/격자)', value: 'default' },
  { name: '검은 배경', value: '/images/bg_black.png'},
  { name: '흰색 배경', value: '/images/bg_white.png' }
];

const SOUND_EFFECTS = [
  { id: 'type1', name: '일반 타자기 (Type 1)', src: '/sounds/SFX_RetroSinglev1.wav' },
  { id: 'type2', name: '경쾌한 키보드 (Type 2)', src: '/sounds/SFX_RetroSinglev2.wav' },
  { id: 'type3', name: '전자음 띡띡 (Type 3)', src: '/sounds/SFX_RetroSinglev3.wav' },
  { id: 'type4', name: '묵직한 기계음 (Type 4)', src: '/sounds/SFX_RetroSinglev4.wav' },
  { id: 'none', name: '음소거', src: null },
];

const UI_ASSETS = {
  dialog: {
    simple: (bg, border = '#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '0px' }),
    gothic: (bg, border = '#a9a9a9') => ({ name: '고딕풍', type: 'css', border: `4px double ${border}`, borderRadius: '0px' }),
    retro: (bg) => ({ name: '도트', type: 'image', src: `/images/retro_dialog_${getColorId(bg)}.png` }),
  },
  namebox: {
    simple: (bg, border = '#dddddd') => ({ name: '심플형', type: 'css', border: `2px solid ${border}`, borderRadius: '0px' }),
    gothic: (bg, border = '#a9a9a9') => ({ name: '고딕풍', type: 'css', border: `3px double ${border}`, borderRadius: '0px' }),
  },
  portrait: {
    square: (bg, border = '#dddddd') => ({ name: '기본 사각형', type: 'css', border: `3px solid ${border}`, borderRadius: '0%' }),
    retro: (bg) => ({ name: '도트', type: 'image', src: `/images/retro_frame_${getColorId(bg)}.png`, mask: '/images/retro_frame_mask.png' })
  },
  calendar: {
    none: () => ({ name: '🚫 표시 안 함', type: 'none' }),
  },
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
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ==============================================================================
// 2. 모듈화된 서브 컴포넌트들
// ==============================================================================

const SmartColorPicker = ({ label, rgba, borderColor, onChange, onBorderChange, isImageTheme, useBorder, onUseBorderChange }) => {
  const { hex, alpha } = parseRgba(rgba || 'rgba(255,182,193,0.8)');
  const borderHex = parseRgba(borderColor || '#dddddd').hex;

  return (
    <div className="color-picker-wrap">
      <label className="input-label">{label}</label>
      {isImageTheme ? (
        <div className="color-preset-list">
          {PRESET_COLORS.map((c) => (
            <div
              key={c.value} title={c.name} onClick={() => onChange(c.value)}
              className="color-preset-circle"
              style={{
                background: `linear-gradient(135deg, ${c.colors[0]} 50%, ${c.colors[1]} 50%)`,
                border: rgba === c.value ? '3px solid #1971c2' : '2px solid #fff',
                outline: rgba === c.value ? '2px solid #1971c2' : '1px solid #dee2e6',
                transform: rgba === c.value ? 'scale(1.1)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="color-slider-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: rgba, border: '2px solid #fff', outline: '1px solid #dee2e6', position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
              <input type="color" value={hex} onChange={(e) => onChange(toRgba(e.target.value, alpha))} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>불투명도</span>
              <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={(e) => onChange(toRgba(hex, e.target.value))} style={{ width: '80px', cursor: 'pointer' }} />
            </div>
          </div>
          {onBorderChange && onUseBorderChange !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #dee2e6', paddingLeft: '15px' }}>
              <input type="checkbox" id={`border-check-${label}`} checked={useBorder} onChange={(e) => onUseBorderChange(e.target.checked)} style={{ cursor: 'pointer' }} />
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
    <div className="mini-preview-box">
      {asset.type === 'none' ? (
        <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>표시 안 함</span>
      ) : asset.type === 'image' ? (
        <img src={asset.src} alt="preview" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
      ) : (
        <div style={{ width: isPortrait ? '40px' : '80%', height: isPortrait ? '40px' : '50%', backgroundColor: color || '#333', border: asset.border, borderRadius: asset.borderRadius }} />
      )}
    </div>
  );
};

const CharacterForm = ({ charData, onUpdate, onImageUpload, onRemoveImage, onRemoveChar, totalCount, onImageClick }) => {
  // ⭐ 통합된 characters 배열 안에서 isProtagonist 여부에 따라 알아서 렌더링!
  const isProtagonist = charData.isProtagonist;
  const typeText = isProtagonist ? '😎 주인공 (Player)' : `🎭 등장인물`;
  const themeClass = isProtagonist ? 'protagonist' : 'character';

  const portraits = charData?.portraitImages || [];
  const standings = charData?.standingImages || [];

  return (
    <div className="char-card">
      {!isProtagonist && totalCount > 1 && (
        <button className="btn-delete-char" onClick={() => onRemoveChar(charData.id)}>삭제</button>
      )}
      <h4 className={`char-card-title ${themeClass}`}>{typeText}</h4>
      
      <div className="input-row">
        <label className="input-label">이름</label>
        <input type="text" className="text-input" placeholder="이름 입력" value={charData?.name || ''} onChange={(e) => onUpdate('name', e.target.value)} />
      </div>
      
      <div className="input-row" style={{ marginTop: '15px' }}>
        <label className="input-label">🖼️ 초상화 사진 업로드 (1:1 정사각형)</label>
        <input type="file" multiple accept="image/*" onChange={(e) => onImageUpload(e, charData.id, 'portrait')} />
      </div>
      <div className="thumbnail-list">
        {portraits.map((img, idx) => {
          const imgSrc = getImgUrl(img);
          if (!imgSrc) return null;
          return (
            <div key={`p-${idx}`} className="thumbnail-item" onClick={() => onImageClick(charData.id, idx, 'portrait')} style={{ cursor: 'pointer' }} title="클릭 시 미리보기에 적용됩니다">
              <img src={imgSrc} alt="thumb" className="thumbnail-img" />
              <button className="btn-del-img" onClick={(e) => { e.stopPropagation(); onRemoveImage(idx, 'portrait'); }}>×</button>
            </div>
          );
        })}
      </div>

      <div className="input-row" style={{ marginTop: '15px' }}>
        <label className="input-label">🧍 스탠딩 사진 업로드 (전신/반신)</label>
        <input type="file" multiple accept="image/*" onChange={(e) => onImageUpload(e, charData.id, 'standing')} />
      </div>
      <div className="thumbnail-list">
        {standings.map((img, idx) => {
          const imgSrc = getImgUrl(img);
          if (!imgSrc) return null;
          return (
            <div key={`s-${idx}`} className="thumbnail-item" onClick={() => onImageClick(charData.id, idx, 'standing')} style={{ cursor: 'pointer' }} title="클릭 시 미리보기에 적용됩니다">
              <img src={imgSrc} alt="thumb" className="thumbnail-img" />
              <button className="btn-del-img" onClick={(e) => { e.stopPropagation(); onRemoveImage(idx, 'standing'); }}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

let globalPreviewInterval = null;
let globalActiveAudio = null;

const ThemeSettingsBlock = ({ title, themeClass, fontStyle, onUpdate, fontOptions, showPortrait, showNamebox = true }) => {
  const stopSound = () => {
    if (globalPreviewInterval) { clearInterval(globalPreviewInterval); globalPreviewInterval = null; }
    if (globalActiveAudio) { globalActiveAudio.pause(); globalActiveAudio.currentTime = 0; globalActiveAudio = null; }
  };

  useEffect(() => { return () => stopSound(); }, []);

  const playSound = (soundId) => {
    stopSound();
    const sound = SOUND_EFFECTS.find((s) => s.id === soundId);
    
    if (sound && sound.src) {
      globalActiveAudio = new Audio(sound.src);
      let elapsed = 0;
      globalActiveAudio.currentTime = 0;
      globalActiveAudio.play().catch((e) => console.log('자동재생 막힘', e));

      globalPreviewInterval = setInterval(() => {
        elapsed += 100;
        if (elapsed >= 1000) { stopSound(); return; }
        if (globalActiveAudio) {
          globalActiveAudio.currentTime = 0;
          globalActiveAudio.play().catch((e) => console.log('자동재생 막힘', e));
        }
      }, 100);
    }
  };

  return (
    <div className={`theme-block ${themeClass}`}>
      <h4 className={`char-card-title ${themeClass}`} style={{ marginBottom: '15px' }}>{title}</h4>
      <div className="theme-row">
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label className="input-label">폰트</label>
          <select className="theme-select" value={fontStyle.font} onChange={(e) => onUpdate({ font: e.target.value })}>
            {fontOptions.map((opt, index) => (
              <option key={`${opt.value}-${index}`} value={opt.value}>{opt.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div>
            <label className="input-label">글자색</label>
            <input type="color" value={parseRgba(fontStyle.color).hex} onChange={(e) => onUpdate({ color: e.target.value })} style={{ width: '30px', height: '30px' }} />
          </div>
          <div>
            <label className="input-label">외곽선</label>
            <input type="checkbox" checked={fontStyle.useOutline} onChange={(e) => onUpdate({ useOutline: e.target.checked })} />
          </div>
          {fontStyle.useOutline && (
            <div>
              <label className="input-label">선 색상</label>
              <input type="color" value={parseRgba(fontStyle.outline).hex} onChange={(e) => onUpdate({ outline: e.target.value })} style={{ width: '30px', height: '30px' }} />
            </div>
          )}
        </div>
      </div>
      <div className="theme-divider">
        <div style={{ flex: 1 }}>
          <label className="input-label">🎵 타이핑 효과음</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select className="theme-select" value={fontStyle.typingSound || 'type1'} onChange={(e) => onUpdate({ typingSound: e.target.value })} style={{ height: '32px', padding: '4px 8px', margin: 0, boxSizing: 'border-box' }}>
              {SOUND_EFFECTS.map((sound) => ( <option key={sound.id} value={sound.id}>{sound.name}</option> ))}
            </select>
            <button onClick={() => playSound(fontStyle.typingSound || 'type1')} className="btn-sound-play">▶️ 듣기</button>
            <button onClick={stopSound} className="btn-sound-stop">⏹️ 정지</button>
          </div>
        </div>
      </div>
      <div className="theme-divider">
        <div className="theme-select-group">
          <MiniPreview type="dialog" frameKey={fontStyle.dialogFrame} color={fontStyle.dialogColor} borderColor={fontStyle.useDialogBorder !== false ? fontStyle.dialogBorderColor : 'transparent'} />
          <div style={{ flex: 1 }}>
            <label className="input-label">💬 대화창 테마</label>
            <select className="theme-select" value={fontStyle.dialogFrame || 'simple'} onChange={(e) => onUpdate({ dialogFrame: e.target.value })}>
              {Object.keys(UI_ASSETS.dialog).map((key) => <option key={key} value={key}>{UI_ASSETS.dialog[key]().name}</option>)}
            </select>
          </div>
        </div>
        <SmartColorPicker label="🎨 대화창 색상" rgba={fontStyle.dialogColor} borderColor={fontStyle.dialogBorderColor} isImageTheme={UI_ASSETS.dialog[fontStyle.dialogFrame || 'simple']().type === 'image'} onChange={(val) => onUpdate({ dialogColor: val })} onBorderChange={(val) => onUpdate({ dialogBorderColor: val })} useBorder={fontStyle.useDialogBorder !== false} onUseBorderChange={(val) => onUpdate({ useDialogBorder: val })} />
      </div>
      {showNamebox && (
        <div className="theme-divider">
          <div className="theme-select-group">
            <MiniPreview type="namebox" frameKey={fontStyle.nameFrame} color={fontStyle.nameColor} borderColor={fontStyle.useNameBorder !== false ? fontStyle.nameBorderColor : 'transparent'} />
            <div style={{ flex: 1 }}>
              <label className="input-label">🏷️ 네임칸 테마</label>
              <select className="theme-select" value={fontStyle.nameFrame || 'simple'} onChange={(e) => onUpdate({ nameFrame: e.target.value })}>
                {Object.keys(UI_ASSETS.namebox).map((key) => <option key={key} value={key}>{UI_ASSETS.namebox[key]().name}</option>)}
              </select>
            </div>
          </div>
          <SmartColorPicker label="🎨 네임칸 색상" rgba={fontStyle.nameColor} borderColor={fontStyle.nameBorderColor} isImageTheme={UI_ASSETS.namebox[fontStyle.nameFrame || 'simple']().type === 'image'} onChange={(val) => onUpdate({ nameColor: val })} onBorderChange={(val) => onUpdate({ nameBorderColor: val })} useBorder={fontStyle.useNameBorder !== false} onUseBorderChange={(val) => onUpdate({ useNameBorder: val })} />
        </div>
      )}
      {showPortrait && (
        <div className="theme-divider">
          <div className="theme-select-group">
            <MiniPreview type="portrait" frameKey={fontStyle.portraitStyle} color={fontStyle.portraitColor} borderColor={fontStyle.usePortraitBorder !== false ? fontStyle.portraitBorderColor : 'transparent'} />
            <div style={{ flex: 1 }}>
              <label className="input-label">🖼️ 초상화 프레임</label>
              <select className="theme-select" value={fontStyle.portraitStyle || 'square'} onChange={(e) => onUpdate({ portraitStyle: e.target.value })}>
                {Object.keys(UI_ASSETS.portrait).map((key) => <option key={key} value={key}>{UI_ASSETS.portrait[key]().name}</option>)}
              </select>
            </div>
          </div>
          <SmartColorPicker label="🎨 초상화 배경색" rgba={fontStyle.portraitColor} borderColor={fontStyle.portraitBorderColor} isImageTheme={UI_ASSETS.portrait[fontStyle.portraitStyle || 'square']().type === 'image'} onChange={(val) => onUpdate({ portraitColor: val })} onBorderChange={(val) => onUpdate({ portraitBorderColor: val })} useBorder={fontStyle.usePortraitBorder !== false} onUseBorderChange={(val) => onUpdate({ usePortraitBorder: val })} />
        </div>
      )}
    </div>
  );
};

const InGamePreview = ({ previewBg, standingImg, portraitImg, currentGlobalUi, textShadowStr, isNarration, pAsset, nAsset, dAsset, cAsset, activeStyle, renderFontFamily, activeChar }) => {
  const charName = isNarration ? '' : (activeChar?.name || '알 수 없음');
  const fullText = isNarration 
    ? `나레이션의 대사가 이곳에 출력됩니다. 배경 설명이나 상황을 묘사할 때 네임칸 없이 화면에 깔끔하게 대사만 출력되는 것을 확인할 수 있습니다.` 
    : `현재 선택된 '${charName}' 캐릭터의 대사가 이곳에 출력됩니다. 초상화 프레임과 스탠딩 일러스트가 동시에 적용된 모습을 확인해 보세요.`;
  
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText(""); 
    setIsTyping(true);
    let currentIndex = 0;
    let waitCount = 0; 
    const timer = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false); 
        waitCount++;
        if (waitCount > 30) {
          currentIndex = 0; waitCount = 0; setDisplayedText(""); setIsTyping(true);
        }
      }
    }, 50);
    return () => clearInterval(timer);
  }, [fullText]);

  const finalDialogBorder = activeStyle.useDialogBorder === false ? 'none' : dAsset.border;
  const finalNameBorder = activeStyle.useNameBorder === false || !nAsset ? 'none' : nAsset.border;
  const finalPortraitBorder = activeStyle.usePortraitBorder === false ? 'none' : (pAsset ? pAsset.border : 'none');
  
  const outlineColor = parseRgba(activeStyle.outline).hex;
  const charTextShadowStr = activeStyle.useOutline ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}` : 'none';

  const containerStyle = {
    backgroundImage: previewBg === 'default' ? 'radial-gradient(circle, #343a40 10%, transparent 10%), radial-gradient(circle, #343a40 10%, transparent 10%)' : `url(${previewBg})`,
    backgroundSize: previewBg === 'default' ? '20px 20px' : 'cover', backgroundPosition: previewBg === 'default' ? '0 0, 10px 10px' : 'center',
  };

  const calendarBoxStyle = { backgroundColor: cAsset.type === 'image' ? 'transparent' : currentGlobalUi.calendarColor, backgroundImage: cAsset.type === 'image' ? `url(${cAsset.src})` : 'none', border: cAsset.type === 'css' ? cAsset.border : 'none', borderRadius: cAsset.type === 'css' ? cAsset.borderRadius : '0' };
  const nameBoxStyle = nAsset ? { backgroundColor: nAsset.type === 'image' ? 'transparent' : activeStyle.nameColor, backgroundImage: nAsset.type === 'image' ? `url(${nAsset.src})` : 'none', border: nAsset.type === 'css' ? finalNameBorder : 'none', borderRadius: nAsset.type === 'css' ? nAsset.borderRadius : '0' } : {};
  const dialogBoxStyle = { backgroundColor: dAsset.type === 'image' ? 'transparent' : activeStyle.dialogColor, backgroundImage: dAsset.type === 'image' ? `url(${dAsset.src})` : 'none', border: dAsset.type === 'css' ? finalDialogBorder : 'none', borderRadius: dAsset.type === 'css' ? dAsset.borderRadius : '0' };

  return (
    <div className={`preview-container ${currentGlobalUi.layoutMode === 'bottom' ? 'layout-bottom' : 'layout-classic'}`} style={containerStyle}>
      {!isNarration && standingImg && <img src={standingImg} alt="standing" className="ig-standing" />}

      <div className="ig-calendar-group">
        {currentGlobalUi.calendarFrame !== 'none' && (
          <div className="ig-calendar-box" style={calendarBoxStyle}>
            <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '5cqh', color: '#5C4033', fontWeight: 'bold', textShadow: textShadowStr, marginTop: '10px' }}>12日</span>
          </div>
        )}
        <div className="ig-calendar-text">
          <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '2.5cqh', color: currentGlobalUi.calendarTextColor, textShadow: textShadowStr }}>2020.03.06 | 02:30 AM</span>
          <span style={{ fontFamily: currentGlobalUi.systemFont, fontSize: '2.5cqh', color: currentGlobalUi.calendarTextColor, textShadow: textShadowStr }}>EPISODE 1 | 평범한 하루</span>
        </div>
      </div>

      {!isNarration && pAsset && (
        <div className="ig-portrait-area">
          {pAsset.type === 'image' && <img src={pAsset.src} alt="Frame" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 1 }} />}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundColor: pAsset.type === 'image' ? 'transparent' : activeStyle.portraitColor, WebkitMaskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', maskImage: pAsset.type === 'image' ? `url(${pAsset.mask})` : 'none', WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', borderRadius: pAsset.type === 'css' ? pAsset.borderRadius : '0%', border: pAsset.type === 'css' ? finalPortraitBorder : 'none', overflow: 'hidden' }}>
            {portraitImg ? <img src={portraitImg} alt="초상화" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>👤</div>}
          </div>
        </div>
      )}

      {!isNarration && (
        <div className="ig-namebox" style={nameBoxStyle}>
          <span style={{ fontFamily: renderFontFamily, color: activeStyle.color, textShadow: charTextShadowStr }}>{charName}</span>
        </div>
      )}

      <div className="ig-dialogbox" style={dialogBoxStyle}>
        <p style={{ fontFamily: renderFontFamily, color: activeStyle.color, fontSize: '3cqh', margin: 0, whiteSpace: 'pre-wrap', textShadow: charTextShadowStr }}>{displayedText}</p>
      </div>

      <div className="ig-system-menu" style={{ position: 'absolute', bottom: '95cqh', left: '70%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', zIndex: 100 }}>
        {['되감기', '대사록', '자동진행', '저장하기', '불러오기', '설정'].map((menu) => (
          <span key={menu} style={{ fontFamily: currentGlobalUi.systemFont || 'sans-serif', fontSize: '1.7cqh', color: '#ffffff', cursor: 'pointer', textShadow: '1px 1px 3px rgba(0,0,0,1)' }}>{menu}</span>
        ))}
      </div>
    </div>
  );
};

// ==============================================================================
// 3. 메인 부모 컴포넌트
// ==============================================================================

export default function StepSettings() {
  const { 
    characters, setCharacters, 
    customFonts, addCustomFont, 
    globalUi, setGlobalUi,
    narrationFontStyle, setNarrationFontStyle 
  } = useCustomizerStore();

  const [previewTarget, setPreviewTarget] = useState('protagonist'); // 기본 탭: 주인공
  const [previewBg, setPreviewBg] = useState('default');
  
  const [selectedPortraitIndices, setSelectedPortraitIndices] = useState({});
  const [selectedStandingIndices, setSelectedStandingIndices] = useState({});

  const currentGlobalUi = globalUi || { calendarFrame: 'none', layoutMode: 'bottom' };
  const safeSetGlobalUi = setGlobalUi || (() => {});
  
  const currentNarrationStyle = narrationFontStyle || { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(0,0,0,0.8)', typingSound: 'type1' };
  const safeSetNarrationStyle = setNarrationFontStyle || (() => {});

  const uniqueCustomFonts = Array.from(new Map(customFonts.map((f) => [f.name, f])).values());
  const fontOptions = [...SHARED_FONT, ...uniqueCustomFonts.map((f) => ({ name: `📁 ${f.name}`, value: f.name }))];

  const addCharacter = () => {
    if (characters.length >= 10) return alert('최대 10명까지만 추가할 수 있습니다!');
    setCharacters([ ...characters, { 
      id: Date.now(), 
      isProtagonist: false,
      name: `등장인물 ${characters.length}`, 
      portraitImages: [], 
      standingImages: [], 
      fontStyle: { font: 'Pretendard', color: '#ffffff', useOutline: false, outline: '#000000', dialogFrame: 'simple', dialogColor: 'rgba(255,182,193,0.8)', nameFrame: 'simple', nameColor: 'rgba(255,182,193,0.8)', typingSound: 'type1' } 
    }]);
  };

  const handleImageClick = (targetId, imgIndex, imageType) => {
    setPreviewTarget(targetId);
    if (imageType === 'portrait') setSelectedPortraitIndices((prev) => ({ ...prev, [targetId]: imgIndex }));
    else setSelectedStandingIndices((prev) => ({ ...prev, [targetId]: imgIndex }));
  };

  // ⭐ 중복 코드가 사라진 깔끔한 이미지 업로드 로직!
  const handleImageUpload = async (e, targetId, imageType) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImageData = [];
    for (let file of files) {
      const previewUrl = URL.createObjectURL(file);
      if (imageType === 'portrait') {
        const isValid = await new Promise((resolve) => {
          const img = new Image(); img.src = previewUrl; img.onload = () => resolve(img.width === img.height);
        });
        if (!isValid) { alert(`🚨 '${file.name}' 초상화 이미지는 1:1 비율이 아닙니다!`); continue; }
      }
      newImageData.push({ file, preview: previewUrl });
    }

    setCharacters(characters.map((char) => {
      if (char.id === targetId) {
        const key = imageType === 'portrait' ? 'portraitImages' : 'standingImages';
        const currentArr = char[key] || [];
        return { ...char, [key]: [...currentArr, ...newImageData] };
      }
      return char;
    })); 
  };

  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fontName = file.name.split('.')[0];
    if (customFonts.some((f) => f.name === fontName)) { alert(`'${fontName}' 폰트는 이미 등록되어 있습니다.`); e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      const fontUrl = event.target.result;
      const newFont = new FontFace(fontName, `url(${fontUrl})`);
      newFont.load().then((loadedFont) => {
        document.fonts.add(loadedFont); addCustomFont(fontName, fontUrl, file); alert(`폰트 '${fontName}' 등록 완료!`);
      });
    };
    reader.readAsDataURL(file);
  };

  const isNarration = previewTarget === 'narration';
  const activeChar = isNarration ? null : characters.find((c) => c.id === previewTarget);
  const protagonist = characters.find(c => c.isProtagonist) || characters[0]; // 안전장치
  
  const activeStyle = isNarration ? currentNarrationStyle : (activeChar?.fontStyle || protagonist.fontStyle);

  const activePortraitIndex = selectedPortraitIndices[previewTarget] || 0;
  const activeStandingIndex = selectedStandingIndices[previewTarget] || 0;
  
  const targetPortraits = activeChar?.portraitImages || [];
  const targetStandings = activeChar?.standingImages || [];

  const portraitImg = targetPortraits.length > activePortraitIndex ? getImgUrl(targetPortraits[activePortraitIndex]) : (targetPortraits.length > 0 ? getImgUrl(targetPortraits[0]) : null);
  const standingImg = targetStandings.length > activeStandingIndex ? getImgUrl(targetStandings[activeStandingIndex]) : (targetStandings.length > 0 ? getImgUrl(targetStandings[0]) : null);

  const dAsset = (UI_ASSETS.dialog[activeStyle.dialogFrame] || UI_ASSETS.dialog.simple)(activeStyle.dialogColor, activeStyle.dialogBorderColor);
  const nAsset = !isNarration ? (UI_ASSETS.namebox[activeStyle.nameFrame] || UI_ASSETS.namebox.simple)(activeStyle.nameColor, activeStyle.nameBorderColor) : null;
  const pAsset = !isNarration ? (UI_ASSETS.portrait[activeStyle.portraitStyle] || UI_ASSETS.portrait.square)(activeStyle.portraitColor, activeStyle.portraitBorderColor) : null;
  const cAsset = (UI_ASSETS.calendar[currentGlobalUi.calendarFrame] || UI_ASSETS.calendar.none)(currentGlobalUi.calendarColor);
  const renderFontFamily = activeStyle.font || currentGlobalUi.systemFont || 'sans-serif';
  const textShadowStr = currentGlobalUi.calendarTextUseOutline ? `-1px -1px 0 ${currentGlobalUi.calendarTextOutlineColor}, 1px -1px 0 ${currentGlobalUi.calendarTextOutlineColor}, -1px 1px 0 ${currentGlobalUi.calendarTextOutlineColor}, 1px 1px 0 ${currentGlobalUi.calendarTextOutlineColor}` : 'none';
  
  return (
    <div className="settings-container">
      <h2 className="section-title">등장인물 및 스타일 설정</h2>
      <p className="section-desc">주인공과 등장인물의 이름, 일러스트, 폰트 및 UI 디자인을 설정해 주세요.</p>

      {/* 📺 1. 인게임 미리보기 섹션 */}
      <div className="preview-section">
        <div className="preview-header">
          <h4>📺 인게임 미리보기</h4>
          <select className="preview-bg-select" value={previewBg} onChange={(e) => setPreviewBg(e.target.value)}>
            {PREVIEW_BACKGROUNDS.map((bg) => ( <option key={bg.value} value={bg.value}>{bg.name}</option> ))}
          </select>
        </div>

        <div className="preview-tabs">
          <button className={`tab-btn ${isNarration ? 'active-c' : 'inactive'}`} onClick={() => setPreviewTarget('narration')}>📢 나레이션 시점</button>
          {characters.map((char) => (
            <button 
              key={char.id} 
              className={`tab-btn ${!isNarration && previewTarget === char.id ? (char.isProtagonist ? 'active-p' : 'active-c') : 'inactive'}`} 
              onClick={() => setPreviewTarget(char.id)}
            >
              {char.isProtagonist ? '😎' : '🎭'} {char.name || '캐릭터'} 시점
            </button>
          ))}
        </div>

        <InGamePreview
          previewBg={previewBg} standingImg={standingImg} portraitImg={portraitImg} currentGlobalUi={currentGlobalUi}
          textShadowStr={textShadowStr} isNarration={isNarration} pAsset={pAsset} nAsset={nAsset} dAsset={dAsset} cAsset={cAsset}
          activeStyle={activeStyle} renderFontFamily={renderFontFamily} activeChar={activeChar}
        />
      </div>

      {/* 👤 2. 등장인물 및 사진 설정 섹션 */}
      <h4 className="sub-header">👤 2. 이름 및 스탠딩 일러 설정</h4>
      <div className="char-list-container">
        {/* ⭐ 이제 characters 배열 하나만 `.map()` 돌리면 주인공과 등장인물이 모두 그려집니다! */}
        {characters.map((char) => (
          <CharacterForm 
            key={char.id} 
            charData={char} 
            totalCount={characters.length} 
            onUpdate={(k, v) => setCharacters(characters.map((c) => c.id === char.id ? { ...c, [k]: v } : c))} 
            onImageUpload={handleImageUpload} 
            onRemoveImage={(idx, type) => {
              const key = type === 'portrait' ? 'portraitImages' : 'standingImages';
              setCharacters(characters.map((c) => {
                if(c.id === char.id) {
                  const arr = c[key] || [];
                  return { ...c, [key]: arr.filter((_, i) => i !== idx) };
                }
                return c;
              }));
            }} 
            onRemoveChar={(id) => setCharacters(characters.filter((c) => c.id !== id))} 
            onImageClick={handleImageClick} 
          />
        ))}
        <button className="btn-add-char" onClick={addCharacter}>➕ 등장인물 추가하기 ({characters.length} / 10)</button>
      </div>

      {/* 🎮 3. 게임 전역 UI 셋팅 섹션 */}
      <h4 className="sub-header">🎮 3. 게임 전역 UI 셋팅</h4>
      <div className="global-ui-panel">
        
        <div className="layout-toggle-container">
          <label className="input-label">📐 화면 레이아웃 배치</label>
          <div className="layout-card-group">
            <div className={`layout-card ${currentGlobalUi.layoutMode !== 'bottom' ? 'active' : ''}`} onClick={() => safeSetGlobalUi({ layoutMode: 'classic' })}>
              <h5>기본 띄움형 (클래식)</h5>
              <p>반신 스탠딩 일러스트에 적합합니다!<br/>캐릭터 이미지가 화면의 맨 아래부터 올라갑니다.</p>
            </div>
            <div className={`layout-card ${currentGlobalUi.layoutMode === 'bottom' ? 'active' : ''}`} onClick={() => safeSetGlobalUi({ layoutMode: 'bottom' })}>
              <h5>바닥 밀착형</h5>
              <p>두상/상반신 일러스트에 적합합니다!<br/>캐릭터 이미지가 대화박스의 맨 위부터 올라갑니다.</p>
            </div>
          </div>
        </div>

        <div className="global-ui-row">
          <div className="global-ui-col">
            <label className="input-label">🔤 시스템 기본 폰트</label>
            <select className="theme-select" value={currentGlobalUi.systemFont} onChange={(e) => safeSetGlobalUi({ systemFont: e.target.value })}>
              {fontOptions.map((opt, index) => ( <option key={`${opt.value}-${index}`} value={opt.value}>{opt.name}</option> ))}
            </select>
          </div>
          <div className="global-ui-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <MiniPreview type="calendar" frameKey={currentGlobalUi.calendarFrame} color={currentGlobalUi.calendarColor} />
              <div style={{ flex: 1 }}>
                <label className="input-label">📅 달력 틀 테마 (현재 준비 중)</label>
                <select className="theme-select" value={currentGlobalUi.calendarFrame} onChange={(e) => safeSetGlobalUi({ calendarFrame: e.target.value })}>
                  {Object.keys(UI_ASSETS.calendar).map((key) => ( <option key={key} value={key}>{UI_ASSETS.calendar[key]().name}</option> ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="global-ui-divider">
          <div className="global-ui-col">
            {currentGlobalUi.calendarFrame !== 'none' && (
              <SmartColorPicker 
                label="🎨 달력 틀 색상" 
                rgba={currentGlobalUi.calendarColor} 
                isImageTheme={UI_ASSETS.calendar[currentGlobalUi.calendarFrame || 'none']().type === 'image'} 
                onChange={(val) => safeSetGlobalUi({ calendarColor: val })} 
              />
            )}
          </div>
          <div className="global-ui-col">
            <label className="input-label">📝 날짜/시간 글자 스타일</label>
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

      {/* 🎨 4. 대화창 및 폰트 테마 설정 섹션 */}
      <h4 className="sub-header">🎨 4. 대화창 및 폰트 테마 설정</h4>
      <div className="font-upload-panel">
        <label className="input-label">➕ 커스텀 폰트 파일 추가 (.ttf, .otf)</label>
        <input type="file" accept=".ttf, .otf, .woff, .woff2" onChange={handleFontUpload} style={{ display: 'block', marginTop: '5px' }} />
      </div>

      <div className="theme-list-wrap">
        {/* 나레이션 블록 */}
        <ThemeSettingsBlock title={`📢 나레이션 전용 스타일`} themeClass="narration" fontStyle={currentNarrationStyle} fontOptions={fontOptions} onUpdate={(updates) => safeSetNarrationStyle({ ...currentNarrationStyle, ...updates })} showPortrait={false} showNamebox={false} />

        {/* ⭐ 캐릭터 배열 하나로 주인공과 등장인물의 테마 설정 블록을 모두 그려냅니다! */}
        {characters.map((char) => (
          <ThemeSettingsBlock 
            key={char.id} 
            title={`${char.isProtagonist ? '😎' : '🎭'} ${char.name || '캐릭터'} 전용 스타일`} 
            themeClass={char.isProtagonist ? "protagonist" : "character"} 
            fontStyle={char.fontStyle} 
            fontOptions={fontOptions} 
            onUpdate={(updates) => setCharacters(characters.map((c) => c.id === char.id ? { ...c, fontStyle: { ...c.fontStyle, ...updates } } : c))} 
            showPortrait={true} 
            showNamebox={true} 
          />
        ))}
      </div>

      <div style={{ height: '100px' }} />
    </div>
  );
}