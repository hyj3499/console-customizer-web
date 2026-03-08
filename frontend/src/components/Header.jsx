// src/components/Header.jsx
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #eee' }}>
            {/* 로고 영역 (누르면 메인 홈으로 이동) */}
            <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: 'black' }}>
                🎮 GameRig Inc.
            </Link>
            
            {/* 메뉴 영역 */}
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/about" style={{ textDecoration: 'none', color: '#333' }}>제품 소개</Link>
                <Link to="/faq" style={{ textDecoration: 'none', color: '#333' }}>FAQ</Link>
                <Link to="/notice" style={{ textDecoration: 'none', color: '#333' }}>공지사항</Link>
                <Link to="/contact" style={{ textDecoration: 'none', color: '#333' }}>문의하기</Link>
            </nav>
        </header>
    );
}