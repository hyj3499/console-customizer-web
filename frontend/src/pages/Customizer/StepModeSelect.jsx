// src/pages/Customizer/components/StepModeSelect.jsx

// ⭐ 나중에 새로운 모드가 생기면 이 배열에 객체만 하나 쏙 추가하면 됩니다!
// UI 코드는 전혀 건드릴 필요가 없습니다.
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
    // 예시: 나중에 아래 주석만 풀면 3번째 모드가 자동으로 화면에 나타납니다.
    // {
    //     id: 'raising',
    //     title: '육성 모드 🎓',
    //     description: '스탯을 올리고 일정 기간 동안 캐릭터를 성장시키는 방식입니다.',
    // }
];

export default function StepModeSelect({ selectedMode, onSelectMode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '10px' }}>어떤 방식의 게임을 만들까요?</h2>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                원하는 게임 진행 방식을 선택해 주세요. (나중에도 변경할 수 있습니다)
            </p>

            {/* 모드 선택 버튼들을 나열하는 공간 */}
            <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                {GAME_MODES.map((mode) => {
                    // 현재 이 박스가 선택된 상태인지 확인
                    const isSelected = selectedMode === mode.id;

                    return (
                        <div 
                            key={mode.id}
                            onClick={() => onSelectMode(mode.id)}
                            style={{
                                flex: '1',
                                minWidth: '250px',
                                maxWidth: '300px',
                                padding: '30px 20px',
                                borderRadius: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                // 선택되었을 때와 아닐 때의 테두리 및 배경색 다르게 주기
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