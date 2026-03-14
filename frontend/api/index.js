import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // ⭐ 새로 추가된 모듈

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // 텍스트(JSON)만 받으므로 이제 가볍습니다.

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const mockDB = {}; // (Vercel에서는 휘발되지만 임시 유지)

// [API 1] 계정 생성
app.post('/api/projects/create', (req, res) => {
    const { id, pw } = req.body;
    if (mockDB[id]) return res.status(409).json({ message: "이미 있는 ID입니다." });
    mockDB[id] = { pw, data: {} };
    res.status(201).json({ success: true });
});

// [API 2] 불러오기
app.post('/api/projects/login', async (req, res) => {
    const { id, pw } = req.body;
    if (mockDB[id] && mockDB[id].pw !== pw && mockDB[id].pw !== '') {
        return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }
    try {
        const getCommand = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: `${id}/data.json` });
        const response = await s3.send(getCommand);
        const dataString = await response.Body.transformToString();
        const projectData = JSON.parse(dataString);
        mockDB[id] = { pw: pw, data: projectData };
        res.status(200).json(projectData);
    } catch (error) {
        res.status(404).json({ message: "클라우드에 데이터가 없거나 ID가 틀렸습니다." });
    }
});

// ⭐ [NEW API] 3. 다이렉트 업로드용 입장권(Presigned URL) 발급
app.post('/api/projects/presigned', async (req, res) => {
    try {
        const { projectId, filesInfo } = req.body; // [{ name: "a.png", type: "image/png" }]
        if (!projectId || !filesInfo) return res.status(400).json({ message: "데이터가 부족합니다." });

        // 프론트엔드가 보낸 파일 목록을 돌면서 각각의 업로드용 URL을 만듭니다.
        const urls = await Promise.all(filesInfo.map(async (file) => {
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
            const finalName = `${Date.now()}-${safeFileName}`;
            const fullPath = `${projectId}/${finalName}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fullPath,
                ContentType: file.type // 이걸 맞춰줘야 브라우저에서 이미지로 인식합니다.
            });

            // 1시간(3600초) 동안만 유효한 업로드 전용 URL 생성
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            const finalUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;

            return { originalName: file.name, uploadUrl, finalUrl };
        }));

        res.status(200).json({ urls });
    } catch (error) {
        console.error("URL 발급 에러:", error);
        res.status(500).json({ message: error.message });
    }
});

// [API 4] 통합 저장 (이제 파일은 프론트가 직접 올리고, 여긴 JSON 텍스트와 URL지도만 받음)
app.post('/api/projects/save', async (req, res) => {
    try {
        const { projectId, gameData, htmlContent, urlMap } = req.body; // ⭐ 파일(files) 대신 urlMap을 받음
        if (!projectId) return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });

        const parsedData = JSON.parse(gameData);
        
        // 프론트엔드가 만들어준 urlMap을 기반으로 이미지 치환
        const replaceUrl = (img) => {
            if (!img) return null;
            const key = typeof img === 'object' ? (img.name || img.preview) : img;
            return urlMap[key] || key; 
        };

        if (parsedData.events) {
            parsedData.events.forEach(event => event.scenarios.forEach(sc => {
                sc.protagonistImage = replaceUrl(sc.protagonistImage);
                sc.heroineImage = replaceUrl(sc.heroineImage);
                sc.bgImage = replaceUrl(sc.bgImage);
                sc.src = replaceUrl(sc.src);
            }));
        }
        if (parsedData.protagonist?.images) parsedData.protagonist.images = parsedData.protagonist.images.map(replaceUrl);
        if (parsedData.characters) parsedData.characters.forEach(char => { if (char.images) char.images = char.images.map(replaceUrl); });

        // JSON 및 HTML 저장
        const jsonBuffer = Buffer.from(JSON.stringify(parsedData, null, 2), 'utf-8');
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: `${projectId}/data.json`, Body: jsonBuffer, ContentType: 'application/json' }));
        
        if (htmlContent) {
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: `${projectId}/index.html`, Body: htmlBuffer, ContentType: 'text/html' }));
        }

        mockDB[projectId] = { pw: mockDB[projectId]?.pw || '', data: parsedData };
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("저장 에러:", error);
        res.status(500).json({ message: error.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 로컬 서버 가동 중: http://localhost:${PORT}`);
    });
}

export default app;