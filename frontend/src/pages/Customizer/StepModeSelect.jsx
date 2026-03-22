// src/pages/Customizer/components/StepModeSelect.jsx

const GAME_MODES = [
    {
        id: 'affection',
        title: '육성 모드 (개발 중) 🛠️', // 🌟 제목 변경
        description: '교육, 알바, 휴식! 꼼꼼한 스케줄 관리를 통해 최애의 다양한 엔딩이 존재합니다!', // 🌟 설명 변경
        isLocked: true // 🌟 개발 중임을 나타내는 플래그 추가
    },
    {
        id: 'scenario',
        title: '시나리오 모드 📖',
        description: '선택지에 따라 다양한 엔딩이 있는 탄탄한 스토리를 감상하는 미연시/비주얼 노벨 방식입니다.',
        isLocked: false
    },
];

export default function StepModeSelect({ selectedMode, onSelectMode }) {
    
    // 🌟 모드 선택 핸들러
    const handleModeClick = (mode) => {
        if (mode.isLocked) {
            // 개발 중인 모드 클릭 시 팝업 출력
            alert('현재 개발 중인 모드입니다! \n시나리오 모드를 이용해 주세요. 😊');
            return;
        }
        onSelectMode(mode.id);
    };

    return (
        <div className="win95-window" style={{ width: '100%', maxWidth: '800px', margin: '20px auto' }}>
            <div className="win95-title-bar">
                <span className="win95-title-bar-text">System Configuration - Select Mode</span>
            </div>

            <div className="win95-window-inner" style={{ padding: '20px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '10px', color: '#000' }}>어떤 방식의 게임을 만들까요?</h2>
                <p style={{ color: '#444', marginBottom: '30px', fontSize: '13px' }}>
                    원하는 게임 진행 방식을 선택해 주세요.
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {GAME_MODES.map((mode) => {
                        const isSelected = selectedMode === mode.id;

                        return (
                            <div 
                                key={mode.id}
                                onClick={() => handleModeClick(mode)} // 🌟 수정된 핸들러 사용
                                className={isSelected ? 'win95-bevel-inset' : 'win95-button'}
                                style={{
                                    flex: '1', minWidth: '250px', maxWidth: '300px', 
                                    padding: '20px', cursor: 'pointer',
                                    // 🌟 개발 중인 모드는 약간 흐리게(Grayscale) 처리하여 시각적 구분
                                    filter: mode.isLocked ? 'grayscale(0.8)' : 'none',
                                    opacity: mode.isLocked ? 0.7 : 1,
                                    backgroundColor: isSelected ? '#ffffff' : 'var(--win95-base-gray)',
                                    transform: isSelected ? 'translate(1px, 1px)' : 'none'
                                }}
                            >
                                <h3 style={{ 
                                    marginTop: '0', 
                                    color: isSelected ? 'var(--win95-title-active-blue-start)' : '#000',
                                    textDecoration: isSelected ? 'underline' : 'none'
                                }}>
                                    {mode.id === 'affection' && isSelected ? '▶ ' : ''}{mode.title}
                                </h3>
                                <p style={{ margin: '0', fontSize: '12px', color: '#000', lineHeight: '1.4' }}>
                                    {mode.description}
                                </p>
                                {mode.isLocked && (
                                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#d6336c', fontWeight: 'bold' }}>
                                        [COMING SOON]
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}