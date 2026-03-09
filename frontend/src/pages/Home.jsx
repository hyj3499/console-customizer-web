import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div style={{ 
            display: 'flex',             
            flexDirection: 'column',     
            justifyContent: 'center',    
            alignItems: 'center',        
            height: '100vh',             
            width: '100%',               
            textAlign: 'center',
            padding: '20px' 
        }}>
            {/* ⭐ 텍스트 대신 로고 이미지 삽입! */}
            {/* public 폴더 바로 아래에 logo.png를 넣었다면 src="/logo.png" */}
            {/* public/images 폴더에 넣었다면 src="/images/logo.png" 라고 적습니다. */}
            <img 
                src="/images/logo.png"
                alt="코드네임 최애 로고" 
                style={{ 
                    width: '250px',       // 로고 크기 (원하는 대로 조절하세요)
                    marginBottom: '30px'  // 로고와 아래 제목 사이의 간격
                }} 
            />

            <h1 style={{ marginBottom: '20px' }}>나만의 완벽한 커스텀 게임기를 만들어보세요</h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                수만 가지 조합으로 완성하는 단 하나의 콘솔. 지금 바로 시작하세요.
            </p>
            
        {/* src/pages/Home.jsx 의 버튼 부분 */}
        <button 
            onClick={() => navigate('/customizer')} // ⭐ 주소를 /customizer 로 변경!
            style={{ /* 기존 스타일 그대로 */ }}
        >
            주문하기 (커스텀 시작)
        </button>
        </div>
    );
}