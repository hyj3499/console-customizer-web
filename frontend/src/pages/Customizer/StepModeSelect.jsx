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
        /* 전체 컨테이너를 윈도우 창처럼 감쌉니다 */
        <div className="win95-window" style={{ width: '100%', maxWidth: '800px', margin: '20px auto' }}>
            {/* 타이틀 바 추가 (진짜 윈도우 느낌!) */}
            <div className="win95-title-bar">
                <span className="win95-title-bar-text">System Configuration - Select Mode</span>
            </div>

            <div className="win95-window-inner" style={{ padding: '20px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '10px', color: '#000' }}>어떤 방식의 게임을 만들까요?</h2>
                <p style={{ color: '#444', marginBottom: '30px', fontSize: '13px' }}>
                    원하는 게임 진행 방식을 선택해 주세요. (나중에도 변경할 수 있습니다)
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {GAME_MODES.map((mode) => {
                        const isSelected = selectedMode === mode.id;

                        return (
                            <div 
                                key={mode.id}
                                onClick={() => onSelectMode(mode.id)}
                                /* isSelected일 때는 '눌린(inset)' 느낌, 
                                   아닐 때는 '튀어나온(outset)' 느낌을 줍니다 
                                */
                                className={isSelected ? 'win95-bevel-inset' : 'win95-button'}
                                style={{
                                    flex: '1', minWidth: '250px', maxWidth: '300px', 
                                    padding: '20px', cursor: 'pointer',
                                    backgroundColor: isSelected ? '#ffffff' : 'var(--win95-base-gray)',
                                    /* 눌렸을 때 시각적 이동 효과 */
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}