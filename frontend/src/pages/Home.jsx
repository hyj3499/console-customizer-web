import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 🖥️ 바탕화면 아이콘 컴포넌트
// 🖥️ 바탕화면 아이콘 컴포넌트 (파일 상단)
function DesktopIcon({ iconPath, label, onDoubleClick }) { // 👈 이름을 iconPath로 통일!
    const [isSelected, setIsSelected] = useState(false);

    return (
        <div 
            onClick={() => setIsSelected(true)}
            onDoubleClick={onDoubleClick}
            onBlur={() => setIsSelected(false)}
            tabIndex={0}
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
            <img 
                src={iconPath} // 👈 여기서도 iconPath를 사용합니다
                alt={label} 
                style={{ 
                    width: '32px', 
                    height: '32px', 
                    imageRendering: 'pixelated',
                    filter: isSelected ? 'brightness(0.8) contrast(1.2)' : 'none' 
                }}
                // 이미지가 정말 안 나올 때 콘솔에 에러를 찍어줍니다
                onError={(e) => console.error(`${label} 이미지 로드 실패:`, iconPath)}
            />
            <div style={{ 
                color: isSelected ? '#ffffff' : '#5d4037',
                backgroundColor: isSelected ? 'var(--win95-title-active-blue-start)' : 'transparent',
                padding: '2px 4px', 
                fontSize: '12px', 
                textAlign: 'center', 
                border: isSelected ? '1px dotted #ffffff' : '1px dotted transparent',
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
            backgroundColor: 'var(--win95-desktop-teal)', /* 파스텔 청록색 바탕화면 */
            position: 'relative', 
            overflow: 'hidden', 
            fontFamily: "'DOSGothic', monospace",
            userSelect: 'none'
        }}>
            
            {/* 📁 좌측 바탕화면 바로가기 아이콘들 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '20px', position: 'absolute', top: '10px', left: 0 }}>
                {/* public/images 폴더에 해당 파일들이 있어야 합니다! */}
                <DesktopIcon iconPath="/images/computer.png" label="내 컴퓨터" />
                <DesktopIcon iconPath="/images/trashcan.png" label="휴지통" />
                <DesktopIcon iconPath="/images/newfolder.png" label="새 폴더" />
                <DesktopIcon 
                    iconPath="/images/game.png" // 게임 아이콘 파일명에 맞게 수정하세요
                    label="최애로운_생활.exe" 
                    onDoubleClick={() => navigate('/customizer')} 
                />
            </div>

            {/* 🪟 화면 중앙에 뜬 설치 프로그램 창 */}
            <div className="win95-window" style={{ 
                position: 'absolute', 
                top: '45%', left: '50%', 
                transform: 'translate(-50%, -50%)', 
                width: '90%', maxWidth: '450px', 
                boxShadow: '4px 4px 15px rgba(199, 139, 155, 0.4)' // 그림자도 약간 핑크빛으로 부드럽게
            }}>
                {/* 인라인 색상을 지우고 index.css의 win95-title-bar 클래스에 스타일을 맡깁니다 */}
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>최애로운_생활.exe</span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>

                {/* backgroundColor를 CSS 변수로 변경 */}
                <div className="win95-window-inner" style={{ backgroundColor: 'var(--win95-base-gray)', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* 로고 이미지가 픽셀아트라면 pixelated 유지 */}
                    <img src="/images/logo.png" alt="로고" style={{ width: '200px', marginBottom: '20px', imageRendering: 'pixelated' }} />
                    <h2 style={{ fontSize: '18px', color: '#5d4037', marginBottom: '10px' }}>커스텀 비쥬얼 노벨 게임 제작하기</h2>
                    <p style={{ fontSize: '13px', color: '#5d4037', marginBottom: '30px', lineHeight: '1.5' }}>
                        바탕화면의 [최애로운_생활.exe]를 더블클릭 하거나,<br/>
                        아래 [게임 제작] 버튼을 눌러주십시오.
                    </p>
                    <button 
                        className="win95-button" 
                        onClick={() => navigate('/customizer')} 
                        style={{ padding: '8px 25px', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        게임 제작(N) {'>'}
                    </button>
                </div>
            </div>

            {/* 🏁 하단 작업 표시줄 (Taskbar) */}
            <div style={{ 
                position: 'fixed', bottom: 0, left: 0, width: '100%', height: '32px', 
                backgroundColor: 'var(--win95-base-gray)', 
                borderTop: '2px solid var(--win95-highlight-gray)', 
                borderBottom: '2px solid var(--win95-dark-shadow-black)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '2px', zIndex: 1000
            }}>
                <div style={{ display: 'flex', gap: '5px', height: '100%' }}>
                    {/* 시작 버튼 */}
                    <button className="win95-button" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', fontWeight: 'bold', height: '100%' }}>
                        <span style={{ fontSize: '14px', color: '#5d4037' }}>⊞ 시작</span>
                    </button>
                    {/* 열려있는 프로그램 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', 
                        borderTop: '2px solid var(--win95-dark-shadow-black)', 
                        borderLeft: '2px solid var(--win95-dark-shadow-black)', 
                        borderRight: '2px solid var(--win95-highlight-gray)', 
                        borderBottom: '2px solid var(--win95-highlight-gray)', 
                        backgroundColor: 'var(--win95-content-white)', 
                        height: '100%', fontWeight: 'bold', color: '#5d4037', fontSize: '12px' 
                    }}>
                        최애로운_생활.exe
                    </div>
                </div>

                {/* 우측 시스템 트레이 (시계) */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', padding: '0 10px', 
                    borderTop: '2px solid var(--win95-light-shadow-gray)', 
                    borderLeft: '2px solid var(--win95-light-shadow-gray)', 
                    borderRight: '2px solid var(--win95-highlight-gray)', 
                    borderBottom: '2px solid var(--win95-highlight-gray)',
                    backgroundColor: 'var(--win95-base-gray)', height: '100%', fontSize: '12px', color: '#5d4037', marginRight: '2px'
                }}>
                    🔊 {formattedTime}
                </div>
            </div>
        </div>
    );
}