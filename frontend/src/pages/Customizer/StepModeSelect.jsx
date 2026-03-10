// src/pages/Customizer/components/StepModeSelect.jsx

const GAME_MODES = [
    {
        id: 'affection',
        title: '호감도 모드 💕',
        description: '선택지에 따라 캐릭터의 호감도가 오르내리는 정통 연애 시뮬레이션 방식입니다.',
    },
    {
        id: 'scenario',
        title: '시나리오 모드 📖',
        description: '선택지 없이 준비된 탄탄한 스토리를 감상하는 비주얼 노벨 방식입니다.',
    },
];

export default function StepModeSelect({ selectedMode, onSelectMode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '10px' }}>어떤 방식의 게임을 만들까요?</h2>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                원하는 게임 진행 방식을 선택해 주세요. (나중에도 변경할 수 있습니다)
            </p>

            <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                {GAME_MODES.map((mode) => {
                    const isSelected = selectedMode === mode.id;

                    return (
                        <div 
                            key={mode.id}
                            onClick={() => onSelectMode(mode.id)}
                            style={{
                                flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px 20px',
                                borderRadius: '15px', cursor: 'pointer', transition: 'all 0.2s',
                                border: isSelected ? '3px solid #646cff' : '2px solid #ddd',
                                backgroundColor: isSelected ? '#f0f4ff' : 'white',
                                textAlign: 'center',
                                boxShadow: isSelected ? '0 4px 15px rgba(100, 108, 255, 0.2)' : 'none'
                            }}
                        >
                            <h3 style={{ marginTop: '0', color: isSelected ? '#646cff' : '#333' }}>
                                {mode.title}
                            </h3>
                            <p style={{ margin: '0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                                {mode.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}