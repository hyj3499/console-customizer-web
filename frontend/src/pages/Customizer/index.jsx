// src/pages/Customizer/index.jsx
import { useState } from 'react';
import StepModeSelect from './StepModeSelect';
import StepSettings from './StepSettings'; // ⭐ 추가: 2단계 부품 불러오기

export default function Customizer() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedMode, setSelectedMode] = useState('scenario');

    return (
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* ... 기존 헤더 영역 ... */}

            {/* 1단계 화면 */}
            {currentStep === 1 && (
                <StepModeSelect 
                    selectedMode={selectedMode} 
                    onSelectMode={(mode) => setSelectedMode(mode)} 
                />
            )}

            {/* ⭐ 2단계 화면 교체 (우리가 방금 만든 StepSettings 연결) */}
            {currentStep === 2 && (
                <StepSettings />
            )}

            {/* 하단 이동 버튼 영역 */}
            <div style={{ marginTop: '50px', display: 'flex', gap: '20px', width: '100%', maxWidth: '800px', justifyContent: 'center' }}>
                {currentStep > 1 && (
                    <button 
                        onClick={() => setCurrentStep(currentStep - 1)}
                        style={{ padding: '12px 30px', fontSize: '18px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        ⬅️ 이전
                    </button>
                )}
                
                <button 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    style={{ padding: '12px 30px', fontSize: '18px', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    다음 단계로 ➡️
                </button>
            </div>
        </div>
    );
}