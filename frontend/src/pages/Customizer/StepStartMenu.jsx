// src/pages/Customizer/StepStartMenu.jsx
import { useState, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import { SHARED_BACKGROUNDS, SHARED_FONT } from '../../assets/assets';
import './StepStartMenu.css';

export default function StepStartMenu() {
    const { startMenu, setStartMenu, customFonts, customBackgrounds, addCustomBackground, removeCustomBackground, events} = useCustomizerStore();
    const fileInputRef = useRef(null);
    const bgmInputRef = useRef(null); 

    const [showTips, setShowTips] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedBgmName, setUploadedBgmName] = useState(''); 

    const title = startMenu.title || { text: '최애로운 생활', x: 50, y: 30, fontSize: 8, color: '#ffffff', font: 'Galmuri14', useOutline: true, outlineColor: '#000000' };
    const menu = startMenu.menu || { 
        x: 50, y: 75, fontSize: 4, color: '#ffffff', font: 'Galmuri14', useOutline: true, outlineColor: '#000000',
        bgColor: '#000000', bgOpacity: 0.5, padding: 20, useBorder: false, borderColor: '#ffffff'
    };

// ⭐ 1. 커스텀 폰트 중복 제거
    const uniqueCustomFonts = customFonts.filter(
        (font, index, self) => index === self.findIndex((t) => t.name === font.name)
    );

    // ⭐ 2. SHARED_FONT와 커스텀 폰트 합치기
    const fontOptions = [
        ...(SHARED_FONT || []), // 기본 폰트 리스트
        ...uniqueCustomFonts.map((f) => ({ name: `📁 ${f.name}`, value: f.name })) // 업로드한 폰트
    ];


    // ⭐ 클라우드 URL(문자열)과 방금 업로드한 파일(객체)을 모두 처리하는 똑똑한 함수
    const getMediaUrl = (media) => {
        if (!media) return null;
        return typeof media === 'string' ? media : media.preview;
    };

    // 화면에 보여줄 실제 주소 계산
    const currentBgUrl = getMediaUrl(startMenu.bgImage) || SHARED_BACKGROUNDS[0]?.url;
    const currentBgmUrl = getMediaUrl(startMenu.bgm);

    const getFontFamily = (selectedFont) => selectedFont || 'Galmuri14';
    const getTextShadow = (useOutline, outlineColor) => {
        if (!useOutline) return 'none';
        return `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}, 0px 4px 10px rgba(0,0,0,0.5)`;
    };
    const hexToRgba = (hex, opacity) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const updateTitle = (updates) => setStartMenu({ title: { ...title, ...updates } });
    const updateMenu = (updates) => setStartMenu({ menu: { ...menu, ...updates } });

    // 예전 세이브 파일을 불러왔을 때를 대비한 기본 버튼 텍스트 설정
    const menuButtons = menu.buttons || ['NEW GAME', 'LOAD', 'SETTING', 'EXIT'];

    // 특정 버튼의 텍스트만 콕 집어서 바꿔주는 함수
    const updateMenuButton = (index, newValue) => {
        const newButtons = [...menuButtons];
        newButtons[index] = newValue;
        updateMenu({ buttons: newButtons });
    };

// 🖼️ 배경 이미지 업로드 핸들러
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1920; canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 1920, 1080);
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    const previewUrl = URL.createObjectURL(resizedFile);
                    
                    // ⭐ 수정 2: 업로드한 이미지를 '나의 배경 보관함' 전역 스토어에도 저장!
                    const newId = `custom_bg_${Date.now()}`;
                    addCustomBackground({ id: newId, name: file.name, url: previewUrl, file: resizedFile });
                    
                    setStartMenu({ bgImage: { file: resizedFile, preview: previewUrl }, bgImageName: file.name });
                }, 'image/jpeg', 0.8);
            };
        };
        reader.readAsDataURL(file);
    };

    // 🎵 BGM 업로드 핸들러
    const handleBgmUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedBgmName(file.name);
        const previewUrl = URL.createObjectURL(file);
        // ⭐ 수정됨: bgmName 추가
        setStartMenu({ bgm: { file: file, preview: previewUrl }, bgmName: file.name }); 
    };

    // 🎵 BGM 삭제 핸들러
    const handleBgmClear = () => {
        if (window.confirm("설정된 타이틀 BGM을 삭제하시겠습니까?")) {
            setUploadedBgmName('');
            // ⭐ 수정됨: 삭제 시 bgmName도 비워줌
            setStartMenu({ bgm: null, bgmName: '' });
            if (bgmInputRef.current) bgmInputRef.current.value = ''; 
        }
    };

    // ⭐ 추가됨: 예전 세이브 파일 등 URL만 있을 때 이름 추출하는 함수
    const extractNameFromUrl = (url) => {
        if (typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            return decodeURIComponent(lastPart).split('_').pop(); // 지문 뒤의 진짜 이름만 추출
        } catch (e) {
            return "저장된 파일";
        }
    };

    // 화면에 보여줄 파일 이름 계산 (방금 올린 이름 or 스토어 이름 or URL에서 추출한 이름)
    const displayBgName = uploadedFileName || startMenu.bgImageName || extractNameFromUrl(startMenu.bgImage);
    const displayBgmName = uploadedBgmName || startMenu.bgmName || extractNameFromUrl(startMenu.bgm);

    const handleCenterCheck = (isTitle, checked) => {
        if (checked) {
            if (isTitle) updateTitle({ x: 50, y: 50 });
            else updateMenu({ x: 50, y: 50 });
        }
    };
    // ⭐ 현재 선택된 배경의 ID를 계산 (콤보박스 및 삭제 버튼 표시에 사용)
    const selectedBgId = SHARED_BACKGROUNDS.find(bg => bg.url === currentBgUrl)?.id || customBackgrounds.find(bg => bg.url === currentBgUrl)?.id || 'custom';

    // ⭐ 커스텀 배경 삭제 핸들러
// ⭐ 커스텀 배경 삭제 핸들러 (사용 중일 때 삭제 차단 로직 적용)
// ⭐ 커스텀 배경 삭제 핸들러 (이벤트 사용 여부만 검사)
    const handleDeleteCustomBg = (bgIdToRemove) => {
        const customBgToDelete = customBackgrounds.find(bg => bg.id === bgIdToRemove);
        const bgUrlToDelete = customBgToDelete?.url;

        // 1. [검사] 시작 메뉴 자기 자신은 검사 패스! 오직 '이벤트 시나리오 컷'만 검사합니다.
        let isUsedInEvents = false;
        if (events) {
            for (const ev of events) {
                if (ev.scenarios && ev.scenarios.some(sc => sc.bgType === bgIdToRemove || sc.bgImage === bgUrlToDelete)) {
                    isUsedInEvents = true;
                    break;
                }
            }
        }

        // 2. 차단: 이벤트에서 쓰고 있다면 삭제 불가
        if (isUsedInEvents) {
            alert("🚨 삭제 불가!\n현재 이 배경 이미지가 [이벤트 컷]에서 사용 중입니다.\n이벤트 에디터에서 해당 배경을 다른 것으로 변경한 후 삭제해 주세요.");
            return;
        }

        // 3. 통과: 이벤트에서 안 쓴다면 (시작 메뉴에서만 쓴다면) 삭제 진행
        if (!window.confirm("이 배경을 보관함에서 완전히 삭제하시겠습니까?\n(시작 메뉴의 배경은 기본값으로 초기화됩니다.)")) return;

        removeCustomBackground(bgIdToRemove);

        // 삭제 후 시작 메뉴 배경 초기화
        if (selectedBgId === bgIdToRemove) {
            setStartMenu({ bgImage: { file: null, preview: SHARED_BACKGROUNDS[0]?.url }, bgImageName: '' });
            setUploadedFileName(''); 
        }
    };

    return (
        <div className="startmenu-container">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 className="section-title">타이틀 화면 (시작 메뉴) 디자인</h2>
                <p className="section-desc">게임 접속 시 가장 먼저 보이는 화면을 꾸며주세요.</p>
            </div>
{/* 🔵 파란색 박스: 유용한 팁 (접기/펼치기) */}
            <div 
                className="settings-tips-wrap" 
                style={{ 
                    padding: showTips ? '15px' : '12px 15px', 
                    cursor: showTips ? 'default' : 'pointer', 
                    transition: '0.2s', 
                    marginBottom: '0px' // 아래 박스와 붙이기 위해 0
                }} 
                onClick={() => !showTips && setShowTips(true)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#1971c2', fontSize: '14px' }}>
                        💡 유용한 타이틀 연출 팁 보기
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowTips(!showTips); }} 
                        style={{ background: 'none', border: 'none', color: '#1971c2', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px', backgroundColor: showTips ? 'transparent' : '#e7f5ff' }}
                    >
                        {showTips ? '접기 ▲' : '펼치기 ▼'}
                    </button>
                </div>

                {showTips && (
                    <ul className="settings-tips" style={{ marginTop: '12px', borderTop: '1px dashed #a5d8ff', paddingTop: '12px' }}>
                        <li>
                            <strong>✨ 게임 로고가 그려진 예쁜 배경 이미지가 있다면?</strong>
                            <p style={{ marginTop: '4px', color: '#495057', fontSize: '12px' }}>
                                [제목 텍스트] 칸을 완전히 비워보세요! 내가 직접 만든 예쁜 타이틀 로고 이미지를 배경으로 사용할 수 있습니다.
                            </p>
                        </li>
                        <li>
                            <p style={{ marginTop: '4px', color: '#495057', fontSize: '12px', lineHeight: '1.5' }}>
                                업로드된 배경 이미지는 <strong>1920x1080(16:9)</strong>으로 자동 조정됩니다. 이미지가 좌우로 늘어나거나 찌그러져 보인다면, 상단바의 <strong style={{ color: '#1971c2' }}>[✂️ 이미지 자르기]</strong> 메뉴를 이용해 16:9 비율로 쉽게 편집한 후 업로드해 보세요!
                            </p>
                        </li>
                        <li style={{ marginTop: '8px', color: '#e03131', fontWeight: 'bold' }}>
                            📱 미리보기 화면은 실제 게임 화면(16:9 비율)을 축소해서 보여줍니다. 폰트 크기나 여백이 완벽해 보여도 PC나 모바일 기기 크기에 따라 미세한 차이가 있을 수 있습니다.
                        </li>
                    </ul>
                )}
            </div>

            {/* 🌸 분홍색 박스: 버튼 설명 (접기/펼치기) */}
            <div 
                className="settings-tips-wrap pink" 
                style={{ 
                    padding: showGuide ? '15px' : '12px 15px', 
                    cursor: showGuide ? 'default' : 'pointer', 
                    transition: '0.2s', 
                    marginTop: '4px', // 파란 박스와의 최소 간격
                    marginBottom: '25px' 
                }} 
                onClick={() => !showGuide && setShowGuide(true)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#d6336c', fontSize: '14px' }}>
                        🕹️ 타이틀 버튼 및 가이드 보기
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowGuide(!showGuide); }} 
                        style={{ background: 'none', border: 'none', color: '#d6336c', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px', backgroundColor: showGuide ? 'transparent' : '#fff0f6' }}
                    >
                        {showGuide ? '접기 ▲' : '펼치기 ▼'}
                    </button>
                </div>

                {showGuide && (
                    <ul className="settings-tips" style={{ marginTop: '12px', borderTop: '1px dashed #ffc9c9', paddingTop: '12px' }}>
                        <li><strong>🖼️ 직접 업로드 & 🗑️ 삭제:</strong> 내 PC에 있는 배경 이미지나 BGM을 직접 올릴 수 있습니다. 사용하지 않는 배경은 [🗑️ 배경 삭제] 버튼을 눌러 보관함에서 지울 수 있습니다.</li>
                        <li><strong>🎯 정중앙 고정:</strong> 위치가 (X: 50%, Y: 50%)로 즉시 고정됩니다.</li>
                        <li><strong>💬 메뉴 버튼 문구 변경:</strong> 'NEW GAME', 'LOAD' 같은 영문 버튼이 식상하다면 '새로운 모험', '기억 불러오기' 등 게임 컨셉에 맞는 문구로 바꿀 수 있습니다.</li>
                    </ul>
                )}
            </div>
            {/* 📺 미리보기 모니터 */}
            <div className="win95-monitor-wrap">
                <div className="win95-title-bar">
                    <h5>📺 Start Menu Preview</h5>
                </div>
                <div className="monitor-screen">
                    <img src={currentBgUrl} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', left: `${title.x}%`, top: `${title.y}%`, transform: 'translate(-50%, -50%)', fontFamily: getFontFamily(title.font), fontSize: `${title.fontSize}cqh`, color: title.color, textShadow: getTextShadow(title.useOutline, title.outlineColor), fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center', zIndex: 10 }}>
                        {title.text !== undefined ? title.text : "최애로운 생활"}
                    </div>
                    <div style={{ position: 'absolute', left: `${menu.x}%`, top: `${menu.y}%`, transform: 'translate(-50%, -50%)', backgroundColor: hexToRgba(menu.bgColor, menu.bgOpacity), padding: `${menu.padding / 10}cqw`, borderRadius: `0px`, display: 'flex', flexDirection: 'column', gap: '2cqh', alignItems: 'center', border: menu.useBorder ? `2px solid ${menu.borderColor || '#ffffff'}` : 'none', zIndex: 10 }}>
                        {menuButtons.map((text, idx) => (
                            <span key={idx} style={{ fontFamily: getFontFamily(menu.font), fontSize: `${menu.fontSize}cqh`, color: menu.color, textShadow: getTextShadow(menu.useOutline, menu.outlineColor), fontWeight: 'bold' }}>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="control-grid">
                
                {/* 1. 배경 및 BGM 설정 (묶음) */}
                <div className="control-card">
                    <div className="control-card-title">🖼️ 배경 및 🎵 BGM 설정</div>
                    
                    <div className="form-row">
                        {/* ⭐ 배경 선택: 콤보박스 영역 ⭐ */}
                        <div className="form-group" style={{ flex: 1.5 }}>
                            <label className="form-label">배경 이미지 선택</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select 
                                    className="form-input" 
                                    value={selectedBgId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUploadedFileName(''); 
                                        
                                        const preset = SHARED_BACKGROUNDS.find(bg => bg.id === val);
                                        if (preset) {
                                            setStartMenu({ bgImage: { file: null, preview: preset.url }, bgImageName: preset.name });
                                            return;
                                        }
                                        
                                        const custom = customBackgrounds.find(bg => bg.id === val);
                                        if (custom) {
                                            setStartMenu({ bgImage: { file: custom.file, preview: custom.url }, bgImageName: custom.name });
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                >
{/* ⭐ 1. 나의 배경 보관함 (위로 이동) */}
            {customBackgrounds.length > 0 && (
                <optgroup label="나의 배경 보관함">
                    {customBackgrounds.map(bg => (
                        <option key={bg.id} value={bg.id}>📁 {bg.name}</option>
                    ))}
                </optgroup>
            )}

            {/* ⭐ 2. 기본 제공 배경 (아래로 이동) */}
            <optgroup label="기본 제공 배경">
                {SHARED_BACKGROUNDS.map(bg => (
                    <option key={bg.id} value={bg.id}>{bg.name}</option>
                ))}
            </optgroup>
        </select>

                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                                <button 
                                    onClick={() => fileInputRef.current.click()} 
                                    className="form-input" 
                                    style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa', whiteSpace: 'nowrap', fontWeight: 'bold' }}
                                >
                                    + 직접 업로드
                                </button>

                                {/* ⭐ 커스텀 배경을 선택했을 때만 나타나는 삭제 버튼 */}
                                {selectedBgId.startsWith('custom_bg_') && (
                                    <button 
                                        onClick={() => handleDeleteCustomBg(selectedBgId)}
                                        style={{ backgroundColor: '#ffe3e3', color: '#e03131', border: '1px solid #ffc9c9', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                        title="이 배경을 보관함에서 삭제합니다"
                                    >
                                        🗑️ 배경 삭제
                                    </button>
                                )}
                            </div>

                            {displayBgName && 
                                <div className="uploaded-file-name" style={{ marginTop: '5px', fontSize: '12px', color: '#1971c2' }}>
                                    📎 적용된 이미지: {displayBgName}
                                </div>
                            }
                        </div>

                        {/* ⭐ BGM 영역 ⭐ */}
{/* ⭐ BGM 영역 ⭐ */}
                        <div className="form-group" style={{ borderLeft: '1px dashed #dee2e6', paddingLeft: '15px' }}>
                            <label className="form-label">타이틀 BGM 업로드</label>
                            <input type="file" accept="audio/*" ref={bgmInputRef} onChange={handleBgmUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={() => bgmInputRef.current.click()} className="form-input" style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa', fontWeight: 'bold' }}>🎵 오디오 선택</button>
                                {currentBgmUrl && <audio src={currentBgmUrl} controls style={{ height: '30px' }} />}
                            </div>
                            
                            {/* ⭐ 조건문과 출력 이름이 displayBgmName으로 훨씬 깔끔해졌습니다! */}
                            {displayBgmName && 
                                <div className="uploaded-file-name" style={{ marginTop: '5px', fontSize: '12px', color: '#d6336c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>🎶 BGM: {displayBgmName}</span>
                                    {/* ⭐ 삭제(X) 버튼 추가 */}
                                    <button 
                                        onClick={handleBgmClear} 
                                        style={{ 
                                            background: 'transparent', 
                                            border: 'none', 
                                            color: '#fa5252', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '14px',
                                            padding: '0 5px'
                                        }}
                                        title="BGM 삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>

{/* 2. 타이틀 설정 */}
{/* 2. 타이틀 설정 */}
                <div className="control-card">
                    <div className="control-card-title">✨ 타이틀 (게임 제목) 설정</div>
                    
                    {/* 1. 내용 입력 */}
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">제목 텍스트</label>
                            <input type="text" className="form-input" placeholder="비워두면 화면에 제목이 표시되지 않습니다." value={title.text} onChange={(e) => updateTitle({ text: e.target.value })} />
                        </div>
                    </div>

                    {/* 2. 폰트 및 색상 */}
                    <div className="form-row form-divider">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">폰트</label>
                            <select className="form-input" value={title.font} onChange={(e) => updateTitle({ font: e.target.value })}>
                                {fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">크기 ({title.fontSize})</label>
                            <input type="range" min="2" max="20" step="0.5" value={title.fontSize} onChange={(e) => updateTitle({ fontSize: Number(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}>
                            <label className="form-label">글자색</label>
                            <input type="color" className="color-circle" value={title.color} onChange={(e) => updateTitle({ color: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 'unset', width: '150px' }}>
                            <label className="checkbox-label"><input type="checkbox" checked={title.useOutline} onChange={(e) => updateTitle({ useOutline: e.target.checked })} /> 글자 외곽선</label>
                            {title.useOutline && <input type="color" className="color-circle" value={title.outlineColor} onChange={(e) => updateTitle({ outlineColor: e.target.value })} />}
                        </div>
                    </div>

                    {/* 3. 위치 조정 (⭐ 정중앙 버튼 이동) */}
                    <div className="form-row form-divider" style={{ alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 'unset', marginRight: '20px', paddingBottom: '8px' }}>
                            <label className="checkbox-label" style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1971c2' }}>
                                <input type="checkbox" checked={title.x === 50 && title.y === 50} onChange={(e) => handleCenterCheck(true, e.target.checked)} /> 🎯 정중앙 고정
                            </label>
                        </div>
                        <div className="form-group"><label className="form-label">위치 X ({title.x}%)</label><input type="range" min="0" max="100" value={title.x} onChange={(e) => updateTitle({ x: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">위치 Y ({title.y}%)</label><input type="range" min="0" max="100" value={title.y} onChange={(e) => updateTitle({ y: Number(e.target.value) })} /></div>
                    </div>
                </div>

                {/* 3. 메뉴 디자인 */}
                <div className="control-card">
                    <div className="control-card-title menu-color">🕹️ 메뉴 (버튼) 디자인</div>

                {/* 1. 내용 입력 */}
                <div className="form-row">
                    {["게임 시작", "불러오기", "환경 설정", "게임 종료"].map((label, i) => (
                        <div key={i} className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ color: '#1971c2', fontWeight: 'bold' }}>
                                {label} 문구
                            </label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder={`예: ${label}`}
                                value={menuButtons[i]} 
                                onChange={(e) => updateMenuButton(i, e.target.value)} 
                            />
                        </div>
                    ))}
                </div>

                    {/* 2. 폰트 및 색상 */}
                    <div className="form-row form-divider">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">버튼 폰트</label>
                            <select className="form-input" value={menu.font} onChange={(e) => updateMenu({ font: e.target.value })}>
                                {fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">글자 크기 ({menu.fontSize})</label>
                            <input type="range" min="1" max="10" step="0.5" value={menu.fontSize} onChange={(e) => updateMenu({ fontSize: Number(e.target.value) })} />
                        </div>
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}>
                            <label className="form-label">글자색</label>
                            <input type="color" className="color-circle" value={menu.color} onChange={(e) => updateMenu({ color: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 'unset', width: '150px' }}>
                            <label className="checkbox-label"><input type="checkbox" checked={menu.useOutline} onChange={(e) => updateMenu({ useOutline: e.target.checked })} /> 글자 외곽선</label>
                            {menu.useOutline && <input type="color" className="color-circle" value={menu.outlineColor} onChange={(e) => updateMenu({ outlineColor: e.target.value })} />}
                        </div>
                    </div>

                    {/* 3. 메뉴 전용 박스 디자인 */}
                    <div className="form-row form-divider">
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}><label className="form-label">배경색</label><input type="color" className="color-circle" value={menu.bgColor} onChange={(e) => updateMenu({ bgColor: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">불투명도 ({(menu.bgOpacity * 100).toFixed(0)}%)</label><input type="range" min="0" max="1" step="0.05" value={menu.bgOpacity} onChange={(e) => updateMenu({ bgOpacity: Number(e.target.value) })} /></div>
                        <div className="form-group" style={{ flex: 'unset', width: '150px', borderLeft: '1px dashed #dee2e6', paddingLeft: '15px' }}><label className="checkbox-label"><input type="checkbox" checked={menu.useBorder} onChange={(e) => updateMenu({ useBorder: e.target.checked })} /> 박스 테두리</label>{menu.useBorder && <input type="color" className="color-circle" value={menu.borderColor || '#ffffff'} onChange={(e) => updateMenu({ borderColor: e.target.value })} />}</div>
                        <div className="form-group"><label className="form-label">박스 여백 ({menu.padding})</label><input type="range" min="0" max="100" value={menu.padding} onChange={(e) => updateMenu({ padding: Number(e.target.value) })} /></div>
                    </div>

                    {/* 4. 위치 조정 (⭐ 정중앙 버튼 이동) */}
                    <div className="form-row form-divider" style={{ alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 'unset', marginRight: '20px', paddingBottom: '8px' }}>
                            <label className="checkbox-label" style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1971c2' }}>
                                <input type="checkbox" checked={menu.x === 50 && menu.y === 50} onChange={(e) => handleCenterCheck(false, e.target.checked)} /> 🎯 정중앙 고정
                            </label>
                        </div>
                        <div className="form-group"><label className="form-label">위치 X ({menu.x}%)</label><input type="range" min="0" max="100" value={menu.x} onChange={(e) => updateMenu({ x: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">위치 Y ({menu.y}%)</label><input type="range" min="0" max="100" value={menu.y} onChange={(e) => updateMenu({ y: Number(e.target.value) })} /></div>
                    </div>
                </div>

            </div>
        </div>
    );
}