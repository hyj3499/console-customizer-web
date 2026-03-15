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
        cursor: 'pointer'
    };

    return (
        <header style={{ 
            backgroundColor: '#c0c0c0',
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '8px 20px', 
            // 💡 상단은 하이라이트, 하단은 강한 그림자로 입체감 부여
            borderTop: '2px solid #fff',
            borderLeft: '2px solid #fff',
            borderBottom: '2px solid #000', 
            alignItems: 'center',
            userSelect: 'none'
        }}>
            
            {/* 📁 로고 영역 (내 컴퓨터 아이콘 느낌) */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '10px' }}>
                <div style={{
                    padding: '2px',
                    border: '1px inset #fff', // 로고 주변을 살짝 파인 느낌으로
                    backgroundColor: '#dfdfdf'
                }}>
                    <img 
                        src="/images/logo.png" 
                        alt="LOGO" 
                        style={{ 
                            height: '32px', 
                            display: 'block',
                            imageRendering: 'pixelated' // 도트 느낌 강조
                        }} 
                    />
                </div>
                <span style={{ 
                    color: '#000', 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    fontFamily: "'DOSGothic', monospace"
                }}>
                    Customizer.exe
                </span>
            </Link>
            
            {/* 🕹️ 메뉴 영역 (탭 메뉴 스타일) */}
            <nav style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Link to="/about" style={win95ButtonStyle} className="win95-nav-btn">제품 소개(A)</Link>
                <Link to="/faq" style={win95ButtonStyle} className="win95-nav-btn">FAQ(F)</Link>
                <Link to="/notice" style={win95ButtonStyle} className="win95-nav-btn">공지사항(N)</Link>
                <Link to="/contact" style={win95ButtonStyle} className="win95-nav-btn">문의하기(C)</Link>
            </nav>

            {/* CSS 효과 (버튼 눌림 효과 등) */}
            <style>{`
                .win95-nav-btn:active {
                    border-top: 2px solid #808080 !important;
                    border-left: 2px solid #808080 !important;
                    border-right: 2px solid #fff !important;
                    border-bottom: 2px solid #fff !important;
                    padding: 6px 14px 4px 16px !important; /* 눌렸을 때 살짝 밀리는 효과 */
                }
                .win95-nav-btn:hover {
                    background-color: #dfdfdf !important;
                }
            `}</style>
        </header>
    );
}