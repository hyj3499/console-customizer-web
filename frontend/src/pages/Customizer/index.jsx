// src/pages/Customizer/index.jsx
import { useState } from 'react';
import StepModeSelect from './StepModeSelect';
import StepSettings from './StepSettings';
import StepEventEditor from './StepEventEditor'; // ⭐ 추가

export default function Customizer() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState('scenario');

    return (
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ marginBottom: '10px' }}>게임 커스터마이징</h1>
            <div style={{ marginBottom: '40px', color: '#888', fontWeight: 'bold' }}>
                현재 단계: Step {currentStep} / 5
            </div>

            {currentStep === 1 && <StepModeSelect selectedMode={selectedMode} onSelectMode={setSelectedMode} />}
            {currentStep === 2 && <StepSettings />}
            {currentStep === 3 && <StepEventEditor />} {/* ⭐ 3단계 연결 */}

            {/* 하단 이동 버튼 */}
            <div style={{ marginTop: '50px', display: 'flex', gap: '20px', width: '100%', maxWidth: '800px', justifyContent: 'center' }}>
                {currentStep > 1 && (
                    <button onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '12px 30px', fontSize: '18px', borderRadius: '8px', cursor: 'pointer' }}>⬅️ 이전</button>
                )}
                <button onClick={() => setCurrentStep(currentStep + 1)} style={{ padding: '12px 30px', fontSize: '18px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>다음 단계로 ➡️</button>
            </div>
        </div>
    );
}