import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 🖥️ 바탕화면 아이콘 컴포넌트
function DesktopIcon({ icon, label, onDoubleClick }) {
    const [isSelected, setIsSelected] = useState(false);

    return (
        <div 
            onClick={() => setIsSelected(true)}
            onDoubleClick={onDoubleClick}
            onBlur={() => setIsSelected(false)}
            tabIndex={0} // 포커스를 받을 수 있게 설정
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                width: '80px', 
                cursor: 'pointer', 
                gap: '4px',
                outline: 'none'
            }}
        >
            <div style={{ fontSize: '32px', filter: isSelected ? 'brightness(0.5) sepia(1) hue-rotate(180deg) saturate(3)' : 'none' }}>
                {icon}
            </div>
            <div style={{ 
                color: 'white', 
                backgroundColor: isSelected ? '#000080' : 'transparent', 
                padding: '2px 4px', 
                fontSize: '12px', 
                textAlign: 'center', 
                border: isSelected ? '1px dotted white' : '1px dotted transparent',
                fontFamily: "'DOSGothic', monospace",
                lineHeight: '1.2'
            }}>
                {label}
            </div>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());

    // ⏰ 하단 작업표시줄 시계 타이머
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'var(--win95-desktop-teal)', /* 청록색 바탕화면 */
            position: 'relative', 
            overflow: 'hidden', 
            fontFamily: "'DOSGothic', monospace",
            userSelect: 'none'
        }}>
            
            {/* 📁 좌측 바탕화면 바로가기 아이콘들 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '20px', position: 'absolute', top: 0, left: 0 }}>
                <DesktopIcon icon="💻" label="내 컴퓨터" />
                <DesktopIcon icon="🗑️" label="휴지통" />
                <DesktopIcon icon="📁" label="새 폴더" />
                {/* ⭐ 진짜로 넘어가는 게임 실행 아이콘 (더블클릭!) */}
                <DesktopIcon 
                    icon="🎮" 
                    label="코드네임_최애.exe" 
                    onDoubleClick={() => navigate('/customizer')} 
                />
            </div>

            {/* 🪟 화면 중앙에 뜬 설치 프로그램 창 */}
            <div className="win95-window" style={{ 
                position: 'absolute', 
                top: '45%', left: '50%', 
                transform: 'translate(-50%, -50%)', 
                width: '90%', maxWidth: '450px', 
                boxShadow: '2px 2px 10px rgba(0,0,0,0.5)' 
            }}>
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(to right, #000080, #1084d0)', padding: '4px 8px', color: 'white' }}>
                    <span style={{ fontWeight: 'bold' }}>Setup.exe</span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>

                <div className="win95-window-inner" style={{ backgroundColor: '#c0c0c0', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src="/images/logo.png" alt="로고" style={{ width: '200px', marginBottom: '20px', imageRendering: 'pixelated' }} />
                    <h2 style={{ fontSize: '18px', color: '#000', marginBottom: '10px' }}>콘솔 커스텀 설치 마법사</h2>
                    <p style={{ fontSize: '13px', color: '#000', marginBottom: '30px', lineHeight: '1.5' }}>
                        바탕화면의 [코드네임_최애.exe]를 더블클릭 하거나,<br/>
                        아래 [설치 시작] 버튼을 눌러주십시오.
                    </p>
                    <button 
                        className="win95-button" 
                        onClick={() => navigate('/customizer')} 
                        style={{ padding: '8px 25px', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        설치 시작(N) {'>'}
                    </button>
                </div>
            </div>

            {/* 🏁 하단 작업 표시줄 (Taskbar) */}
            <div style={{ 
                position: 'fixed', bottom: 0, left: 0, width: '100%', height: '32px', 
                backgroundColor: '#c0c0c0', 
                borderTop: '2px solid #fff', borderBottom: '2px solid #000',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '2px', zIndex: 1000
            }}>
                <div style={{ display: 'flex', gap: '5px', height: '100%' }}>
                    {/* 시작 버튼 */}
                    <button className="win95-button" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', fontWeight: 'bold', height: '100%' }}>
                        <span style={{ fontSize: '14px', color: '#000' }}>⊞ 시작</span>
                    </button>
                    {/* 열려있는 프로그램 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', 
                        borderTop: '2px solid #000', borderLeft: '2px solid #000', 
                        borderRight: '2px solid #fff', borderBottom: '2px solid #fff', 
                        backgroundColor: '#dfdfdf', height: '100%', fontWeight: 'bold', color: '#000', fontSize: '12px' 
                    }}>
                        Setup.exe
                    </div>
                </div>

                {/* 우측 시스템 트레이 (시계) */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', padding: '0 10px', 
                    borderTop: '2px solid #808080', borderLeft: '2px solid #808080', 
                    borderRight: '2px solid #fff', borderBottom: '2px solid #fff',
                    backgroundColor: '#c0c0c0', height: '100%', fontSize: '12px', color: '#000', marginRight: '2px'
                }}>
                    🔊 {formattedTime}
                </div>
            </div>
        </div>
    );
}