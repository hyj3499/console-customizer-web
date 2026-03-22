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
                gap: '2px',
                outline: 'none',
                margin: '5px'
            }}
        >
            <img 
                src={iconPath} 
                alt={label} 
                style={{ 
                    width: '32px', 
                    height: '32px', 
                    imageRendering: 'pixelated',
                    filter: isSelected ? 'drop-shadow(0 0 5px #ffb6c1) brightness(0.9) contrast(1.1)' : 'none' 
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ 
                color: isSelected ? '#ffffff' : '#5d4037',
                backgroundColor: isSelected ? 'var(--win95-title-active-blue-start)' : 'transparent',
                padding: '1px 3px', 
                fontSize: '11px', 
                textAlign: 'center', 
                border: isSelected ? '1px dotted #ffffff' : '1px dotted transparent',
                fontFamily: "'Galmuri14', monospace",
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

    // ⭐ 창 열림/닫힘 상태 관리
    const [isNotepadOpen, setIsNotepadOpen] = useState(true);
    const [isMinesweeperOpen, setIsMinesweeperOpen] = useState(true);

    // ⏰ 하단 작업표시줄 시계 타이머
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

    // 📂 아이콘 리스트
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
            fontFamily: "'Galmuri14', monospace",
            userSelect: 'none'
        }}>
            
            {/* ⭐ 모바일 최적화를 위한 CSS 스타일 블록 */}
            <style>{`
                @media (max-width: 768px) {
                    /* 바탕화면 아이콘 4열 정렬 */
                    .desktop-icons-container {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        grid-auto-flow: row !important;
                        grid-template-rows: none !important;
                        height: auto !important; 
                        max-height: calc(100vh - 40px) !important;
                        overflow-y: auto !important; 
                        padding: 10px !important;
                        gap: 10px !important;
                    }
                    
                    /* 지뢰찾기 숨김 */
                    .minesweeper-window { display: none !important; }
                    .taskbar-minesweeper-tab { display: none !important; }
                    
                    /* 📝 메모장: 메인 창 뒤에 겹치도록 위치 조정 */
                    .notepad-window {
                        width: 85% !important;
                        max-width: 300px !important;
                        top: 15% !important; /* 조금 더 밑으로 내려서 자연스럽게 겹치게 */
                        left: 50% !important;
                        transform: translateX(-50%) !important;
                        z-index: 5 !important; /* 메인 창(10)보다 뒤에 위치 */
                    }
                    .notepad-window .win95-window-inner {
                        height: 100px !important; 
                    }
                    
                    /* 🪟 메인 프로그램: 크기 확 줄이고 메모장 위로 겹치게 */
                    .main-window {
                        width: 85% !important; /* 창 너비 축소 */
                        max-width: 320px !important;
                        top: 45% !important; /* 위로 올려서 메모장과 겹치게 */
                        left: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        z-index: 10 !important; /* 메모장보다 무조건 위에 오도록 보장 */
                    }
                    .main-window .win95-window-inner {
                        padding: 15px 10px !important; /* 내부 여백 대폭 축소 */
                    }
                    .main-window img.main-logo {
                        width: 80px !important; /* 로고 크기 축소 */
                        margin-bottom: 8px !important;
                    }
                    .main-window h2 {
                        font-size: 14px !important; /* 제목 크기 축소 */
                        margin-bottom: 8px !important;
                    }
                    .main-window p {
                        font-size: 11px !important; /* 설명 텍스트 축소 */
                        margin-bottom: 12px !important;
                        line-height: 1.3 !important;
                    }
                    .main-window button {
                        padding: 6px 15px !important; /* 버튼 크기 축소 */
                        font-size: 12px !important;
                    }

                    /* 하단 작업표시줄 시계 및 탭 최적화 */
                    .taskbar-clock {
                        padding: 0 4px !important;
                        font-size: 10px !important;
                        min-width: 60px;
                        justify-content: center;
                    }
                    .clock-icon {
                        display: none; 
                    }
                    .taskbar-notepad-tab {
                        display: none !important; 
                    }
                }
            `}</style>

            {/* 📁 바탕화면 아이콘 그리드 */}
            <div className="desktop-icons-container" style={{ 
                display: 'grid', gridTemplateRows: 'repeat(auto-fill, 75px)', gridAutoFlow: 'column', 
                height: 'calc(100vh - 40px)', padding: '10px', columnGap: '15px', position: 'absolute', top: 0, left: 0, zIndex: 1
            }}>
                {iconList.map((fileName) => (
                    <DesktopIcon 
                        key={fileName}
                        iconPath={`/images/icons/${fileName}.png`} 
                        label={fileName.replace(/_/g, ' ')} 
                        onDoubleClick={() => {
                            if (fileName === "games" || fileName === "minecraft" || fileName === "stardew_valley" || fileName === "program") {
                                navigate('/customizer');
                            }
                        }}
                    />
                ))}
            </div>

            {/* 📝 서브 창 1: README 메모장 */}
            {isNotepadOpen && (
                <div className="win95-window notepad-window" style={{ 
                    position: 'absolute', top: '15%', left: '12%', width: '280px',
                    boxShadow: '4px 4px 15px rgba(199, 139, 155, 0.4)', zIndex: 5 
                }}>
                    <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--win95-title-inactive-gray)', color: 'var(--win95-dark-shadow-black)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <img src="/images/icons/notepad.png" alt="notepad" style={{ width: '14px', height: '14px', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'}/>
                            README.txt - 메모장
                        </span>
                        <button className="win95-button" onClick={() => setIsNotepadOpen(false)} style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
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
                            defaultValue={`중앙의 [최애로운_생활.exe]를 실행하여\n나만의 비주얼 노벨을 만들어보세요!\n\n♡ ٩(❛ᴗ❛)۶ ♡`}
                            style={{ width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', padding: '10px', fontFamily: "'Galmuri14', monospace", fontSize: '13px', color: '#5d4037', backgroundColor: 'var(--win95-content-white)', lineHeight: '1.5' }}
                        />
                    </div>
                </div>
            )}

            {/* 💣 서브 창 2: 귀여운 지뢰찾기 */}
            {isMinesweeperOpen && (
                <div className="win95-window minesweeper-window" style={{ 
                    position: 'absolute', top: '10%', right: '10%', width: '180px',
                    boxShadow: '4px 4px 15px rgba(199, 139, 155, 0.4)', zIndex: 7 
                }}>
                    <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--win95-title-inactive-gray)', color: 'var(--win95-dark-shadow-black)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💣 지뢰찾기</span>
                        <button className="win95-button" onClick={() => setIsMinesweeperOpen(false)} style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', padding: '2px 5px', backgroundColor: 'var(--win95-base-gray)', borderBottom: '1px solid var(--win95-light-shadow-gray)', fontSize: '12px', color: '#5d4037' }}>
                        <span>Game</span><span>Help</span>
                    </div>
                    <div className="win95-window-inner" style={{ backgroundColor: 'var(--win95-base-gray)', padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '4px', borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-highlight-gray)', borderRight: '2px solid var(--win95-highlight-gray)' }}>
                            <div style={{ color: '#ff8eb3', fontFamily: 'monospace', fontSize: '18px', backgroundColor: '#000', padding: '0 4px', letterSpacing: '2px' }}>010</div>
                            <button className="win95-button" style={{ minWidth: '26px', padding: '2px', fontSize: '16px' }}>😊</button>
                            <div style={{ color: '#ff8eb3', fontFamily: 'monospace', fontSize: '18px', backgroundColor: '#000', padding: '0 4px', letterSpacing: '2px' }}>000</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 16px)', gridAutoRows: '16px', borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-highlight-gray)', borderRight: '2px solid var(--win95-highlight-gray)' }}>
                            {Array.from({ length: 64 }).map((_, i) => {
                                const isOpened = i === 27 || i === 28 || i === 36;
                                const isMine = i === 12;
                                const content = i === 27 ? '1' : i === 28 ? '2' : isMine ? '🚩' : '';
                                const color = content === '1' ? 'var(--win95-accent-blue)' : content === '2' ? 'green' : '';

                                return (
                                    <div key={i} style={{
                                        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', fontWeight: 'bold', color: color,
                                        backgroundColor: isOpened ? 'var(--win95-content-white)' : 'var(--win95-base-gray)',
                                        borderTop: isOpened ? '1px dotted var(--win95-light-shadow-gray)' : '2px solid var(--win95-highlight-gray)',
                                        borderLeft: isOpened ? '1px dotted var(--win95-light-shadow-gray)' : '2px solid var(--win95-highlight-gray)',
                                        borderBottom: isOpened ? 'none' : '2px solid var(--win95-dark-shadow-black)',
                                        borderRight: isOpened ? 'none' : '2px solid var(--win95-dark-shadow-black)', cursor: 'pointer'
                                    }}>{content}</div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 🪟 메인 프로그램 (항상 켜져 있음) */}
            <div className="win95-window main-window" style={{ 
                position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', 
                width: '90%', maxWidth: '450px', boxShadow: '6px 6px 20px rgba(199, 139, 155, 0.5)', zIndex: 10 
            }}>
                <div className="win95-title-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <img src="/images/icons/program.png" alt="program" style={{ width: '14px', height: '14px', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'}/>
                        최애로운_생활.exe
                    </span>
                    <button className="win95-button" style={{ minWidth: 'auto', padding: '0 6px', fontWeight: 'bold' }}>X</button>
                </div>

                <div className="win95-window-inner" style={{ backgroundColor: 'var(--win95-base-gray)', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img className="main-logo" src="/images/logo.png" alt="로고" style={{ width: '150px', marginBottom: '20px', imageRendering: 'pixelated' }} />
                    <h2 style={{ fontSize: '18px', color: '#5d4037', marginBottom: '10px' }}>커스텀 비쥬얼 노벨 게임 제작하기</h2>
                    <p style={{ fontSize: '13px', color: '#5d4037', marginBottom: '30px', lineHeight: '1.5' }}>
                        바탕화면의 아이콘을 더블클릭 하거나,<br/>
                        아래 [게임 제작] 버튼을 눌러주십시오.
                    </p>
                    <button 
                        className="win95-button win95-button-yellow" 
                        onClick={() => navigate('/customizer')} 
                        style={{ padding: '8px 25px', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        게임 제작(N) {'>'}
                    </button>
                </div>
            </div>

            {/* 🏁 하단 작업 표시줄 */}
            <div style={{ 
                position: 'fixed', bottom: 0, left: 0, width: '100%', height: '32px', 
                backgroundColor: 'var(--win95-base-gray)', 
                borderTop: '2px solid var(--win95-highlight-gray)', borderBottom: '2px solid var(--win95-dark-shadow-black)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px', zIndex: 1000
            }}>
                <div style={{ display: 'flex', gap: '5px', height: '100%', alignItems: 'center', overflow: 'hidden' }}>
                    <button className="win95-button" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', fontWeight: 'bold', height: '100%' }}>
                        <span style={{ fontSize: '14px', color: '#5d4037' }}>⊞ 시작</span>
                    </button>
                    
                    {/* 활성화된 메인 프로그램 탭 */}
                    <div style={{ 
                        display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                        borderTop: '2px solid var(--win95-dark-shadow-black)', borderLeft: '2px solid var(--win95-dark-shadow-black)', 
                        borderRight: '2px solid var(--win95-highlight-gray)', borderBottom: '2px solid var(--win95-highlight-gray)', 
                        backgroundColor: 'var(--win95-content-white)', height: '100%', fontWeight: 'bold', color: '#5d4037', fontSize: '12px' 
                    }}>
                        <img src="/images/logo.png" alt="logo" style={{ width: '14px', height: '14px', marginRight: '6px', imageRendering: 'pixelated' }} />
                        최애로운_생활.exe
                    </div>
                    
                    {/* 비활성 탭 1 */}
                    {isNotepadOpen && (
                        <div className="taskbar-notepad-tab" style={{ 
                            display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                            borderTop: '2px solid var(--win95-highlight-gray)', borderLeft: '2px solid var(--win95-highlight-gray)', 
                            borderRight: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-dark-shadow-black)', 
                            backgroundColor: 'var(--win95-base-gray)', height: '100%', color: '#5d4037', fontSize: '12px', marginTop: '1px' 
                        }}>
                            README.txt
                        </div>
                    )}

                    {/* 비활성 탭 2 */}
                    {isMinesweeperOpen && (
                        <div className="taskbar-minesweeper-tab" style={{ 
                            display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                            borderTop: '2px solid var(--win95-highlight-gray)', borderLeft: '2px solid var(--win95-highlight-gray)', 
                            borderRight: '2px solid var(--win95-dark-shadow-black)', borderBottom: '2px solid var(--win95-dark-shadow-black)', 
                            backgroundColor: 'var(--win95-base-gray)', height: '100%', color: '#5d4037', fontSize: '12px', marginTop: '1px' 
                        }}>
                            💣 지뢰찾기
                        </div>
                    )}
                </div>

                {/* ⏰ 시계 영역 */}
                <div className="taskbar-clock" style={{ 
                    display: 'flex', alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap',
                    borderTop: '2px solid var(--win95-light-shadow-gray)', borderLeft: '2px solid var(--win95-light-shadow-gray)', 
                    borderRight: '2px solid var(--win95-highlight-gray)', borderBottom: '2px solid var(--win95-highlight-gray)',
                    backgroundColor: 'var(--win95-base-gray)', height: '100%', fontSize: '12px', color: '#5d4037', marginRight: '2px'
                }}>
                    <span className="clock-icon" style={{ marginRight: '4px' }}>🔊</span>
                    {formattedTime}
                </div>
            </div>
        </div>
    );
}