// ==============================================================================
// 📄 파일 경로 : src/pages/Customizer/index.jsx
// 🎯 주요 역할 : 게임 커스터마이징 기능의 '메인 부모 컴포넌트 (관제탑)'
// ==============================================================================

import { useState } from 'react';
import { saveProjectToServer, uploadAndSaveProject } from "../../services/ProjectService.js";
import StepModeSelect from './StepModeSelect';
import StepSettings from './StepSettings';
import StepEventEditor from './StepEventEditor';
import StepStartMenu from './StepStartMenu'; // ✅ Step 4 컴포넌트 추가
import useCustomizerStore from '../../store/useCustomizerStore';

// 🎨 공통 UI 스타일 정의
const STYLES = {
    label: { fontSize: '12px', fontWeight: 'bold', color: '#495057', marginBottom: '5px', display: 'block' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '14px', outline: 'none' },
    btnBase: { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '15px', transition: 'all 0.2s' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }
};

// 💡 추가된 도우미 함수: 현재 시나리오가 엔딩으로 꽉 차있는지 검사합니다.
const checkIsFullyEnded = (scenarios) => {
    if (!scenarios || scenarios.length === 0) return false;
    
    const hasChoiceNode = scenarios.some(s => s.type === 'choice');
    const isMainEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
    const isOption1Ended = scenarios.some(s => s.branch === 'option1' && s.type === 'ending');
    const isOption2Ended = scenarios.some(s => s.branch === 'option2' && s.type === 'ending');
    
    return hasChoiceNode ? (isOption1Ended && isOption2Ended) : isMainEnded;
};

export default function Customizer() {
    // --------------------------------------------------------
    // 1. 컴포넌트 상태 (State) 관리
    // --------------------------------------------------------
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState('affection'); 
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    
    const [loadId, setLoadId] = useState('');
    const [loadPw, setLoadPw] = useState('');
    const [newId, setNewId] = useState('');
    const [newPw, setNewPw] = useState('');
    const [newPwConfirm, setNewPwConfirm] = useState('');
    
    const store = useCustomizerStore();
    const { 
        setEvents, setProtagonist, setCharacters, setPFontStyle, 
        setGlobalUi, setStartMenu, addCustomFont 
    } = store;

    // --------------------------------------------------------
    // 2. 단계 이동 핸들러
    // --------------------------------------------------------
    const handleNextStep = () => {
        if (currentStep === 1) {
            setShowAuthPopup(true);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    // --------------------------------------------------------
    // 3. 기존 프로젝트 불러오기 (연동 로직 업데이트 🌟)
    // --------------------------------------------------------
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
                console.log("☁️ 클라우드 데이터 로드 완료:", data);

                // ⭐ 이미지 정규화 헬퍼
                const ensureImageObject = (img) => {
                    if (!img) return null;
                    if (typeof img === 'object' && img.preview) return img;
                    if (typeof img === 'string') return { preview: img };
                    return null;
                };

                // ✅ 폰트 복원
                if (data.customFonts && data.customFonts.length > 0) {
                    data.customFonts.forEach(font => {
                        const newFont = new FontFace(font.name, `url(${font.url})`);
                        newFont.load().then(loaded => {
                            document.fonts.add(loaded);
                            addCustomFont(font.name, font.url, null); 
                        });
                    });
                }

                // ✅ 시작 메뉴 데이터 복원 및 이미지 정규화
                if (data.startMenu) {
                    setStartMenu({
                        ...data.startMenu,
                        bgImage: ensureImageObject(data.startMenu.bgImage)
                    });
                }

                // ✅ 기본 UI 및 캐릭터 데이터 복원
                if (data.globalUi) setGlobalUi(data.globalUi);
                if (data.pFontStyle) setPFontStyle(data.pFontStyle);
                
                if (data.protagonist) {
                    setProtagonist({
                        name: data.protagonist.name || "",
                        images: (data.protagonist.images || []).map(ensureImageObject).filter(Boolean)
                    });
                }
                
                if (data.characters) {
                    setCharacters(data.characters.map(c => ({
                        ...c,
                        images: (c.images || []).map(ensureImageObject).filter(Boolean)
                    })));
                }

                if (data.events) setEvents(data.events);
                
                alert('🎉 데이터 로드 성공! 화면으로 이동합니다.');
                setShowAuthPopup(false);
                setCurrentStep(2); 
            } else {
                const err = await response.json();
                alert(err.message || '로그인 실패');
            }
        } catch (err) {
            console.error("로드 에러:", err);
            alert('데이터 로드 중 통신 오류가 발생했습니다.');
        }
    };

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

    const handleSave = async () => {
        const activeId = newId || loadId;
        if (!activeId) return alert("프로젝트 ID를 찾을 수 없습니다.");

        const state = useCustomizerStore.getState();
        const activeEvent = state.events.find(ev => ev.id === state.activeEventId);
        
        // 🚨 방어 로직 추가: activeEvent와 scenarios가 안전하게 존재하는지 확인 후 실행합니다.
        if (activeEvent && activeEvent.scenarios) {
            // 엔딩 도달 여부 체크 (위의 checkIsFullyEnded 함수 로직 활용)
            if (checkIsFullyEnded(activeEvent.scenarios)) {
                const nextEvents = state.events.filter(ev => ev.id > state.activeEventId);
                if (nextEvents.length > 0) {
                    alert(`⚠️ 여기가 마지막 이벤트입니다! 이후의 ${nextEvents.length}개 이벤트는 실제 게임에 적용되지 않습니다.`);
                }
            }
        }

        try {
            console.log("🚀 클라우드 저장 프로세스 시작...");
            const captureArea = document.getElementById('capture-area');
            const htmlString = captureArea ? captureArea.innerHTML : document.body.innerHTML;

            const result = await uploadAndSaveProject(activeId, htmlString);
            
            if (result.success) {
                alert('💾 [저장 완료] 모든 데이터와 이미지가 클라우드에 안전하게 보관되었습니다!');
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    return (
        <div id="capture-area" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#fdfdfd' }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>🎨 Codename: Choiae Customizer</h1>
            <div style={{ marginBottom: '40px', color: '#1971c2', fontWeight: 'bold', fontSize: '18px' }}>
                Step {currentStep} / 5
            </div>

            {/* 단계별 컴포넌트 렌더링 */}
            {currentStep === 1 && <StepModeSelect selectedMode={selectedMode} onSelectMode={setSelectedMode} />}
            {currentStep === 2 && <StepSettings />}
            {currentStep === 3 && <StepEventEditor />}
            {currentStep === 4 && <StepStartMenu />} {/* ✅ Step 4 연결 */}

            {/* 네비게이션 바 */}
            <div style={{ marginTop: '50px', display: 'flex', gap: '20px' }} data-html2canvas-ignore="true">
                {currentStep > 1 && (
                    <button onClick={() => setCurrentStep(prev => prev - 1)} style={{ padding: '12px 30px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                        ⬅️ 이전
                    </button>
                )}
                {currentStep > 1 && (
                    <button onClick={handleSave} style={{ padding: '12px 30px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        💾 현재 상태 저장
                    </button>
                )}
                {currentStep < 5 && (
                    <button onClick={handleNextStep} style={{ padding: '12px 30px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        다음 단계로 ➡️
                    </button>
                )}
            </div>

            {/* 계정 인증 모달 */}
            {showAuthPopup && (
                <div style={STYLES.overlay}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '45px', width: '780px', maxWidth: '95%', display: 'flex', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowAuthPopup(false)} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#adb5bd' }}>&times;</button>

                        <div style={{ flex: 1, paddingRight: '40px', borderRight: '1px solid #f1f3f5' }}>
                            <h3 style={{ color: '#1971c2', marginBottom: '25px' }}>📂 프로젝트 불러오기</h3>
                            <label style={STYLES.label}>프로젝트 ID</label>
                            <input type="text" value={loadId} onChange={(e) => setLoadId(e.target.value)} style={STYLES.input} />
                            <label style={STYLES.label}>비밀번호</label>
                            <input type="password" value={loadPw} onChange={(e) => setLoadPw(e.target.value)} style={STYLES.input} />
                            <button onClick={handleLoadProject} style={{...STYLES.btnBase, backgroundColor: '#1971c2', color: 'white'}}>데이터 로드하기</button>
                        </div>

                        <div style={{ flex: 1, paddingLeft: '40px' }}>
                            <h3 style={{ color: '#2b8a3e', marginBottom: '25px' }}>🆕 새 프로젝트 시작</h3>
                            <label style={STYLES.label}>사용할 ID</label>
                            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} style={STYLES.input} />
                            <label style={STYLES.label}>비밀번호 설정</label>
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={STYLES.input} />
                            <input type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} style={STYLES.input} />
                            <button onClick={handleCreateProject} style={{...STYLES.btnBase, backgroundColor: '#2b8a3e', color: 'white'}}>ID 생성 및 시작</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}