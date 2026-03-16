// src/pages/Customizer/StepStartMenu.jsx
import { useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepStartMenu.css';

const PRESET_BG = [
    { name: '로맨틱 핑크', url: 'https://via.placeholder.com/1920x1080/ffb6c1/ffffff?text=Romantic+Pink' },
    { name: '미스테리 블루', url: 'https://via.placeholder.com/1920x1080/2c3e50/ffffff?text=Mystery+Blue' }
];

export default function StepStartMenu() {
const { startMenu, setStartMenu, globalUi, customFonts } = useCustomizerStore();
    const fileInputRef = useRef(null);

    // ⭐ 튼튼한 방어 코드: 만약 옛날 데이터라 title/menu가 없으면 기본값을 억지로 쥐여줍니다.
    const title = startMenu.title || { text: '최애로운 생활', x: 50, y: 30, fontSize: 8, color: '#ffffff', font: '', useOutline: true, outlineColor: '#000000' };
    const menu = startMenu.menu || { x: 50, y: 75, fontSize: 4, color: '#ffffff', font: '', useOutline: true, outlineColor: '#000000', bgColor: '#000000', bgOpacity: 0.5, padding: 20, borderRadius: 8 };

    // --------------------------------------------------------
    // 1. 유틸리티 및 헬퍼 함수
    // --------------------------------------------------------
    const fontOptions = [
        { name: '시스템 폰트 사용', value: '' },
        { name: 'Galmuri14', value: 'Galmuri14' },
        { name: 'Pretendard', value: 'Pretendard' },
        { name: '둥근모꼴', value: 'DungGeunMo' },
        { name: 'Griun_PolSensibility-Rg', value: 'Griun_PolSensibility-Rg' },
        ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))
    ];

    const getFontFamily = (selectedFont) => selectedFont || globalUi.systemFont || 'sans-serif';
    
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

    // --------------------------------------------------------
    // 2. 이벤트 핸들러
    // --------------------------------------------------------
    const updateTitle = (updates) => setStartMenu({ title: { ...title, ...updates } });
    const updateMenu = (updates) => setStartMenu({ menu: { ...menu, ...updates } });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1920; 
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 1920, 1080);
                
                // ⭐ 핵심 수정: 캔버스를 다시 '파일(Blob)' 형태로 되돌립니다.
                canvas.toBlob((blob) => {
                    // 1. R2 업로드를 위해 원본 파일명을 유지한 새 File 객체 생성
                    const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    
                    // 2. 브라우저에서 즉시 보여주기 위한 임시 URL 생성
                    const previewUrl = URL.createObjectURL(resizedFile);
                    
                    // 3. 스토어에 'file'과 'preview'를 함께 저장!
                    // 이렇게 해야 ProjectService가 "오, 파일이 있네? R2에 올려야지!"라고 감지합니다.
                    setStartMenu({ 
                        bgImage: { 
                            file: resizedFile, 
                            preview: previewUrl 
                        } 
                    });
                }, 'image/jpeg', 0.8);
            };
        };
        reader.readAsDataURL(file);
    };

    // 💡 정중앙 정렬 체크박스 핸들러
    const handleCenterCheck = (isTitle, checked) => {
        if (checked) {
            if (isTitle) updateTitle({ x: 50, y: 50 });
            else updateMenu({ x: 50, y: 50 });
        }
    };

    return (
        <div className="startmenu-container">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 className="section-title" style={{ marginBottom: '5px' }}>타이틀 화면 (시작 메뉴) 디자인</h2>
                <p className="section-desc" style={{ margin: 0 }}>게임 접속 시 가장 먼저 보이는 화면을 꾸며주세요.</p>
            </div>

            {/* 📺 윈도우 95 스타일 미리보기 */}
            <div className="win95-monitor-wrap">
                <div className="win95-title-bar">
                    <h5>📺 Start Menu Preview</h5>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <span style={{ width: '12px', height: '12px', background: '#c0c0c0', border: '1px solid #fff', borderRightColor: '#000', borderBottomColor: '#000' }}></span>
                        <span style={{ width: '12px', height: '12px', background: '#c0c0c0', border: '1px solid #fff', borderRightColor: '#000', borderBottomColor: '#000' }}></span>
                        <button style={{ background: '#c0c0c0', borderTop: '1px solid #fff', borderLeft: '1px solid #fff', borderRight: '1px solid #000', borderBottom: '1px solid #000', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
                    </div>
                </div>

                <div className="monitor-screen">
                    <img src={startMenu.bgImage?.preview || PRESET_BG[0].url} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {/* 타이틀 */}
                    <div style={{
                        position: 'absolute', left: `${title.x}%`, top: `${title.y}%`, transform: 'translate(-50%, -50%)',
                        fontFamily: getFontFamily(title.font), fontSize: `${title.fontSize}cqh`, color: title.color,
                        textShadow: getTextShadow(title.useOutline, title.outlineColor), fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center', zIndex: 10
                    }}>
                        {title.text || "타이틀을 입력하세요"}
                    </div>

                    {/* 메뉴 박스 */}
                    <div style={{
                        position: 'absolute', left: `${menu.x}%`, top: `${menu.y}%`, transform: 'translate(-50%, -50%)',
                        backgroundColor: hexToRgba(menu.bgColor, menu.bgOpacity), padding: `${menu.padding / 10}cqw`, 
                        borderRadius: `${menu.borderRadius}px`, display: 'flex', flexDirection: 'column', gap: '2cqh', alignItems: 'center',
                        border: menu.useOutline ? `2px solid ${menu.outlineColor}` : 'none', zIndex: 10
                    }}>
                        {['NEW GAME', 'LOAD', 'SETTING', 'EXIT'].map(text => (
                            <span key={text} style={{ fontFamily: getFontFamily(menu.font), fontSize: `${menu.fontSize}cqh`, color: menu.color, textShadow: getTextShadow(menu.useOutline, menu.outlineColor), fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🎛️ 컨트롤 패널 */}
            <div className="control-grid">
                
                {/* 배경 설정 */}
                <div className="control-card">
                    <h4 className="control-card-title">🖼️ 배경 이미지 설정</h4>
                    <div className="bg-thumbnail-list">
                        {PRESET_BG.map(bg => (
                            <img key={bg.name} src={bg.url} className="bg-thumbnail" title={bg.name} onClick={() => setStartMenu({ bgImage: { file: null, preview: bg.url } })} />
                        ))}
                        <div style={{ borderLeft: '1px solid #dee2e6', margin: '0 10px' }}></div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                        <button onClick={() => fileInputRef.current.click()} style={{ height: '45px', padding: '0 15px', border: '1px dashed #adb5bd', background: '#f8f9fa', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#495057' }}>+ 내 PC에서 업로드</button>
                    </div>
                </div>

                {/* 타이틀 설정 */}
                <div className="control-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
                        <h4 className="control-card-title" style={{ margin: 0, border: 'none', padding: 0 }}>✨ 타이틀 (게임 제목) 설정</h4>
                        {/* 💡 타이틀 정중앙 체크박스 */}
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#495057' }}>
                            <input type="checkbox" checked={title.x === 50 && title.y === 50} onChange={(e) => handleCenterCheck(true, e.target.checked)} /> 🎯 화면 정중앙 배치
                        </label>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">게임 제목 텍스트</label>
                            <input type="text" className="form-input" value={title.text} onChange={(e) => updateTitle({ text: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">적용 폰트</label>
                            <select className="form-input" value={title.font} onChange={(e) => updateTitle({ font: e.target.value })}>
                                {fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-row" style={{ borderTop: '1px dashed #e9ecef', paddingTop: '15px' }}>
                        <div className="form-group">
                            {/* 💡 타이틀 X 위치 수치 표시 */}
                            <label className="form-label">위치 좌우 (X: {title.x}%)</label>
                            <input type="range" min="0" max="100" value={title.x} onChange={(e) => updateTitle({ x: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            {/* 💡 타이틀 Y 위치 수치 표시 */}
                            <label className="form-label">위치 상하 (Y: {title.y}%)</label>
                            <input type="range" min="0" max="100" value={title.y} onChange={(e) => updateTitle({ y: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">글자 크기 ({title.fontSize})</label>
                            <input type="range" min="2" max="20" step="0.5" value={title.fontSize} onChange={(e) => updateTitle({ fontSize: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 'unset', width: '120px' }}>
                            <label className="form-label">글자 색상</label>
                            <input type="color" className="color-circle" value={title.color} onChange={(e) => updateTitle({ color: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 'unset', width: '180px' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={title.useOutline} onChange={(e) => updateTitle({ useOutline: e.target.checked })} /> 
                                글자 외곽선 (그림자)
                            </label>
                            {title.useOutline && <input type="color" className="color-circle" value={title.outlineColor} onChange={(e) => updateTitle({ outlineColor: e.target.value })} />}
                        </div>
                    </div>
                </div>

                {/* 메뉴 박스 설정 */}
                <div className="control-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' }}>
                        <h4 className="control-card-title menu-color" style={{ margin: 0, border: 'none', padding: 0 }}>🕹️ 메뉴 디자인</h4>
                        {/* 💡 메뉴 정중앙 체크박스 */}
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#495057' }}>
                            <input type="checkbox" checked={menu.x === 50 && menu.y === 50} onChange={(e) => handleCenterCheck(false, e.target.checked)} /> 🎯 화면 정중앙 배치
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">적용 폰트</label>
                            <select className="form-input" value={menu.font} onChange={(e) => updateMenu({ font: e.target.value })}>
                                {fontOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">글자 크기 ({menu.fontSize})</label>
                            <input type="range" min="1" max="10" step="0.5" value={menu.fontSize} onChange={(e) => updateMenu({ fontSize: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-row" style={{ borderTop: '1px dashed #e9ecef', paddingTop: '15px' }}>
                        <div className="form-group">
                            {/* 💡 메뉴 X 위치 수치 표시 */}
                            <label className="form-label">위치 좌우 (X: {menu.x}%)</label>
                            <input type="range" min="0" max="100" value={menu.x} onChange={(e) => updateMenu({ x: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            {/* 💡 메뉴 Y 위치 수치 표시 */}
                            <label className="form-label">위치 상하 (Y: {menu.y}%)</label>
                            <input type="range" min="0" max="100" value={menu.y} onChange={(e) => updateMenu({ y: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-row" style={{ borderTop: '1px dashed #e9ecef', paddingTop: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">글자 색상</label>
                            <input type="color" className="color-circle" value={menu.color} onChange={(e) => updateMenu({ color: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">박스 배경색</label>
                            <input type="color" className="color-circle" value={menu.bgColor} onChange={(e) => updateMenu({ bgColor: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">박스 불투명도 ({(menu.bgOpacity * 100).toFixed(0)}%)</label>
                            <input type="range" min="0" max="1" step="0.05" value={menu.bgOpacity} onChange={(e) => updateMenu({ bgOpacity: Number(e.target.value) })} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">박스 여백 ({menu.padding})</label>
                            <input type="range" min="0" max="100" value={menu.padding} onChange={(e) => updateMenu({ padding: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">박스 둥글기 ({menu.borderRadius})</label>
                            <input type="range" min="0" max="50" value={menu.borderRadius} onChange={(e) => updateMenu({ borderRadius: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={menu.useOutline} onChange={(e) => updateMenu({ useOutline: e.target.checked })} /> 
                                박스 및 글자 외곽선
                            </label>
                            {menu.useOutline && <input type="color" className="color-circle" value={menu.outlineColor} onChange={(e) => updateMenu({ outlineColor: e.target.value })} />}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}