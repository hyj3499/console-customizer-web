import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 🖥️ 바탕화면 아이콘 컴포넌트
function DesktopIcon({ iconPath, label, onDoubleClick }) {
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
                justifyContent: 'flex-start',
                width: '75px', 
                height: '75px', 
                cursor: 'pointer', 
                gap: '4px',
                outline: 'none',
                paddingTop: '5px'
            }}
        >
            <img 
                src={iconPath} 
                alt={label} 
                style={{ 
                    width: '32px', 
                    height: '32px', 
                    imageRendering: 'pixelated',
                    filter: isSelected ? 'brightness(0.7) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none' 
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ 
                color: isSelected ? '#ffffff' : '#5d4037',
                backgroundColor: isSelected ? 'var(--win95-title-active-blue-start)' : 'transparent',
                padding: '2px 4px', 
                fontSize: '11px', 
                textAlign: 'center', 
                border: isSelected ? '1px dotted #ffffff' : '1px dotted transparent',
                fontFamily: "'DOSGothic', monospace",
                lineHeight: '1.2',
                wordBreak: 'break-all',
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical'
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

    // 📂 아이콘 리스트 (list.txt 제거 완료)
    const iconList = [
        "this_computer", "recycle_bin_empty", "folder_closed", "3d_graphics_file",
        "3d_graphics_program", "aseprite", "aseprite_file", "audio_editor",
        "audio_file", "audio_music_file", "briefcase", "calculator",
        "calendar", "camera", "cd_drive", "chrome", "clock", "contact_book",
        "discord", "drive", "firefox", "flop_drive", "folder_dark",
        "folder_open", "games", "github", "image_editor", "image_file",
        "mail", "microphone", "minecraft", "movies", "music",
        "news", "notepad", "paint", "paint_alt", "parsec", "password_manager",
        "phone", "printer", "program", "recycle_bin_full", "rich_text_file",
        "script_file", "search", "slack", "sounds", "spreadsheet_file",
        "spreadsheet_program", "stardew_valley", "steam", "sticky_note",
        "text_editor", "text_file", "text_file_2", "tools", "video_editor",
        "video_file", "video_movie_editor", "vlc", "webpage_file", "workspace", "world"
    ];

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'var(--win95-desktop-teal)', 
            position: 'relative', 
            overflow: 'hidden', 
            fontFamily: "'DOSGothic', monospace",
            userSelect: 'none'
        }}>
            
            {/* 📁 실제 윈도우 스타일의 바탕화면 아이콘 그리드 */}
            <div style={{ 
                display: 'grid', 
                gridTemplateRows: 'repeat(auto-fill, 75px)', 
                gridAutoFlow: 'column', 
                height: 'calc(100vh - 40px)', 
                padding: '10px',
                columnGap: '15px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
            }}>
                {iconList.map((fileName) => {
                    // ⭐ 경로를 /images/icons/ 폴더로 일괄 변경했습니다!
                    const fullPath = `/images/icons/${fileName}.png`;
                    const displayLabel = fileName.replace(/_/g, ' ');

                    return (
                        <DesktopIcon 
                            key={fileName}
                            iconPath={fullPath} 
                            label={displayLabel} 
                            onDoubleClick={() => {
                                if (fileName === "games" || fileName === "minecraft" || fileName === "stardew_valley" || fileName === "program") {
                                    navigate('/customizer');
                                }
                            }}
                        />
                    );
                })}
            </div>

            {/* 📝 허전함을 채워줄 추가 창 1: README 메모장 */}
            <div className="win95-window" style={{ 
                position: 'absolute', 
                top: '15%', left: '12%', 
                width: '280px',
                boxShadow: '4px 4px 15px rgba(199, 139, 155, 0.4)',
                zIndex: 5 
            }}>
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--win95-title-inactive-gray)', color: 'var(--win95-dark-shadow-black)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <img src="/images/icons/notepad.png" alt="notepad" style={{ width: '14px', height: '14px', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'}/>
                        README.txt - 메모장
                    </span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', padding: '2px 5px', backgroundColor: 'var(--win95-base-gray)', borderBottom: '1px solid var(--win95-light-shadow-gray)', fontSize: '12px', color: '#5d4037' }}>
                    <span><u style={{textUnderlineOffset: '2px'}}>F</u>ile</span>
                    <span><u style={{textUnderlineOffset: '2px'}}>E</u>dit</span>
                    <span><u style={{textUnderlineOffset: '2px'}}>S</u>earch</span>
                    <span><u style={{textUnderlineOffset: '2px'}}>H</u>elp</span>
                </div>
                <div className="win95-window-inner" style={{ padding: 0, height: '180px' }}>
                    <textarea 
                        readOnly 
                        defaultValue={`환영합니다!\n\n이곳은 파스텔 톤으로 꾸며진\n귀여운 레트로 데스크톱입니다.\n\n수많은 아이콘들을 둘러보시고,\n중앙의 [최애로운_생활.exe]를 실행하여\n나만의 비주얼 노벨을 만들어보세요!\n\n♡ ٩(❛ᴗ❛)۶ ♡`}
                        style={{
                            width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none',
                            padding: '10px', fontFamily: "'DOSGothic', monospace", fontSize: '13px',
                            color: '#5d4037', backgroundColor: 'var(--win95-content-white)', lineHeight: '1.5'
                        }}
                    />
                </div>
            </div>

            {/* 💣 허전함을 채워줄 추가 창 2: 귀여운 지뢰찾기 */}
            <div className="win95-window" style={{ 
                position: 'absolute', 
                top: '10%', right: '10%', // 우측 상단에 배치
                width: '180px',
                boxShadow: '4px 4px 15px rgba(199, 139, 155, 0.4)',
                zIndex: 7 // 메모장보단 위, 메인창보단 아래
            }}>
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--win95-title-inactive-gray)', color: 'var(--win95-dark-shadow-black)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        💣 지뢰찾기
                    </span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', padding: '2px 5px', backgroundColor: 'var(--win95-base-gray)', borderBottom: '1px solid var(--win95-light-shadow-gray)', fontSize: '12px', color: '#5d4037' }}>
                    <span>Game</span>
                    <span>Help</span>
                </div>
                <div className="win95-window-inner" style={{ backgroundColor: 'var(--win95-base-gray)', padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    {/* 상단 스코어 보드 */}
                    <div style={{ 
                        width: '100%', display: 'flex', justifyContent: 'space-between', padding: '4px',
                        borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)',
                        borderBottom: '2px solid var(--win95-highlight-gray)', borderRight: '2px solid var(--win95-highlight-gray)'
                    }}>
                        <div style={{ color: '#ff8eb3', fontFamily: 'monospace', fontSize: '18px', backgroundColor: '#000', padding: '0 4px', letterSpacing: '2px' }}>010</div>
                        <button className="win95-button" style={{ minWidth: '26px', padding: '2px', fontSize: '16px' }}>😊</button>
                        <div style={{ color: '#ff8eb3', fontFamily: 'monospace', fontSize: '18px', backgroundColor: '#000', padding: '0 4px', letterSpacing: '2px' }}>000</div>
                    </div>
                    {/* 격자 (8x8) */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(8, 16px)', gridAutoRows: '16px',
                        borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)',
                        borderBottom: '2px solid var(--win95-highlight-gray)', borderRight: '2px solid var(--win95-highlight-gray)'
                    }}>
                        {Array.from({ length: 64 }).map((_, i) => {
                            // 리얼함을 위해 몇 개만 눌린 것처럼 연출
                            const isOpened = i === 27 || i === 28 || i === 36;
                            const isMine = i === 12; // 깃발
                            const content = i === 27 ? '1' : i === 28 ? '2' : isMine ? '🚩' : '';
                            const color = content === '1' ? 'var(--win95-accent-blue)' : content === '2' ? 'green' : '';

                            return (
                                <div key={i} style={{
                                    width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: '10px', fontWeight: 'bold', color: color,
                                    backgroundColor: isOpened ? 'var(--win95-content-white)' : 'var(--win95-base-gray)',
                                    borderTop: isOpened ? '1px dotted var(--win95-light-shadow-gray)' : '2px solid var(--win95-highlight-gray)',
                                    borderLeft: isOpened ? '1px dotted var(--win95-light-shadow-gray)' : '2px solid var(--win95-highlight-gray)',
                                    borderBottom: isOpened ? 'none' : '2px solid var(--win95-dark-shadow-black)',
                                    borderRight: isOpened ? 'none' : '2px solid var(--win95-dark-shadow-black)',
                                    cursor: 'pointer'
                                }}>
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 🪟 메인 프로그램: 최애로운_생활.exe (최상단) */}
            <div className="win95-window" style={{ 
                position: 'absolute', 
                top: '55%', left: '50%', 
                transform: 'translate(-50%, -50%)', 
                width: '90%', maxWidth: '450px', 
                boxShadow: '6px 6px 20px rgba(199, 139, 155, 0.5)',
                zIndex: 10 
            }}>
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <img src="/images/icons/program.png" alt="program" style={{ width: '14px', height: '14px', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'}/>
                        최애로운_생활.exe
                    </span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>

                <div className="win95-window-inner" style={{ backgroundColor: 'var(--win95-base-gray)', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* 로고 이미지는 icons 폴더가 아니라면 기존 경로 유지 (수정 필요 시 변경하세요) */}
                    <img src="/images/logo.png" alt="로고" style={{ width: '150px', marginBottom: '20px', imageRendering: 'pixelated' }} />
                    <h2 style={{ fontSize: '18px', color: '#5d4037', marginBottom: '10px' }}>커스텀 비쥬얼 노벨 게임 제작하기</h2>
                    <p style={{ fontSize: '13px', color: '#5d4037', marginBottom: '30px', lineHeight: '1.5' }}>
                        바탕화면의 아이콘을 더블클릭 하거나,<br/>
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
                <div style={{ display: 'flex', gap: '5px', height: '100%', alignItems: 'center', overflow: 'hidden' }}>
                    <button className="win95-button" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', fontWeight: 'bold', height: '100%' }}>
                        <span style={{ fontSize: '14px', color: '#5d4037' }}>⊞ 시작</span>
                    </button>
                    
                    {/* 활성화된 창 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                        borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)', 
                        borderRight: '2px solid var(--win95-highlight-gray)', borderBottom: '2px solid var(--win95-highlight-gray)', 
                        backgroundColor: 'var(--win95-content-white)', height: '100%', fontWeight: 'bold', color: '#5d4037', fontSize: '12px' 
                    }}>
                        최애로운_생활.exe
                    </div>
                    
                    {/* 비활성화된 메모장 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                        borderTop: '2px solid var(--win95-highlight-gray)', borderLeft: '2px solid var(--win95-highlight-gray)', 
                        borderRight: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-dark-shadow-black)', 
                        backgroundColor: 'var(--win95-base-gray)', height: '100%', color: '#5d4037', fontSize: '12px', marginTop: '1px' 
                    }}>
                        README.txt
                    </div>

                    {/* 비활성화된 지뢰찾기 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                        borderTop: '2px solid var(--win95-highlight-gray)', borderLeft: '2px solid var(--win95-highlight-gray)', 
                        borderRight: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-dark-shadow-black)', 
                        backgroundColor: 'var(--win95-base-gray)', height: '100%', color: '#5d4037', fontSize: '12px', marginTop: '1px' 
                    }}>
                        💣 지뢰찾기
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', alignItems: 'center', padding: '0 10px', 
                    borderTop: '2px solid var(--win95-light-shadow-gray)', borderLeft: '2px solid var(--win95-light-shadow-gray)', 
                    borderRight: '2px solid var(--win95-highlight-gray)', borderBottom: '2px solid var(--win95-highlight-gray)',
                    backgroundColor: 'var(--win95-base-gray)', height: '100%', fontSize: '12px', color: '#5d4037', marginRight: '2px'
                }}>
                    🔊 {formattedTime}
                </div>
            </div>
        </div>
    );
}