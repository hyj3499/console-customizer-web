// src/components/Header.jsx
import { Link } from 'react-router-dom';
import useCustomizerStore from '../store/useCustomizerStore'; // ⭐ 스토어 임포트 추가

export default function Header() {
    // ⭐ 스토어에서 편집 상태(isEditing)와 해제 함수(setIsEditing) 가져오기
    const { isEditing, setIsEditing } = useCustomizerStore();

    // ⭐ 네비게이션 클릭 시 경고창을 띄우는 함수
    const handleNavClick = (e) => {
        if (isEditing) {
            const confirmLeave = window.confirm("저장하지 않은 작업 내용이 모두 사라집니다! 정말 다른 페이지로 이동하시겠습니까?");
            if (!confirmLeave) {
                e.preventDefault(); // '취소'를 누르면 이동을 강제로 막음
            } else {
                setIsEditing(false); // '확인'을 누르면 깃발을 내리고 놔줌
            }
        }
    };

    // 🎨 윈도우 95 버튼 공통 스타일 (파스텔 테마 적용)
    const win95ButtonStyle = {
        backgroundColor: 'var(--win95-base-gray)', // 베이비 핑크 배경
        borderTop: '2px solid var(--win95-highlight-gray)', // 흰색 하이라이트
        borderLeft: '2px solid var(--win95-highlight-gray)',
        borderRight: '2px solid var(--win95-dark-shadow-black)', // 파스텔 섀도우
        borderBottom: '2px solid var(--win95-dark-shadow-black)',
        padding: '5px 15px',
        textDecoration: 'none',
        color: '#5d4037', // 다크 브라운 텍스트로 부드럽게
        fontSize: '13px',
        fontWeight: 'bold',
        fontFamily: "'Galmuri14', 'Courier New', monospace",
        display: 'inline-block',
        outline: 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap' // 글자 줄바꿈 방지
    };

    return (
        <header className="win95-header" style={{ 
            backgroundColor: 'var(--win95-base-gray)', // 헤더 전체 배경을 파스텔톤으로
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '5px 10px', 
            borderTop: '2px solid var(--win95-highlight-gray)',
            borderLeft: '2px solid var(--win95-highlight-gray)',
            borderBottom: '2px solid var(--win95-dark-shadow-black)', 
            alignItems: 'center',
            userSelect: 'none',
            flexWrap: 'nowrap', // ⭐ 절대 줄바꿈 금지 (무조건 한 줄)
            gap: '5px'
        }}>
            
            {/* 📁 로고 영역 (아이콘 + 텍스트) */}
            {/* ⭐ onClick={handleNavClick} 추가 */}
            <Link to="/" onClick={handleNavClick} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '5px', flexShrink: 0 }}>
                <div style={{
                    padding: '1px',
                    // 로고 아이콘 주변의 오목한 테두리 (Inset Bevel) 파스텔 톤 적용
                    borderTop: '1px solid var(--win95-dark-shadow-black)',
                    borderLeft: '1px solid var(--win95-dark-shadow-black)',
                    borderRight: '1px solid var(--win95-highlight-gray)',
                    borderBottom: '1px solid var(--win95-highlight-gray)',
                    backgroundColor: 'var(--win95-content-white)' // 입력창 같은 흰색 바탕
                }}>
                    <img 
                        src="/images/logo.png" 
                        alt="L" 
                        style={{ height: '22px', display: 'block', imageRendering: 'pixelated' }} 
                    />
                </div>
                <span className="logo-text" style={{ 
                    color: '#5d4037', // 텍스트 색상 부드럽게 연동
                    fontWeight: 'bold', fontSize: '13px', fontFamily: "'Galmuri14', monospace",
                    whiteSpace: 'nowrap' // 글자 짤림 방지
                }}>
                    최애로운 생활
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
                {/* ⭐ 모든 Link에 onClick={handleNavClick} 추가 */}
                <Link to="/about" onClick={handleNavClick} style={win95ButtonStyle} className="win95-nav-btn">소개</Link>
                <Link to="/faq" onClick={handleNavClick} style={win95ButtonStyle} className="win95-nav-btn">FAQ</Link>
                <Link to="/notice" onClick={handleNavClick} style={win95ButtonStyle} className="win95-nav-btn">공지</Link>
                <Link to="/contact" onClick={handleNavClick} style={win95ButtonStyle} className="win95-nav-btn">문의</Link>
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

                /* 버튼 눌렸을 때 효과 (파스텔 섀도우 적용) */
                .win95-nav-btn:active {
                    border-top: 2px solid var(--win95-dark-shadow-black) !important;
                    border-left: 2px solid var(--win95-dark-shadow-black) !important;
                    border-right: 2px solid var(--win95-highlight-gray) !important;
                    border-bottom: 2px solid var(--win95-highlight-gray) !important;
                    padding: 6px 14px 4px 16px !important; /* 눌렸을 때 글자가 살짝 우하단으로 밀리는 디테일 (모바일 최적화 패딩과 충돌 방지를 위해 조절 필요할 수 있음) */
                }
                
                @media screen and (max-width: 600px) {
                    .win95-nav-btn:active {
                        padding: 5px 2px 3px 4px !important; /* 모바일에서의 눌림 효과 패딩 */
                    }
                }
            `}</style>
        </header>
    );
}