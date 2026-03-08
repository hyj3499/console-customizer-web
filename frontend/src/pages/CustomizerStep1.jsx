// src/pages/CustomizerStep1.jsx
import { useNavigate } from 'react-router-dom';
import useCustomizerStore from '../store/useCustomizerStore'; // ✨ 창고 가져오기
import './Customizer.css';

const consoleImages = {
    '빨': 'https://via.placeholder.com/320x240/FF5733/FFFFFF?text=Red+Console',
    '주': 'https://via.placeholder.com/320x240/FF8C00/FFFFFF?text=Orange+Console',
    '노': 'https://via.placeholder.com/320x240/FFD700/FFFFFF?text=Yellow+Console',
    '초': 'https://via.placeholder.com/320x240/4CAF50/FFFFFF?text=Green+Console',
    '파': 'https://via.placeholder.com/320x240/2196F3/FFFFFF?text=Blue+Console',
};

export default function CustomizerStep1() {
    const navigate = useNavigate();
    const { color, setColor } = useCustomizerStore();

    return (
        <div className="customizer-container">
            <div className="progress-header"><h2>진행 상황: 1 / 5</h2></div>

            <div>
                <h3>[ 게임기 선택 1/5 ]</h3>
                <p>원하는 게임기 색상을 골라주세요.</p>
                <div className="step1-layout">
                    <div className="color-btn-group vertical">
                        {['빨', '주', '노', '초', '파'].map(c => (
                            <button key={c} className={`color-btn ${color === c ? 'active' : ''}`} onClick={() => setColor(c)}>{c}</button>
                        ))}
                    </div>
                    <div className="image-preview-box">
                        {color ? <img src={consoleImages[color]} alt={`${color}색 게임기`} /> : <div className="empty-box">선택 시 표시</div>}
                    </div>
                </div>
                <button className="action-btn" onClick={() => navigate('/step/2')} disabled={!color}>다음</button>
            </div>
        </div>
    );
}