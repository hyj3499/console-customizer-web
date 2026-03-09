// src/components/Header.jsx
import { Link } from 'react-router-dom';

export default function Header() {
    return (
        <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '20px', 
            borderBottom: '1px solid #eee',
            alignItems: 'center' // ⭐ 로고와 메뉴가 위아래로 삐뚤어지지 않게 중앙 정렬
        }}>
            
            {/* 로고 영역 (이미지를 누르면 메인 홈('/')으로 이동) */}
            <Link to="/">
                <img 
                    // ⭐ public/images 폴더 안에 있는 실제 로고 파일 이름으로 바꿔주세요! (예: logo.png)
                    src="/images/logo.png" 
                    alt="코드네임 최애 로고" 
                    style={{ 
                        height: '40px', // 헤더 높이에 맞게 로고 크기 조절 (필요시 수정)
                        display: 'block' 
                    }} 
                />
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