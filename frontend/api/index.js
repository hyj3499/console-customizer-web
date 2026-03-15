import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// ⭐ HeadObjectCommand 추가 (파일 존재 여부 확인용)
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// 프론트엔드가 JSON(텍스트)만 보내므로, JSON 용량을 넉넉히 열어줍니다.
app.use(express.json({ limit: '50mb' })); 

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// ❌ mockDB 삭제됨! (더 이상 서버 재시작으로 데이터가 날아가지 않습니다)

// --------------------------------------------------------
// [API 1] 프로젝트 생성
// --------------------------------------------------------
app.post('/api/projects/create', async (req, res) => {
    const { id, pw } = req.body;
    
    try {
        // ⭐ 1. R2에 해당 ID의 비밀번호 파일(auth.json)이 있는지 찔러보기(Head)
        try {
            await s3.send(new HeadObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: `${id}/auth.json`,
            }));
            // 에러 없이 통과했다면 파일이 이미 존재한다는 뜻 (중복 ID)
            return res.status(409).json({ message: "이미 존재하는 ID입니다." });
        } catch (err) {
            // 파일이 없을 때 나는 에러(NotFound)면 정상 진행, 아니면 진짜 에러
            if (err.name !== 'NotFound' && err.name !== 'NoSuchKey') throw err;
        }

        // ⭐ 2. 중복이 아니면 R2에 비밀번호 파일(auth.json) 생성
        const authBuffer = Buffer.from(JSON.stringify({ pw: pw }), 'utf-8');
        await s3.send(new PutObjectCommand({ 
            Bucket: process.env.R2_BUCKET_NAME, 
            Key: `${id}/auth.json`, 
            Body: authBuffer, 
            ContentType: 'application/json' 
        }));

        res.status(201).json({ success: true });
    } catch (error) {
        console.error("생성 에러:", error);
        res.status(500).json({ message: "프로젝트 생성 중 서버 오류가 발생했습니다." });
    }
});

// --------------------------------------------------------
// [API 2] 데이터 불러오기 (로그인)
// --------------------------------------------------------
app.post('/api/projects/login', async (req, res) => {
    const { id, pw } = req.body;

    try {
        // ⭐ 1. R2에서 비밀번호 파일(auth.json) 먼저 가져와서 검증
        const authResponse = await s3.send(new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${id}/auth.json`,
        }));
        
        const authString = await authResponse.Body.transformToString();
        const authData = JSON.parse(authString);

        if (authData.pw !== pw) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        // ⭐ 2. 비밀번호가 맞으면 게임 데이터(data.json) 가져오기
        try {
            const dataResponse = await s3.send(new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: `${id}/data.json`,
            }));
            const dataString = await dataResponse.Body.transformToString();
            res.status(200).json(JSON.parse(dataString));
        } catch (dataErr) {
            // 가입만 하고 한 번도 저장을 안 해서 data.json이 없는 경우 빈 객체 반환
            if (dataErr.name === 'NotFound' || dataErr.name === 'NoSuchKey') {
                return res.status(200).json({});
            }
            throw dataErr;
        }

    } catch (error) {
        console.error("로그인 에러:", error);
        res.status(404).json({ message: "존재하지 않는 ID이거나 비밀번호가 틀렸습니다." });
    }
});

// --------------------------------------------------------
// ⭐ [API 3] 프론트엔드에게 R2 업로드 입장권(Presigned URL) 발급해주기
// --------------------------------------------------------
app.post('/api/projects/presigned', async (req, res) => {
    try {
        const { projectId, filesInfo } = req.body; 
        
        console.log(`🎫 [${projectId}] 입장권 요청 받음.`);
        console.log(`📦 전달받은 파일 목록:`, JSON.stringify(filesInfo, null, 2));

        if (!projectId || !filesInfo) return res.status(400).json({ message: "데이터가 부족합니다." });

        const urls = await Promise.all(filesInfo.map(async (file) => {
            const originalName = file.name || `unknown_file_${Date.now()}`;
            const safeFileName = originalName.replace(/\s+/g, '_');
            const fullPath = `${projectId}/${safeFileName}`;

            const command = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fullPath,
                ContentType: file.type || 'application/octet-stream',
            });

            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            const finalUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;

            return { originalName: originalName, uploadUrl, finalUrl }; 
        }));

        res.status(200).json({ urls });
    } catch (error) {
        console.error("❌ Presigned URL 생성 중 에러 발생:", error); 
        res.status(500).json({ message: error.message, stack: error.stack });
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
                event.bgm = replaceUrl(event.bgm);

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
        
        if (parsedData.startMenu && parsedData.startMenu.bgImage) {
            parsedData.startMenu.bgImage = replaceUrl(parsedData.startMenu.bgImage);
        }

        // JSON 저장
        const jsonBuffer = Buffer.from(JSON.stringify(parsedData, null, 2), 'utf-8');
        await s3.send(new PutObjectCommand({ 
            Bucket: process.env.R2_BUCKET_NAME, 
            Key: `${projectId}/data.json`, 
            Body: jsonBuffer, 
            ContentType: 'application/json' 
        }));
        
        // HTML 저장
        if (htmlContent) {
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            await s3.send(new PutObjectCommand({ 
                Bucket: process.env.R2_BUCKET_NAME, 
                Key: `${projectId}/index.html`, 
                Body: htmlBuffer, 
                ContentType: 'text/html' 
            }));
        }

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