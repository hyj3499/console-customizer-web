// src/components/Header.jsx
import { Link } from 'react-router-dom';

export default function Header() {
    // 🎨 윈도우 95 버튼 공통 스타일
    const win95ButtonStyle = {
        backgroundColor: '#c0c0c0',
        borderTop: '2px solid #fff',
        borderLeft: '2px solid #fff',
        borderRight: '2px solid #808080',
        borderBottom: '2px solid #808080',
        padding: '5px 15px',
        textDecoration: 'none',
        color: '#000',
        fontSize: '13px',
        fontWeight: 'bold',
        fontFamily: "'DOSGothic', 'Courier New', monospace",
        display: 'inline-block',
        outline: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap' // 글자 줄바꿈 방지
    };

// src/components/Header.jsx (주요 수정 부분)

// src/components/Header.jsx (수정된 버전)

return (
    <header className="win95-header" style={{ 
        backgroundColor: '#c0c0c0',
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '5px 10px', 
        borderTop: '2px solid #fff',
        borderLeft: '2px solid #fff',
        borderBottom: '2px solid #000', 
        alignItems: 'center',
        userSelect: 'none',
        flexWrap: 'nowrap', // ⭐ 절대 줄바꿈 금지 (무조건 한 줄)
        gap: '5px'
    }}>
        
        {/* 📁 로고 영역 (아이콘 + 텍스트) */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '5px', flexShrink: 0 }}>
            <div style={{
                padding: '1px',
                border: '1px inset #fff',
                backgroundColor: '#dfdfdf'
            }}>
                <img 
                    src="/images/logo.png" 
                    alt="L" 
                    style={{ height: '22px', display: 'block', imageRendering: 'pixelated' }} 
                />
            </div>
            <span className="logo-text" style={{ 
                color: '#000', fontWeight: 'bold', fontSize: '13px', fontFamily: "'DOSGothic', monospace",
                whiteSpace: 'nowrap' // 글자 짤림 방지
            }}>
                Customizer
            </span>
        </Link>
        
        {/* 🕹️ 메뉴 영역 (1행 4열 배치) */}
        <nav className="win95-nav" style={{ 
            display: 'flex', 
            gap: '3px', 
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 1 // 공간 부족 시 네비게이션이 유연하게 반응
        }}>
            <Link to="/about" style={win95ButtonStyle} className="win95-nav-btn">소개</Link>
            <Link to="/faq" style={win95ButtonStyle} className="win95-nav-btn">FAQ</Link>
            <Link to="/notice" style={win95ButtonStyle} className="win95-nav-btn">공지</Link>
            <Link to="/contact" style={win95ButtonStyle} className="win95-nav-btn">문의</Link>
        </nav>

        <style>{`
            /* 📱 모바일 세로 모드 최적화 (로고+버튼 무조건 한 줄) */
            @media screen and (max-width: 600px) {
                .win95-header {
                    padding: 4px 6px !important; /* 헤더 여백 최소화 */
                }

                .logo-text {
                    font-size: 11px !important; /* 로고 글자 살짝 축소 */
                }

                .win95-nav {
                    gap: 2px !important; /* 버튼 사이 간격 좁힘 */
                }

                .win95-nav-btn {
                    padding: 4px 3px !important; /* 버튼 내부 여백 대폭 축소 */
                    font-size: 10px !important;   /* 폰트 크기 최적화 */
                    min-width: 0 !important;      /* 너비 제한 해제 */
                    flex: 0 1 auto !important;    /* 꽉 채우지 않고 글자 크기에 맞춤 */
                    text-align: center !important;
                }
            }

            .win95-nav-btn:active {
                border-top: 2px solid #808080 !important;
                border-left: 2px solid #808080 !important;
                border-right: 2px solid #fff !important;
                border-bottom: 2px solid #fff !important;
                padding: 5px 2px 3px 4px !important; /* 눌림 효과 시 여백 유지 */
            }
        `}</style>
    </header>
);
}