// ==============================================================================
// 📄 파일 경로 : src/pages/Customizer/index.jsx
// 🎯 주요 역할 : 게임 커스터마이징 기능의 '메인 부모 컴포넌트 (관제탑)'
//
// 💡 상세 기능 :
//   1. 화면 전환: Step 1(모드), Step 2(설정), Step 3(대사 에디터) 화면을 교체하며 보여줌.
//   2. 데이터 로드 (Load): 클라우드(R2)에 저장된 data.json을 불러와서 Zustand 스토어에 세팅.
//      * 핵심 로직: 불러온 '문자열(URL)' 데이터를 리액트가 읽을 수 있는 '{ preview } 객체'로 정규화(변환).
//   3. 프로젝트 생성 (Create): 새 ID와 PW를 백엔드에 전송하여 폴더 생성.
//   4. 데이터 저장 (Save): 현재까지 작업한 스토어 데이터와 화면(HTML)을 ProjectService로 넘겨 클라우드에 저장.
// ==============================================================================

import { useState } from 'react';
import { saveProjectToServer, uploadAndSaveProject } from "../../services/ProjectService.js";
import StepModeSelect from './StepModeSelect';
import StepSettings from './StepSettings';
import StepEventEditor from './StepEventEditor';
import useCustomizerStore from '../../store/useCustomizerStore';

// 🎨 공통 UI 스타일 정의 (코드 가독성을 위해 상단에 분리)
const STYLES = {
    label: { fontSize: '12px', fontWeight: 'bold', color: '#495057', marginBottom: '5px', display: 'block' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '14px', outline: 'none' },
    btnBase: { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '15px', transition: 'all 0.2s' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }
};

export default function Customizer() {
    // --------------------------------------------------------
    // 1. 컴포넌트 상태 (State) 관리
    // --------------------------------------------------------
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState('affection'); 
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    
    // 모달창 입력폼 상태
    const [loadId, setLoadId] = useState('');
    const [loadPw, setLoadPw] = useState('');
    const [newId, setNewId] = useState('');
    const [newPw, setNewPw] = useState('');
    const [newPwConfirm, setNewPwConfirm] = useState('');
    
    // Zustand 전역 상태 저장소 (Store) 가져오기
    const store = useCustomizerStore();
    const { setEvents, setProtagonist, setCharacters, setPFontStyle, setGlobalUi } = store;

    // --------------------------------------------------------
    // 2. 단계 이동 핸들러
    // --------------------------------------------------------
    const handleNextStep = () => {
        // Step 1에서 Step 2로 갈 때는 반드시 프로젝트 로그인/생성 모달을 띄움
        if (currentStep === 1) {
            setShowAuthPopup(true);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    // --------------------------------------------------------
    // 3. 기존 프로젝트 불러오기 (핵심 로직 🌟)
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

                // ⭐ [데이터 정규화 함수] 
                // 클라우드에서 온 문자열 URL("https://...")을 리액트 UI가 인식하는 객체({preview: "..."})로 변환.
                // 이 함수 덕분에 Step2, Step3 화면에서 이미지가 깨지지 않습니다.
                const ensureImageObject = (img) => {
                    if (!img) return null;
                    if (typeof img === 'object' && img.preview) return img; // 직접 업로드 상태 유지
                    if (typeof img === 'string') return { preview: img };   // 클라우드 URL 변환
                    return null;
                };

                // 스토어(전역 상태)에 데이터 복원
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

    // --------------------------------------------------------
    // 4. 새 프로젝트 생성
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // 5. 전체 데이터 클라우드 저장
    // --------------------------------------------------------
    const handleSave = async () => {
        const activeId = newId || loadId;
        if (!activeId) return alert("프로젝트 ID를 찾을 수 없습니다.");

        try {
            console.log("🚀 클라우드 저장 프로세스 시작...");
            // 현재 화면의 UI를 캡처하기 위해 HTML 구조를 추출
            const captureArea = document.getElementById('capture-area');
            const htmlString = captureArea ? captureArea.innerHTML : document.body.innerHTML;

            // ProjectService로 넘겨서 Blob 이미지 치환 및 서버 전송 진행
            const result = await uploadAndSaveProject(activeId, htmlString);
            
            if (result.success) {
                alert('💾 [저장 완료] 모든 데이터와 이미지가 클라우드에 안전하게 보관되었습니다!');
            }
        } catch (error) {
            console.error("저장 실패:", error);
            alert('저장 중 오류가 발생했습니다. 개발자 도구를 확인해주세요.');
        }
    };

    // --------------------------------------------------------
    // 6. UI 렌더링
    // --------------------------------------------------------
    return (
        <div id="capture-area" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#fdfdfd' }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>🎨 Codename: Choiae Customizer</h1>
            <div style={{ marginBottom: '40px', color: '#1971c2', fontWeight: 'bold', fontSize: '18px' }}>
                Step {currentStep} / 5
            </div>

            {/* 현재 단계에 맞는 하위 컴포넌트 출력 */}
            {currentStep === 1 && <StepModeSelect selectedMode={selectedMode} onSelectMode={setSelectedMode} />}
            {currentStep === 2 && <StepSettings />}
            {currentStep === 3 && <StepEventEditor />}

            {/* 하단 네비게이션 컨트롤 바 */}
            <div style={{ marginTop: '50px', display: 'flex', gap: '20px' }} data-html2canvas-ignore="true">
                {currentStep > 1 && (
                    <button onClick={() => setCurrentStep(prev => prev - 1)} style={{ padding: '12px 30px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                        ⬅️ 이전
                    </button>
                )}
                {currentStep > 1 && (
                    <button onClick={handleSave} style={{ padding: '12px 30px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(32, 201, 151, 0.2)' }}>
                        💾 현재 상태 저장
                    </button>
                )}
                {currentStep < 5 && (
                    <button onClick={handleNextStep} style={{ padding: '12px 30px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(100, 108, 255, 0.2)' }}>
                        다음 단계로 ➡️
                    </button>
                )}
            </div>

            {/* 계정 인증 모달 팝업 (불러오기 / 신규생성) */}
            {showAuthPopup && (
                <div style={STYLES.overlay}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '45px', width: '780px', maxWidth: '95%', display: 'flex', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowAuthPopup(false)} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#adb5bd' }}>&times;</button>

                        {/* 왼쪽: 데이터 불러오기 */}
                        <div style={{ flex: 1, paddingRight: '40px', borderRight: '1px solid #f1f3f5' }}>
                            <h3 style={{ color: '#1971c2', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>📂 프로젝트 불러오기</h3>
                            <label style={STYLES.label}>프로젝트 ID</label>
                            <input type="text" value={loadId} onChange={(e) => setLoadId(e.target.value)} style={STYLES.input} placeholder="ID를 입력하세요" />
                            
                            <label style={STYLES.label}>비밀번호</label>
                            <input type="password" value={loadPw} onChange={(e) => setLoadPw(e.target.value)} style={STYLES.input} placeholder="••••••" />
                            
                            <button onClick={handleLoadProject} style={{...STYLES.btnBase, backgroundColor: '#1971c2', color: 'white'}}>데이터 로드하기</button>
                        </div>

                        {/* 오른쪽: 새 프로젝트 생성 */}
                        <div style={{ flex: 1, paddingLeft: '40px' }}>
                            <h3 style={{ color: '#2b8a3e', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>🆕 새 프로젝트 시작</h3>
                            <label style={STYLES.label}>사용할 ID</label>
                            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} style={STYLES.input} placeholder="새 ID 입력" />
                            
                            <label style={STYLES.label}>비밀번호 설정</label>
                            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={STYLES.input} placeholder="••••••" />
                            <input type="password" value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)} style={STYLES.input} placeholder="비밀번호 재입력" />
                            
                            <button onClick={handleCreateProject} style={{...STYLES.btnBase, backgroundColor: '#2b8a3e', color: 'white'}}>ID 생성 및 시작</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}