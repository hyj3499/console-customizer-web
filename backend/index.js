import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
// ⭐ 중복 없이 한 줄로 깔끔하게 합쳤습니다!
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// 1. 환경 변수 및 초기 세팅
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// 미들웨어: CORS 허용 및 대용량 JSON 허용
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 2. Cloudflare R2 (S3 Client) 설정
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// 파일 업로드를 위한 multer (메모리 방식)
const upload = multer({ storage: multer.memoryStorage() });

// 3. 임시 데이터베이스 (빠른 검증용)
const mockDB = {};

/**
 * [도구] R2 업로드 함수 (ID별 폴더 생성 포함)
 */
async function uploadToR2(file, projectId) {
    const folder = projectId ? `${projectId}/` : 'temp/';
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const fullPath = folder + fileName;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fullPath,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3.send(command);
    return `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;
}

/**
 * [API 1] 계정 생성 (POST /api/projects/create)
 */
app.post('/api/projects/create', (req, res) => {
    const { id, pw } = req.body;
    if (mockDB[id]) return res.status(409).json({ message: "이미 있는 ID입니다." });

    mockDB[id] = { pw, data: {} };
    console.log(`🆕 계정 생성 완료: ${id}`);
    res.status(201).json({ success: true });
});

/**
 * [API 2] 로그인/불러오기 (POST /api/projects/login)
 * ⭐ 클라우드(R2) 폴더에 직접 접근해서 data.json을 꺼내옵니다.
 */
app.post('/api/projects/login', async (req, res) => {
    const { id, pw } = req.body;

    // 서버가 안 꺼졌다면 메모리에 있는 비번으로 1차 검사
    if (mockDB[id] && mockDB[id].pw !== pw && mockDB[id].pw !== '') {
        return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    try {
        console.log(`☁️ [${id}] 클라우드에서 데이터 찾는 중...`);

        // 1. R2에서 해당 ID 폴더의 data.json 파일 가져오기
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${id}/data.json`,
        });

        const response = await s3.send(getCommand);
        
        // 2. 파일 내용을 텍스트로 변환 후 JSON으로 파싱
        const dataString = await response.Body.transformToString();
        const projectData = JSON.parse(dataString);

        // 3. 서버 메모리 백업 (비밀번호도 같이 저장해둠)
        mockDB[id] = { pw: pw, data: projectData };

        console.log(`✅ [${id}] 클라우드 로드 성공!`);
        res.status(200).json(projectData);

    } catch (error) {
        console.error("불러오기 에러:", error);
        // 파일이 없거나 에러가 났을 때
        res.status(404).json({ message: "클라우드에 저장된 데이터가 없거나 ID가 틀렸습니다." });
    }
});

/**
 * [API 3] 통합 저장 (POST /api/projects/save)
 * 사진 업로드 + HTML 텍스트 + JSON 데이터를 모두 R2 클라우드에 파일로 저장
 */
app.post('/api/projects/save', upload.array('files'), async (req, res) => {
    try {
        const { projectId, gameData, htmlContent } = req.body;
        const files = req.files;

        if (!projectId) return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });

        console.log(`📂 [${projectId}] 폴더 클라우드 저장 시작...`);

        // A. 사진들을 R2 폴더로 업로드
        const urlMap = {};
        if (files && files.length > 0) {
            for (const file of files) {
                const r2Url = await uploadToR2(file, projectId);
                urlMap[file.originalname] = r2Url;
            }
        }

        // B. 스크립트 데이터 파싱 및 이미지 주소 치환
// B. 스크립트 데이터 파싱 및 이미지 주소 치환
        const parsedData = JSON.parse(gameData);
        
        // 1. 이벤트(대사창) 안의 이미지 치환 (기존에 있던 것)
        if (parsedData.events) {
            parsedData.events.forEach(event => {
                event.scenarios.forEach(sc => {
                    if (urlMap[sc.protagonistImage]) sc.protagonistImage = urlMap[sc.protagonistImage];
                    if (urlMap[sc.heroineImage]) sc.heroineImage = urlMap[sc.heroineImage];
                    if (urlMap[sc.bgImage]) sc.bgImage = urlMap[sc.bgImage];
                    if (sc.isCg && urlMap[sc.src]) sc.src = urlMap[sc.src];
                });
            });
        }

        // ⭐ 2. [추가] 주인공과 등장인물 스탠딩 이미지도 진짜 R2 주소로 치환!
        if (parsedData.protagonist && parsedData.protagonist.images) {
            parsedData.protagonist.images = parsedData.protagonist.images.map(img => {
                // img가 객체일 경우(name 속성 확인), 문자열일 경우 모두 대응
                const fileName = typeof img === 'object' ? (img.name || img.preview) : img;
                return urlMap[fileName] || fileName; // 찾으면 R2주소, 없으면 원래 값
            });
        }

        if (parsedData.characters) {
            parsedData.characters.forEach(char => {
                if (char.images) {
                    char.images = char.images.map(img => {
                        const fileName = typeof img === 'object' ? (img.name || img.preview) : img;
                        return urlMap[fileName] || fileName;
                    });
                }
            });
        }
                // C. 치환이 끝난 최종 JSON 데이터를 R2에 'data.json' 파일로 저장... (이하 동일)
        // C. 치환이 끝난 최종 JSON 데이터를 R2에 'data.json' 파일로 저장
        const finalJsonString = JSON.stringify(parsedData, null, 2);
        const jsonBuffer = Buffer.from(finalJsonString, 'utf-8');

        const jsonCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${projectId}/data.json`,
            Body: jsonBuffer,
            ContentType: 'application/json',
        });
        await s3.send(jsonCommand);
        console.log(`📄 [${projectId}] data.json 클라우드 저장 완료`);

        // D. HTML 내용도 R2에 'index.html' 파일로 저장
        if (htmlContent) {
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            const htmlCommand = new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: `${projectId}/index.html`,
                Body: htmlBuffer,
                ContentType: 'text/html',
            });
            await s3.send(htmlCommand);
            console.log(`📄 [${projectId}] index.html 클라우드 저장 완료`);
        }

        mockDB[projectId] = { pw: mockDB[projectId]?.pw || '', data: parsedData };

        console.log(`✅ [${projectId}] 모든 데이터 클라우드 저장 완벽 성공!`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("저장 에러:", error);
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 백엔드 통합 서버 실행 중: http://localhost:${PORT}`);
});