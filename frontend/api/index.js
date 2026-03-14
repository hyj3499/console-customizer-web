import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // ⭐ 다이렉트 업로드를 위한 필수 도구

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// 프론트엔드가 JSON(텍스트)만 보내므로, JSON 용량을 넉넉히 열어줍니다. (multer는 삭제됨)
app.use(express.json({ limit: '50mb' })); 

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const mockDB = {}; 

// --------------------------------------------------------
// [API 1] 프로젝트 생성
// --------------------------------------------------------
app.post('/api/projects/create', (req, res) => {
    const { id, pw } = req.body;
    if (mockDB[id]) return res.status(409).json({ message: "이미 존재하는 ID입니다." });

    mockDB[id] = { pw, data: {} };
    res.status(201).json({ success: true });
});

// --------------------------------------------------------
// [API 2] 데이터 불러오기 (로그인)
// --------------------------------------------------------
app.post('/api/projects/login', async (req, res) => {
    const { id, pw } = req.body;

    if (mockDB[id] && mockDB[id].pw !== pw && mockDB[id].pw !== '') {
        return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    try {
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${id}/data.json`,
        });

        const response = await s3.send(getCommand);
        const dataString = await response.Body.transformToString();
        const projectData = JSON.parse(dataString);

        mockDB[id] = { pw: pw, data: projectData };
        res.status(200).json(projectData);
    } catch (error) {
        res.status(404).json({ message: "클라우드에 저장된 데이터가 없거나 ID가 틀렸습니다." });
    }
});

// --------------------------------------------------------
// ⭐ [API 3] 프론트엔드에게 R2 업로드 입장권(Presigned URL) 발급해주기
// --------------------------------------------------------
app.post('/api/projects/presigned', async (req, res) => {
    try {
        const { projectId, filesInfo } = req.body; 
        if (!projectId || !filesInfo) return res.status(400).json({ message: "데이터가 부족합니다." });

        const urls = await Promise.all(filesInfo.map(async (file) => {
            // 한글이나 특수문자 깨짐을 막기 위해 원본 이름의 띄어쓰기만 _로 치환
            const safeFileName = file.name.replace(/\s+/g, '_');
            const fullPath = `${projectId}/${safeFileName}`; // Date.now() 제거하여 덮어쓰기 유도

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fullPath,
                ContentType: file.type, // "image/png" 등을 명시
            });

            // 1시간 동안 유효한 R2 업로드 전용 URL 생성
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            const finalUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;

            return { originalName: file.name, uploadUrl, finalUrl };
        }));

        res.status(200).json({ urls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --------------------------------------------------------
// [API 4] 통합 저장 (텍스트 JSON과 urlMap만 받아서 클라우드에 저장)
// --------------------------------------------------------
app.post('/api/projects/save', async (req, res) => {
    try {
        const { projectId, gameData, htmlContent, urlMap } = req.body;
        if (!projectId) return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });

        const parsedData = JSON.parse(gameData);
        
        const replaceUrl = (img) => {
            if (!img) return null;
            const key = typeof img === 'object' ? (img.name || img.preview) : img;
            return urlMap[key] || key; 
        };

        if (parsedData.events) {
            parsedData.events.forEach(event => {
                event.bgm = replaceUrl(event.bgm); // ⭐ mp3 버그 해결된 부분!

                event.scenarios.forEach(sc => {
                    sc.protagonistImage = replaceUrl(sc.protagonistImage);
                    sc.heroineImage = replaceUrl(sc.heroineImage);
                    sc.bgImage = replaceUrl(sc.bgImage);
                    sc.src = replaceUrl(sc.src);
                });
            });
        }
        
        if (parsedData.customFonts) {
            parsedData.customFonts = parsedData.customFonts.map(font => ({
                ...font,
                url: urlMap[font.url] || font.url 
            }));
        }

        if (parsedData.protagonist?.images) parsedData.protagonist.images = parsedData.protagonist.images.map(replaceUrl);
        if (parsedData.characters) {
            parsedData.characters.forEach(char => {
                if (char.images) char.images = char.images.map(replaceUrl);
            });
        }

        // JSON 및 HTML 저장
        const jsonBuffer = Buffer.from(JSON.stringify(parsedData, null, 2), 'utf-8');
        await s3.send(new PutObjectCommand({ 
            Bucket: process.env.R2_BUCKET_NAME, 
            Key: `${projectId}/data.json`, 
            Body: jsonBuffer, 
            ContentType: 'application/json' 
        }));
        
        if (htmlContent) {
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            await s3.send(new PutObjectCommand({ 
                Bucket: process.env.R2_BUCKET_NAME, 
                Key: `${projectId}/index.html`, 
                Body: htmlBuffer, 
                ContentType: 'text/html' 
            }));
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

// ⭐ Vercel 500 에러를 막기 위한 ESM 방식 내보내기
export default app;