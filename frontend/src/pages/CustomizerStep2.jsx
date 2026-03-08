import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCustomizerStore from '../store/useCustomizerStore';
import './Customizer.css';

export default function CustomizerStep2() {
    const navigate = useNavigate();
    const { 
        protagonist, setProtagonist, 
        heroine, setHeroine,
        pFontStyle, setPFontStyle, 
        hFontStyle, setHFontStyle,
        customFonts, addCustomFont 
    } = useCustomizerStore();

    const fontOptions = [
        { name: 'Pretendard (기본)', value: 'Pretendard' },
        { name: '둥근모꼴', value: 'DungGeunMo' },
        ...customFonts.map(f => ({ name: `📁 ${f.name}`, value: f.name }))
    ];

    // --- 📸 사진 업로드 핸들러 ---
    const handleImageUpload = (e, characterType) => {
        const files = Array.from(e.target.files);
        const targetState = characterType === 'protagonist' ? protagonist : heroine;
        const setTargetState = characterType === 'protagonist' ? setProtagonist : setHeroine;

        if (targetState.images.length + files.length > 8) {
            alert('스탠딩 사진은 최대 8개까지만 등록할 수 있습니다!'); return;
        }

        const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setTargetState({ ...targetState, images: [...targetState.images, ...newImages] });
    };

    const removeImage = (indexToRemove, characterType) => {
        const targetState = characterType === 'protagonist' ? protagonist : heroine;
        const setTargetState = characterType === 'protagonist' ? setProtagonist : setHeroine;
        setTargetState({ ...targetState, images: targetState.images.filter((_, index) => index !== indexToRemove) });
    };

    // --- 🔠 폰트 파일 업로드 핸들러 ---
    const handleFontUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fontName = file.name.split('.')[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const fontUrl = event.target.result;
            const newFont = new FontFace(fontName, `url(${fontUrl})`);
            newFont.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                addCustomFont(fontName, fontUrl);
                alert(`${fontName} 폰트가 등록되었습니다.`);
            });
        };
        reader.readAsDataURL(file);
    };

    // 스타일 생성 함수 (외곽선 유무 판단)
    const getTextStyle = (style) => ({
        fontFamily: style.font,
        color: style.color,
        textShadow: style.useOutline 
            ? `-1px -1px 0 ${style.outline}, 1px -1px 0 ${style.outline}, -1px 1px 0 ${style.outline}, 1px 1px 0 ${style.outline}`
            : 'none',
        fontSize: '14px', margin: 0, lineHeight: '1.4'
    });

    return (
        <div className="customizer-container">
            <div className="progress-header"><h2>진행 상황: 2 / 5</h2></div>

            {/* --- ✨ 1. 주인공 & 히로인 폰트 동시 미리보기 --- */}
            <div className="preview-section" style={{ marginBottom: '30px' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>📺 폰트 스타일 동시 미리보기</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {/* 주인공 미리보기 */}
                    <div className="chat-log-preview" style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
                        <span style={{ ...getTextStyle(pFontStyle), fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.3)', display: 'block', paddingBottom: '5px', marginBottom: '10px' }}>
                            {protagonist.name || '주인공'}
                        </span>
                        <p style={getTextStyle(pFontStyle)}>"주인공의 대사 스타일입니다."</p>
                    </div>
                    {/* 히로인 미리보기 */}
                    <div className="chat-log-preview" style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
                        <span style={{ ...getTextStyle(hFontStyle), fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.3)', display: 'block', paddingBottom: '5px', marginBottom: '10px' }}>
                            {heroine.name || '히로인'}
                        </span>
                        <p style={getTextStyle(hFontStyle)}>"히로인의 대사 스타일입니다."</p>
                    </div>
                </div>
            </div>

            {/* --- 이름 및 사진 설정 영역 (세로 배치로 수정됨) --- */}
            <h4 style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #333', display: 'inline-block' }}>
                👤 이름 및 스탠딩 일러 설정
            </h4>
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 😎 주인공 설정 섹션 */}
                <div className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#1971c2' }}>😎 주인공 (Player)</h4>
                    <div className="input-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label>
                        <input 
                            type="text" 
                            className="text-input" 
                            placeholder="이름 입력" 
                            value={protagonist.name} 
                            onChange={(e) => setProtagonist({...protagonist, name: e.target.value})} 
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'protagonist')} 
                            className="file-input" 
                        />
                    </div>
                    <div className="image-preview-list" style={{ marginTop: '10px' }}>
                        {protagonist.images.map((img, idx) => (
                            <div key={idx} className="preview-item">
                                <img src={img.preview} alt="p" />
                                <button className="remove-btn" onClick={() => removeImage(idx, 'protagonist')}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 💖 히로인 설정 섹션 */}
                <div className="character-section" style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#d6336c' }}>💖 히로인 (Heroine)</h4>
                    <div className="input-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름</label>
                        <input 
                            type="text" 
                            className="text-input" 
                            placeholder="이름 입력" 
                            value={heroine.name} 
                            onChange={(e) => setHeroine({...heroine, name: e.target.value})} 
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>스탠딩 사진 업로드</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'heroine')} 
                            className="file-input" 
                        />
                    </div>
                    <div className="image-preview-list" style={{ marginTop: '10px' }}>
                        {heroine.images.map((img, idx) => (
                            <div key={idx} className="preview-item">
                                <img src={img.preview} alt="h" />
                                <button className="remove-btn" onClick={() => removeImage(idx, 'heroine')}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
{/* --- 🔠 폰트 통합 설정 --- */}
            <div className="character-section" style={{ backgroundColor: '#f8f9fa', marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '20px' }}>🔠 시스템 폰트 및 스타일 설정</h4>
                
                <div className="input-group" style={{ marginBottom: '25px' }}>
                    <label>➕ 커스텀 폰트 파일 추가 (.ttf, .otf)</label>
                    <input type="file" accept=".ttf, .otf, .woff, .woff2" onChange={handleFontUpload} className="file-input" />
                </div>

                {/* ✨ 주인공과 히로인 설정을 세로로 배치하기 위해 flex-direction: column 사용 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 😎 주인공 스타일 설정 */}
                    <div style={{ padding: '20px', backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #d0ebff' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '15px', color: '#1971c2', fontSize: '16px' }}>
                            😎 {protagonist.name || '주인공'} 스타일
                        </label>
                        
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '13px' }}>폰트 선택</label>
                            <select className="speaker-select" style={{ width: '100%' }} value={pFontStyle.font} onChange={(e) => setPFontStyle({ font: e.target.value })}>
                                {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'nflex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>글자 색상:</span>
                                <input type="color" value={pFontStyle.color} onChange={(e) => setPFontStyle({ color: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={pFontStyle.useOutline} onChange={(e) => setPFontStyle({ useOutline: e.target.checked })} id="p-outline-check" style={{ cursor: 'pointer' }} />
                                <label htmlFor="p-outline-check" style={{ fontSize: '13px', cursor: 'pointer' }}>외곽선 사용</label>
                                {pFontStyle.useOutline && (
                                    <input type="color" value={pFontStyle.outline} onChange={(e) => setPFontStyle({ outline: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer' }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 💖 히로인 스타일 설정 */}
                    <div style={{ padding: '20px', backgroundColor: '#fff0f6', borderRadius: '8px', border: '1px solid #ffdeeb' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '15px', color: '#d6336c', fontSize: '16px' }}>
                            💖 {heroine.name || '히로인'} 스타일
                        </label>

                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '13px' }}>폰트 선택</label>
                            <select className="speaker-select" style={{ width: '100%' }} value={hFontStyle.font} onChange={(e) => setHFontStyle({ font: e.target.value })}>
                                {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>글자 색상:</span>
                                <input type="color" value={hFontStyle.color} onChange={(e) => setHFontStyle({ color: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={hFontStyle.useOutline} onChange={(e) => setHFontStyle({ useOutline: e.target.checked })} id="h-outline-check" style={{ cursor: 'pointer' }} />
                                <label htmlFor="h-outline-check" style={{ fontSize: '13px', cursor: 'pointer' }}>외곽선 사용</label>
                                {hFontStyle.useOutline && (
                                    <input type="color" value={hFontStyle.outline} onChange={(e) => setHFontStyle({ outline: e.target.value })} style={{ width: '30px', height: '30px', border: 'none', cursor: 'pointer' }} />
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button className="action-btn secondary" onClick={() => navigate('/step/1')}>이전</button>
                <button className="action-btn" onClick={() => navigate('/step/3')}>다음</button>
            </div>
        </div>
    );
}