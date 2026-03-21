// src/pages/Customizer/StepStartMenu.jsx
import { useState, useRef } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepStartMenu.css';


const PRESET_BG = [
    // --- 기존 배경 ---
    { id: 'bg_black', name: '검은 배경', url: '/images/bg_black.png' },

    // --- 신규 추가된 배경 (/images/backgrounds 경로) ---
    { id: 'bg_day_1', name: '하늘 (낮)', url: '/images/backgrounds/Day 1.png' },
    { id: 'bg_evening_1', name: '하늘 (저녁)', url: '/images/backgrounds/Evening 1.png' },
    { id: 'bg_night_1_1', name: '하늘 (밤)', url: '/images/backgrounds/Night 1-1.png' },
    { id: 'bg_bedroom01_day', name: '침실 A (낮)', url: '/images/backgrounds/bedroom01_day.png' },
    { id: 'bg_bedroom01_evening2', name: '침실 A (저녁)', url: '/images/backgrounds/bedroom01_evening2.png' },
    { id: 'bg_bedroom01_nightl2', name: '침실 A (밤)', url: '/images/backgrounds/bedroom01_nightl2.png' },
    { id: 'bg_fnc_cabinbed1_night1_lights', name: '침실 B (낮)', url: '/images/backgrounds/fnc_cabinbed1_night1_lights.png' },    
    { id: 'bg_fnc_cabinbed1_day2', name: '침실 B (밤)', url: '/images/backgrounds/fnc_cabinbed1_day2.png' },
    { id: 'bg_fnc_cabing1_day2', name: '거실 A', url: '/images/backgrounds/fnc_cabing1_day2.png' },
    { id: 'bg_apartment_b_living_room_day', name: '거실 B', url: '/images/backgrounds/apartment b living room day.png' },
    { id: 'bg_mroom_day', name: '거실 C', url: '/images/backgrounds/mroom_day.png' },
    { id: 'bg_personal_room_c_day', name: '개인 방 (낮)', url: '/images/backgrounds/personal room c day.png' },
    { id: 'bg_personal_room_c_night', name: '개인 방 (밤)', url: '/images/backgrounds/personal room c night.png' },
    { id: 'bg_mroom_nightl3', name: '스크린 룸', url: '/images/backgrounds/mroom_nightl3.png'},
    { id: 'bg_mkitchen_day', name: '주방 A', url: '/images/backgrounds/mkitchen_day.png' },
    { id: 'bg_kitchen_dining_day', name: '주방 B', url: '/images/backgrounds/kitchen dining day.png' },
    { id: 'bg_bathroom_a_light2', name: '욕실', url: '/images/backgrounds/bathroom a light2.png' },
    { id: 'bg_beach_a_evening', name: '해변 (저녁)', url: '/images/backgrounds/beach a evening.png' },
    { id: 'bg_beach_a_s2_day', name: '해변 (낮)', url: '/images/backgrounds/beach a s2 day.png' },
    { id: 'bg_beach_a_s2_night', name: '해변 (밤)', url: '/images/backgrounds/beach a s2 night.png' },
    { id: 'bg_bus_stop_c1day1', name: '버스 정류장 (낮)', url: '/images/backgrounds/bus_stop_c1day1.png' },
    { id: 'bg_bus_stop_c1evening1', name: '버스 정류장 (저녁)', url: '/images/backgrounds/bus_stop_c1evening1.png' },
    { id: 'bg_bus_stop_c1night1', name: '버스 정류장 (밤)', url: '/images/backgrounds/bus_stop_c1night1.png' },
    { id: 'bg_bus_stop_c1night1_lights', name: '버스 정류장 (밤, 조명)', url: '/images/backgrounds/bus_stop_c1night1_lights.png' },
    { id: 'bg_cafe_a_day', name: '카페', url: '/images/backgrounds/cafe a day.png' },
    { id: 'bg_city_a_s1st2_day', name: '도시 거리 (낮)', url: '/images/backgrounds/city a s1st2 day.png' },
    { id: 'bg_city_a_nightlights', name: '도시 거리 (밤, 조명)', url: '/images/backgrounds/city a nightlights.png' },    
    { id: 'bg_city_a_s1st2_nightlights', name: '도시 거리 (밤)', url: '/images/backgrounds/city a s1st2 nightlights.png' },
    { id: 'bg_classroom_a_s2_day', name: '교실 A (낮)', url: '/images/backgrounds/classroom a s2 day.png' },
    { id: 'bg_classroom_a_s2_night', name: '교실 A (밤)', url: '/images/backgrounds/classroom a s2 night.png' },
    { id: 'bg_smp_classroom1_day2', name: '교실 B (낮)', url: '/images/backgrounds/smp_classroom1_day2.png' },
    { id: 'bg_smp_classroom1_evening1', name: '교실 B (저녁)', url: '/images/backgrounds/smp_classroom1_evening1.png' },
    { id: 'bg_smp_classroom4_day2', name: '교실 앞', url: '/images/backgrounds/smp_classroom4_day2.png' },
    { id: 'bg_club_room_a_day', name: '동아리방', url: '/images/backgrounds/club room a day.png' },
    { id: 'bg_exh_ha_day4', name: '주택 앞 A (낮)', url: '/images/backgrounds/exh_ha_day4.png' },
    { id: 'bg_exh_ha_night1_lights', name: '주택 앞 A (밤)', url: '/images/backgrounds/exh_ha_night1_lights.png' },
    { id: 'bg_house_a_day', name: '주택 앞 B (낮)', url: '/images/backgrounds/house a day.png' },
    { id: 'bg_fnc_path_night1', name: '어두운 숲 속', url: '/images/backgrounds/fnc_path_night1.png' },
    { id: 'bg_fnc_road_day2', name: '도로 위', url: '/images/backgrounds/fnc_road_day2.png' },
    { id: 'bg_interior_entrance_nightl2', name: '고풍스러운 저택 로비 (조명)', url: '/images/backgrounds/interior_entrance_nightl2.png' },    
    { id: 'bg_interior_entrance_evening2', name: '고풍스러운 저택 로비 (저녁)', url: '/images/backgrounds/interior_entrance_evening2.png' },
    { id: 'bg_interior_entrance_night2', name: '고풍스러운 저택 로비 (밤)', url: '/images/backgrounds/interior_entrance_night2.png' },
    { id: 'bg_inthallway2_nightl', name: '고풍스러운 저택 홀', url: '/images/backgrounds/inthallway2_nightl.png' },
    { id: 'bg_island_resort_s1_day', name: '휴양지', url: '/images/backgrounds/island resort s1 day.png' },
    { id: 'bg_mansion_front2_day', name: '고풍스러운 저택 앞 (낮)', url: '/images/backgrounds/mansion_front2_day.png' },
    { id: 'bg_mansion_front2_evening', name: '고풍스러운 저택 앞 (저녁)', url: '/images/backgrounds/mansion_front2_evening.png' },    
    { id: 'bg_mansion_front2d_night', name: '고풍스러운 저택 앞 (밤)', url: '/images/backgrounds/mansion_front2d_night.png' },
    { id: 'bg_mansion_front3_nightl', name: '고풍스러운 저택 정원', url: '/images/backgrounds/mansion_front3_nightl.png' },
    { id: 'bg_nature2_day1', name: '자연 (낮)', url: '/images/backgrounds/nature2_day1.png' },
    { id: 'bg_nature2_night1', name: '자연 (밤)', url: '/images/backgrounds/nature2_night1.png' },
    { id: 'bg_park_a_s1_day', name: '공원 (낮)', url: '/images/backgrounds/park a s1 day.png' },
    { id: 'bg_park_a_s1_nightlights', name: '공원 (밤)', url: '/images/backgrounds/park a s1 nightlights.png' },
    { id: 'bg_park_s2_day', name: '놀이터', url: '/images/backgrounds/park s2 day.png' },
    { id: 'bg_restaurant_booth_day4', name: '레스토랑', url: '/images/backgrounds/restaurant_booth_day4.png' },
    { id: 'bg_rooftop_area_day1', name: '옥상', url: '/images/backgrounds/rooftop_area_day1.png' },
    { id: 'bg_school_a_auditorium_day', name: '강당', url: '/images/backgrounds/school a auditorium day.png' },
    { id: 'bg_school_a_s1_day', name: '학교 전경 (낮)', url: '/images/backgrounds/school a s1 day.png' },
    { id: 'bg_school_a_s1_evening', name: '학교 전경 (저녁)', url: '/images/backgrounds/school a s1 evening.png' },
    { id: 'bg_school_a_s2_day', name: '학교 옥상', url: '/images/backgrounds/school a s2 day.png' },
    { id: 'bg_school_a_s3st2_day', name: '테니스장', url: '/images/backgrounds/school a s3st2 day.png' },
    { id: 'bg_school_gym_a_day', name: '체육관', url: '/images/backgrounds/school gym a day.png' },
    { id: 'bg_school_hallway_a_day', name: '학교 복도 (낮)', url: '/images/backgrounds/school hallway a day.png' },
    { id: 'bg_school_hallway_a_evening', name: '학교 복도 (저녁)', url: '/images/backgrounds/school hallway a evening.png' },
    { id: 'bg_school_stairs_day', name: '학교 계단 (낮)', url: '/images/backgrounds/school stairs day.png' },
    { id: 'bg_school_stairs_evening', name: '학교 계단 (저녁)', url: '/images/backgrounds/school stairs evening.png' },
    { id: 'bg_smp2_ar_day2', name: '미술실', url: '/images/backgrounds/smp2_ar_day2.png' },
    { id: 'bg_smp2_mr_day1', name: '음악실', url: '/images/backgrounds/smp2_mr_day1.png' },
    { id: 'bg_smp2_sp4_day3', name: '수영장', url: '/images/backgrounds/smp2_sp4_day3.png' },
    { id: 'bg_wooden_bridgeway_c1day1', name: '나무 다리 (낮)', url: '/images/backgrounds/wooden_bridgeway_c1day1.png' },
    { id: 'bg_wooden_bridgeway_c1night1', name: '나무 다리 (밤)', url: '/images/backgrounds/wooden_bridgeway_c1night1.png' }
];

export default function StepStartMenu() {
    const { startMenu, setStartMenu, customFonts } = useCustomizerStore();
    const fileInputRef = useRef(null);
    const bgmInputRef = useRef(null); 
    
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedBgmName, setUploadedBgmName] = useState(''); 

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

    // ⭐ 클라우드 URL(문자열)과 방금 업로드한 파일(객체)을 모두 처리하는 똑똑한 함수
    const getMediaUrl = (media) => {
        if (!media) return null;
        return typeof media === 'string' ? media : media.preview;
    };

    // 화면에 보여줄 실제 주소 계산
    const currentBgUrl = getMediaUrl(startMenu.bgImage) || PRESET_BG[0].url;
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

    // 🎵 BGM 업로드 핸들러
    const handleBgmUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedBgmName(file.name);
        const previewUrl = URL.createObjectURL(file);
        setStartMenu({ bgm: { file: file, preview: previewUrl } }); 
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
                    <img src={currentBgUrl} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                    <img key={bg.name} src={bg.url} className={`bg-thumbnail ${currentBgUrl === bg.url ? 'active' : ''}`} onClick={() => { setStartMenu({ bgImage: { file: null, preview: bg.url } }); setUploadedFileName(''); }} />
                                ))}
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current.click()} className="form-input" style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa' }}>+ 파일 업로드</button>
                            </div>
                            {/* 불러온 파일 이름 추출 로직 강화 */}
                            {(uploadedFileName || (typeof startMenu.bgImage === 'string' && startMenu.bgImage.length > 50)) && 
                                <div className="uploaded-file-name">📎 이미지: {uploadedFileName || "클라우드 저장 이미지"}</div>
                            }
                        </div>

                        <div className="form-group" style={{ borderLeft: '1px dashed #dee2e6', paddingLeft: '15px' }}>
                            <label className="form-label">타이틀 BGM 업로드</label>
                            <input type="file" accept="audio/*" ref={bgmInputRef} onChange={handleBgmUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={() => bgmInputRef.current.click()} className="form-input" style={{ width: 'auto', cursor: 'pointer', background: '#f8f9fa', fontWeight: 'bold' }}>🎵 오디오 선택</button>
                                {currentBgmUrl && <audio src={currentBgmUrl} controls style={{ height: '30px' }} />}
                            </div>
                            {(uploadedBgmName || (typeof startMenu.bgm === 'string' && startMenu.bgm.length > 30)) && 
                                <div className="uploaded-file-name" style={{ background: '#fff0f6', color: '#d6336c' }}>🎶 BGM: {uploadedBgmName || "클라우드 저장 오디오"}</div>
                            }
                        </div>
                    </div>
                </div>

                {/* 2. 타이틀 설정 */}
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

                {/* 3. 메뉴 디자인 */}
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