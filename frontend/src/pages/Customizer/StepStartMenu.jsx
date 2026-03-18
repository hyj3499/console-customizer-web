// src/pages/Customizer/StepStartMenu.jsx
import { useState, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepStartMenu.css';

const PRESET_BG = [
    { name: '로맨틱 핑크', url: 'https://via.placeholder.com/1920x1080/ffb6c1/ffffff?text=Romantic+Pink' },
    { name: '미스테리 블루', url: 'https://via.placeholder.com/1920x1080/2c3e50/ffffff?text=Mystery+Blue' }
];

export default function StepStartMenu() {
    const { startMenu, setStartMenu, customFonts } = useCustomizerStore();
    const fileInputRef = useRef(null);
    const bgmInputRef = useRef(null); // 🌟 BGM용 Ref 추가
    
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedBgmName, setUploadedBgmName] = useState(''); // 🌟 BGM 파일명 상태 추가

    const title = startMenu.title || { text: '최애로운 생활', x: 50, y: 30, fontSize: 8, color: '#ffffff', font: 'Galmuri14', useOutline: true, outlineColor: '#000000' };
    const menu = startMenu.menu || { 
        x: 50, y: 75, fontSize: 4, color: '#ffffff', font: 'Galmuri14', useOutline: true, outlineColor: '#000000',
        bgColor: '#000000', bgOpacity: 0.5, padding: 20, useBorder: false, borderColor: '#ffffff'
    };

    const fontOptions = [
        { name: 'Galmuri14', value: 'Galmuri14' },
        { name: 'Pretendard', value: 'Pretendard' },
        { name: '둥근모꼴', value: 'DungGeunMo' },
        { name: 'Griun_PolSensibility-Rg', value: 'Griun_PolSensibility-Rg' },
        ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))
    ];

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
                    setStartMenu({ bgImage: { file: resizedFile, preview: previewUrl } });
                }, 'image/jpeg', 0.8);
            };
        };
        reader.readAsDataURL(file);
    };

    // 🎵 BGM 업로드 핸들러 추가
    const handleBgmUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedBgmName(file.name); // 파일명 저장
        const previewUrl = URL.createObjectURL(file);
        setStartMenu({ bgm: { file: file, preview: previewUrl } }); // 스토어 저장
    };

    const handleCenterCheck = (isTitle, checked) => {
        if (checked) {
            if (isTitle) updateTitle({ x: 50, y: 50 });
            else updateMenu({ x: 50, y: 50 });
        }
    };

    return (
        <div className="startmenu-container">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 className="section-title">타이틀 화면 (시작 메뉴) 디자인</h2>
                <p className="section-desc">게임 접속 시 가장 먼저 보이는 화면을 꾸며주세요.</p>
            </div>

            {/* 📺 미리보기 모니터 */}
            <div className="win95-monitor-wrap">
                <div className="win95-title-bar">
                    <h5>📺 Start Menu Preview</h5>
                </div>
                <div className="monitor-screen">
                    <img src={startMenu.bgImage?.preview || PRESET_BG[0].url} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', left: `${title.x}%`, top: `${title.y}%`, transform: 'translate(-50%, -50%)', fontFamily: getFontFamily(title.font), fontSize: `${title.fontSize}cqh`, color: title.color, textShadow: getTextShadow(title.useOutline, title.outlineColor), fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center', zIndex: 10 }}>
                        {title.text || "타이틀을 입력하세요"}
                    </div>
                    <div style={{ position: 'absolute', left: `${menu.x}%`, top: `${menu.y}%`, transform: 'translate(-50%, -50%)', backgroundColor: hexToRgba(menu.bgColor, menu.bgOpacity), padding: `${menu.padding / 10}cqw`, borderRadius: `0px`, display: 'flex', flexDirection: 'column', gap: '2cqh', alignItems: 'center', border: menu.useBorder ? `2px solid ${menu.borderColor || '#ffffff'}` : 'none', zIndex: 10 }}>
                        {['NEW GAME', 'LOAD', 'SETTING', 'EXIT'].map(text => (
                            <span key={text} style={{ fontFamily: getFontFamily(menu.font), fontSize: `${menu.fontSize}cqh`, color: menu.color, textShadow: getTextShadow(menu.useOutline, menu.outlineColor), fontWeight: 'bold' }}>{text}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="control-grid">
                
                {/* 1. 배경 및 BGM 설정 (묶음) */}
                <div className="control-card">
                    <div className="control-card-title">🖼️ 배경 및 🎵 BGM 설정</div>
                    
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1.5 }}>
                            <label className="form-label">배경 이미지 선택</label>
                            <div className="bg-thumbnail-list">
                                {PRESET_BG.map(bg => (
                                    <img key={bg.name} src={bg.url} className={`bg-thumbnail ${startMenu.bgImage?.preview === bg.url ? 'active' : ''}`} onClick={() => { setStartMenu({ bgImage: { file: null, preview: bg.url } }); setUploadedFileName(''); }} />
                                ))}
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current.click()} className="form-input" style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa' }}>+ 파일 업로드</button>
                            </div>
                            {uploadedFileName && <div className="uploaded-file-name">📎 이미지: {uploadedFileName}</div>}
                        </div>

                        <div className="form-group" style={{ borderLeft: '1px dashed #dee2e6', paddingLeft: '15px' }}>
                            <label className="form-label">타이틀 BGM 업로드</label>
                            <input type="file" accept="audio/*" ref={bgmInputRef} onChange={handleBgmUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={() => bgmInputRef.current.click()} className="form-input" style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa', fontWeight: 'bold' }}>🎵 오디오 선택</button>
                                {startMenu.bgm?.preview && <audio src={startMenu.bgm.preview} controls style={{ height: '30px' }} />}
                            </div>
                            {uploadedBgmName && <div className="uploaded-file-name" style={{ background: '#fff0f6', color: '#d6336c' }}>🎶 BGM: {uploadedBgmName}</div>}
                        </div>
                    </div>
                </div>

                {/* 2. 타이틀 설정 (이전과 동일하지만 레이아웃 정돈) */}
                <div className="control-card">
                    <div className="control-card-title">
                        <span>✨ 타이틀 (게임 제목) 설정</span>
                        <label className="checkbox-label"><input type="checkbox" checked={title.x === 50 && title.y === 50} onChange={(e) => handleCenterCheck(true, e.target.checked)} /> 🎯 정중앙</label>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}><label className="form-label">제목 텍스트</label><input type="text" className="form-input" value={title.text} onChange={(e) => updateTitle({ text: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">폰트</label><select className="form-input" value={title.font} onChange={(e) => updateTitle({ font: e.target.value })}>{fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}</select></div>
                        <div className="form-group"><label className="form-label">크기 ({title.fontSize})</label><input type="range" min="2" max="20" step="0.5" value={title.fontSize} onChange={(e) => updateTitle({ fontSize: Number(e.target.value) })} /></div>
                    </div>
                    <div className="form-row form-divider">
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}><label className="form-label">색상</label><input type="color" className="color-circle" value={title.color} onChange={(e) => updateTitle({ color: e.target.value })} /></div>
                        <div className="form-group" style={{ flex: 'unset', width: '180px' }}><label className="checkbox-label"><input type="checkbox" checked={title.useOutline} onChange={(e) => updateTitle({ useOutline: e.target.checked })} /> 글자 외곽선</label>{title.useOutline && <input type="color" className="color-circle" value={title.outlineColor} onChange={(e) => updateTitle({ outlineColor: e.target.value })} />}</div>
                        <div className="form-group"><label className="form-label">위치 X ({title.x}%)</label><input type="range" min="0" max="100" value={title.x} onChange={(e) => updateTitle({ x: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">위치 Y ({title.y}%)</label><input type="range" min="0" max="100" value={title.y} onChange={(e) => updateTitle({ y: Number(e.target.value) })} /></div>
                    </div>
                </div>

                {/* 3. 메뉴 디자인 (이전과 동일) */}
                <div className="control-card">
                    <div className="control-card-title menu-color">
                        <span>🕹️ 메뉴 (버튼) 디자인</span>
                        <label className="checkbox-label"><input type="checkbox" checked={menu.x === 50 && menu.y === 50} onChange={(e) => handleCenterCheck(false, e.target.checked)} /> 🎯 정중앙</label>
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}><label className="form-label">버튼 폰트</label><select className="form-input" value={menu.font} onChange={(e) => updateMenu({ font: e.target.value })}>{fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}</select></div>
                        <div className="form-group"><label className="form-label">글자 크기 ({menu.fontSize})</label><input type="range" min="1" max="10" step="0.5" value={menu.fontSize} onChange={(e) => updateMenu({ fontSize: Number(e.target.value) })} /></div>
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}><label className="form-label">글자색</label><input type="color" className="color-circle" value={menu.color} onChange={(e) => updateMenu({ color: e.target.value })} /></div>
                        <div className="form-group" style={{ flex: 'unset', width: '150px' }}><label className="checkbox-label"><input type="checkbox" checked={menu.useOutline} onChange={(e) => updateMenu({ useOutline: e.target.checked })} /> 글자 외곽선</label>{menu.useOutline && <input type="color" className="color-circle" value={menu.outlineColor} onChange={(e) => updateMenu({ outlineColor: e.target.value })} />}</div>
                    </div>
                    <div className="form-row form-divider">
                        <div className="form-group" style={{ flex: 'unset', width: '80px' }}><label className="form-label">배경색</label><input type="color" className="color-circle" value={menu.bgColor} onChange={(e) => updateMenu({ bgColor: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">불투명도 ({(menu.bgOpacity * 100).toFixed(0)}%)</label><input type="range" min="0" max="1" step="0.05" value={menu.bgOpacity} onChange={(e) => updateMenu({ bgOpacity: Number(e.target.value) })} /></div>
                        <div className="form-group" style={{ flex: 'unset', width: '150px', borderLeft: '1px dashed #dee2e6', paddingLeft: '15px' }}><label className="checkbox-label"><input type="checkbox" checked={menu.useBorder} onChange={(e) => updateMenu({ useBorder: e.target.checked })} /> 박스 테두리</label>{menu.useBorder && <input type="color" className="color-circle" value={menu.borderColor || '#ffffff'} onChange={(e) => updateMenu({ borderColor: e.target.value })} />}</div>
                        <div className="form-group"><label className="form-label">박스 여백 ({menu.padding})</label><input type="range" min="0" max="100" value={menu.padding} onChange={(e) => updateMenu({ padding: Number(e.target.value) })} /></div>
                    </div>
                    <div className="form-row form-divider">
                        <div className="form-group"><label className="form-label">위치 X ({menu.x}%)</label><input type="range" min="0" max="100" value={menu.x} onChange={(e) => updateMenu({ x: Number(e.target.value) })} /></div>
                        <div className="form-group"><label className="form-label">위치 Y ({menu.y}%)</label><input type="range" min="0" max="100" value={menu.y} onChange={(e) => updateMenu({ y: Number(e.target.value) })} /></div>
                    </div>
                </div>

            </div>
        </div>
    );
}