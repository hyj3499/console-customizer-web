import { useState, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';

// 프리셋 배경 이미지 (예시)
const PRESET_BG = [
    { name: '로맨틱 핑크', url: 'https://via.placeholder.com/1920x1080/ffb6c1/ffffff?text=Romantic+Pink' },
    { name: '미스테리 블루', url: 'https://via.placeholder.com/1920x1080/2c3e50/ffffff?text=Mystery+Blue' }
];

export default function StepStartMenu() {
    const { startMenu, setStartMenu, globalUi, customFonts } = useCustomizerStore();
    const fileInputRef = useRef(null);

    // --------------------------------------------------------
    // 🖼️ 1920x1080 리사이징 로직
    // --------------------------------------------------------
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
                // 비율 무시하고 꽉 채우기 (커스터마이저 요구사항)
                ctx.drawImage(img, 0, 0, 1920, 1080);
                
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    const previewUrl = URL.createObjectURL(resizedFile);
                    setStartMenu({ bgImage: { file: resizedFile, preview: previewUrl } });
                }, 'image/jpeg', 0.9);
            };
        };
        reader.readAsDataURL(file);
    };

    const updateMenu = (key, value) => {
        setStartMenu({ [key]: { ...startMenu[key], ...value } });
    };

    return (
        <div style={{ padding: '20px', width: '100%', maxWidth: '1200px' }}>
            <h2 className="section-title">Step 4. 시작 메뉴 커스텀</h2>
            
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                
                {/* 📺 왼쪽: 실시간 미리보기 (16:9 비율 유지) */}
                <div style={{ flex: 2, minWidth: '600px' }}>
                    <div style={{ 
                        position: 'relative', 
                        width: '100%', 
                        aspectRatio: '16/9', 
                        backgroundColor: '#000',
                        backgroundImage: `url(${startMenu.bgImage?.preview || PRESET_BG[0].url})`,
                        backgroundSize: 'cover',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '4px solid #333'
                    }}>
                        {/* 🕹️ 메뉴 버튼 박스 */}
                        <div style={{
                            position: 'absolute',
                            left: `${startMenu.menuPos.x}%`,
                            top: `${startMenu.menuPos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: startMenu.boxStyle.color,
                            padding: `${startMenu.boxStyle.padding}px`,
                            borderRadius: `${startMenu.boxStyle.borderRadius}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            alignItems: 'center',
                            border: startMenu.boxStyle.frame === 'simple' ? '2px solid white' : 'none'
                        }}>
                            {['NEW GAME', 'LOAD', 'EXIT'].map(text => (
                                <span key={text} style={{
                                    fontFamily: globalUi.systemFont,
                                    fontSize: `${startMenu.textStyle.fontSize}px`,
                                    color: startMenu.textStyle.color,
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}>{text}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ⚙️ 오른쪽: 설정창 */}
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 배경 선택 */}
                    <div className="settings-card">
                        <label className="input-label">🖼️ 배경 이미지</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            {PRESET_BG.map(bg => (
                                <img key={bg.name} src={bg.url} style={{ width: '60px', height: '34px', cursor: 'pointer', border: '2px solid #ddd' }} 
                                     onClick={() => setStartMenu({ bgImage: { file: null, preview: bg.url } })} />
                            ))}
                        </div>
                        <input type="file" onChange={handleImageUpload} />
                    </div>

                    {/* 위치 조절 */}
                    <div className="settings-card">
                        <label className="input-label">📍 메뉴 위치 (X / Y)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="range" min="0" max="100" value={startMenu.menuPos.x} onChange={(e) => setStartMenu({ menuPos: { ...startMenu.menuPos, x: e.target.value } })} />
                            <input type="range" min="0" max="100" value={startMenu.menuPos.y} onChange={(e) => setStartMenu({ menuPos: { ...startMenu.menuPos, y: e.target.value } })} />
                        </div>
                    </div>

                    {/* 박스 스타일 */}
                    <div className="settings-card">
                        <label className="input-label">📦 박스 스타일 (색상/불투명도)</label>
                        <input type="color" onChange={(e) => {
                            const hex = e.target.value;
                            updateMenu('boxStyle', { color: hex + '80' }); // 기본 불투명도 50%
                        }} />
                        <label className="input-label">박스 둥글기</label>
                        <input type="number" value={startMenu.boxStyle.borderRadius} onChange={(e) => updateMenu('boxStyle', { borderRadius: e.target.value })} />
                    </div>

                    {/* 텍스트 스타일 */}
                    <div className="settings-card">
                        <label className="input-label">✍️ 텍스트 크기 & 색상</label>
                        <input type="number" value={startMenu.textStyle.fontSize} onChange={(e) => updateMenu('textStyle', { fontSize: e.target.value })} />
                        <input type="color" value={startMenu.textStyle.color} onChange={(e) => updateMenu('textStyle', { color: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    );
}