// backend/index.js
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors'); // 프론트엔드 요청 허용
const app = express();

app.use(cors());
app.use(express.json());

const orderDraftDB = {}; 

// 로그인 및 임시 저장 시작 API
app.post('/api/drafts/login', async (req, res) => {
    const { tempId, password } = req.body;

    if (orderDraftDB[tempId]) {
        const isMatch = await bcrypt.compare(password, orderDraftDB[tempId].password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
        return res.json({ message: "불러오기 성공", data: orderDraftDB[tempId] });
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        orderDraftDB[tempId] = {
            tempId, password: hashedPassword, current_step: 1, color: null, scenarios: [""]
        };
        return res.json({ message: "새로운 커스텀 시작", data: orderDraftDB[tempId] });
    }
});

// 서버 실행
app.listen(8080, () => console.log('✅ 백엔드 서버가 http://localhost:8080 에서 실행 중입니다.'));