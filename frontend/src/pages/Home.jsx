// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h1>나만의 완벽한 커스텀 게임기를 만들어보세요</h1>
            <p style={{ color: '#666', marginBottom: '40px' }}>
                수만 가지 조합으로 완성하는 단 하나의 콘솔. 지금 바로 시작하세요.
            </p>
            
            {/* 이 버튼을 누르면 커스텀 1단계 화면으로 넘어갑니다! */}
            <button 
                onClick={() => navigate('/step/1')}
                style={{ padding: '15px 40px', fontSize: '20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer' }}
            >
                주문하기 (커스텀 시작)
            </button>
        </div>
    );
}