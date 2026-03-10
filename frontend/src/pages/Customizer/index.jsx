import { useState } from 'react';
import { saveProjectToServer, uploadAndSaveProject } from "../../services/ProjectService.js";
import StepModeSelect from './StepModeSelect';
import StepSettings from './StepSettings';
import StepEventEditor from './StepEventEditor';
import useCustomizerStore from '../../store/useCustomizerStore';

// 스타일 객체
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#495057', marginBottom: '5px', display: 'block' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '14px', outline: 'none' };
const btnStyle = { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '15px', transition: 'all 0.2s' };

export default function Customizer() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState('affection'); 
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    
    // 입력 상태
    const [loadId, setLoadId] = useState('');
    const [loadPw, setLoadPw] = useState('');
    const [newId, setNewId] = useState('');
    const [newPw, setNewPw] = useState('');
    const [newPwConfirm, setNewPwConfirm] = useState('');
    
    // 스토어 상태 및 액션
    const store = useCustomizerStore();
    const { setEvents, setProtagonist, setCharacters, setPFontStyle, setGlobalUi } = store;

    // --- 1. 다음 단계로 ---
    const handleNextStep = () => {
        if (currentStep === 1) {
            setShowAuthPopup(true);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    // --- 2. 기존 프로젝트 불러오기 (로그인) ---
    const handleLoadProject = async () => {
        if (!loadId || !loadPw) return alert('아이디와 비밀번호를 입력해주세요.');
        
        try {
            const response = await fetch(`/api/projects/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: loadId, pw: loadPw })
            });

            if (response.ok) {
                const data = await response.json(); 
                console.log("☁️ 클라우드 원본 데이터:", data);

                // ⭐ [핵심 안전장치] 어떤 데이터가 오든 { preview: "주소" } 객체로 변환
                const ensureImageObject = (img) => {
                    if (!img) return null;
                    // 이미 객체 형태({preview: ...})라면 그대로 반환, 문자열이라면 객체로 포장
                    if (typeof img === 'object' && img.preview) return img;
                    if (typeof img === 'string') return { preview: img };
                    return null;
                };

                // 1. 전역 설정 복구
                if (data.globalUi) setGlobalUi(data.globalUi);
                if (data.pFontStyle) setPFontStyle(data.pFontStyle);
                
                // 2. 주인공 복구
                if (data.protagonist) {
                    setProtagonist({
                        name: data.protagonist.name || "",
                        // 문자열 배열을 객체 배열로 강제 변환
                        images: (data.protagonist.images || []).map(ensureImageObject).filter(Boolean)
                    });
                }
                
                // 3. 등장인물 목록 복구
                if (data.characters) {
                    setCharacters(data.characters.map(c => ({
                        id: c.id,
                        name: c.name || "",
                        fontStyle: c.fontStyle || {},
                        // 각 캐릭터의 사진들도 객체 배열로 강제 변환
                        images: (c.images || []).map(ensureImageObject).filter(Boolean)
                    })));
                }

                // 4. 대사 스크립트 복구
                if (data.events) setEvents(data.events);
                
                alert('🎉 사진과 설정이 모두 정상적으로 로드되었습니다!');
                setShowAuthPopup(false);
                setCurrentStep(2); 
            } else {
                const err = await response.json();
                alert(err.message || '로그인 실패');
            }
        } catch (err) {
            console.error("로드 중 치명적 에러:", err);
            alert('데이터 로드 중 오류가 발생했습니다.');
        }
    };
    // --- 3. 새 프로젝트 생성 ---
    const handleCreateProject = async () => {
        if (!newId || !newPw || !newPwConfirm) return alert('모든 칸을 입력해주세요.');
        if (newPw !== newPwConfirm) return alert('비밀번호가 다릅니다.');
        
        try {
            const result = await saveProjectToServer(newId, newPw);
            if (result.success) {
                alert('🎉 새 프로젝트가 생성되었습니다!');
                setShowAuthPopup(false);
                setCurrentStep(2);
            }
        } catch (err) {
            alert('생성 실패: ' + (err.response?.data?.message || '서버 에러'));
        }
    };

    // --- 4. 통합 저장 (사진 + 스크립트 + HTML) ---
    const handleSave = async () => {
        const activeId = newId || loadId;
        if (!activeId) return alert("프로젝트 ID가 없습니다.");

        try {
            console.log("🚀 저장 프로세스 시작...");

            const captureArea = document.getElementById('capture-area');
            const htmlString = captureArea ? captureArea.innerHTML : document.body.innerHTML;

            const result = await uploadAndSaveProject(activeId, htmlString);
            
            if (result.success) {
                alert('💾 모든 데이터와 HTML 화면이 클라우드 폴더에 저장되었습니다!');
            }
        } catch (error) {
            alert('저장 오류 발생');
        }
    };

    return (
        <div id="capture-area" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>게임 커스터마이징</h1>
            <div style={{ marginBottom: '40px', color: '#888', fontWeight: 'bold' }}>Step {currentStep} / 5</div>

            {currentStep === 1 && <StepModeSelect selectedMode={selectedMode} onSelectMode={setSelectedMode} />}
            {currentStep === 2 && <StepSettings />}
            {currentStep === 3 && <StepEventEditor />}

            <div style={{ marginTop: '50px', display: 'flex', gap: '20px' }} data-html2canvas-ignore="true">
                {currentStep > 1 && <button onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '12px 30px', borderRadius: '8px', cursor: 'pointer' }}>⬅️ 이전</button>}
                {currentStep > 1 && <button onClick={handleSave} style={{ padding: '12px 30px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>💾 저장</button>}
                {currentStep < 5 && <button onClick={handleNextStep} style={{ padding: '12px 30px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>다음 단계로 ➡️</button>}
            </div>

            {/* 인증 모달 */}
            {showAuthPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', width: '750px', maxWidth: '90%', display: 'flex', position: 'relative' }}>
                        <button onClick={() => setShowAuthPopup(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✖</button>

                        <div style={{ flex: 1, paddingRight: '35px', borderRight: '1px solid #dee2e6' }}>
                            <h3 style={{ color: '#1971c2' }}>📂 기존 프로젝트 불러오기</h3>
                            <label style={labelStyle}>프로젝트 ID</label>
                            <input type="text" value={loadId} onChange={(e) => setLoadId(e.target.value)} style={inputStyle} />
                            <label style={labelStyle}>비밀번호</label>
                            <input type="password" value={loadPw} onChange={(e) => setLoadPw(e.target.value)} style={inputStyle} />
                            <button onClick={handleLoadProject} style={{...btnStyle, backgroundColor: '#1971c2', color: 'white'}}>데이터 로드하기</button>
                        </div>

                        <div style={{ flex: 1, paddingLeft: '35px' }}>
                            <h3 style={{ color: '#2b8a3e' }}>🆕 새 프로젝트 생성하기</h3>
                            <label style={labelStyle}>사용할 ID</label>
                            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} style={inputStyle} />
                            <label style={labelStyle}>비밀번호</label>
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} />
                            <input type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} style={inputStyle} placeholder="비밀번호 확인" />
                            <button onClick={handleCreateProject} style={{...btnStyle, backgroundColor: '#2b8a3e', color: 'white'}}>ID 생성 및 시작</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}