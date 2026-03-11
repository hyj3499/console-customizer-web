// ==============================================================================
// 📄 파일 경로 : backend/index.js
// 🎯 주요 역할 : 프론트엔드 API 요청 처리 및 Cloudflare R2 클라우드 스토리지 관리 서버
//
// 💡 상세 기능 :
//   1. POST /api/projects/create : 신규 프로젝트 ID 중복 검사 및 생성.
//   2. POST /api/projects/login  : 클라우드(R2)에서 `data.json`을 읽어와 프론트엔드에 전달.
//   3. POST /api/projects/save   : 
//      - 전달받은 다수의 이미지 파일을 R2에 병렬 업로드 (속도 최적화).
//      - 프론트엔드에서 넘어온 JSON 데이터 속 임시 파일명들을 실제 R2 URL로 치환.
//      - 치환 완료된 JSON과 렌더링된 HTML을 각각 `data.json`, `index.html`로 R2에 저장.
// ==============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// --------------------------------------------------------
// 1. 서버 기본 설정 및 미들웨어
// --------------------------------------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// CORS 허용 (프론트엔드 요청 수락) 및 JSON 페이로드 크기 제한 해제 (대용량 데이터 대비)
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 파일 업로드 미들웨어: 메모리에 파일을 임시 보관하여 R2로 쏠 준비
const upload = multer({ storage: multer.memoryStorage() });

// --------------------------------------------------------
// 2. Cloudflare R2 (S3 호환 클라이언트) 초기화
// --------------------------------------------------------
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// 메모리 데이터베이스 (캐싱 및 비번 검증용)
const mockDB = {};

// --------------------------------------------------------
// ⭐ [도구] 단일 파일을 R2 클라우드에 업로드하는 헬퍼 함수
// --------------------------------------------------------
async function uploadToR2(file, projectId) {
    const folder = projectId ? `${projectId}/` : 'temp/';
    // 특수문자를 제거한 안전한 파일명 생성
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
    const fileName = `${Date.now()}-${safeFileName}`;
    const fullPath = folder + fileName;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fullPath,
        Body: file.buffer,
        ContentType: file.mimetype, // "image/png" 등을 명시해야 브라우저가 이미지로 인식
    });

    await s3.send(command);
    // 업로드 성공 후 만들어진 진짜 인터넷 주소(URL)를 반환
    return `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;
}

// --------------------------------------------------------
// [API 1] 프로젝트 생성
// --------------------------------------------------------
app.post('/api/projects/create', (req, res) => {
    const { id, pw } = req.body;
    if (mockDB[id]) return res.status(409).json({ message: "이미 존재하는 ID입니다." });

    mockDB[id] = { pw, data: {} };
    console.log(`🆕 계정 생성 완료: ${id}`);
    res.status(201).json({ success: true });
});

// --------------------------------------------------------
// [API 2] 데이터 불러오기 (로그인)
// --------------------------------------------------------
app.post('/api/projects/login', async (req, res) => {
    const { id, pw } = req.body;

    // 1차 메모리 비번 검증
    if (mockDB[id] && mockDB[id].pw !== pw && mockDB[id].pw !== '') {
        return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    try {
        console.log(`☁️ [${id}] R2 클라우드에서 data.json 탐색 중...`);

        // R2에서 데이터 꺼내오기
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${id}/data.json`,
        });

        const response = await s3.send(getCommand);
        const dataString = await response.Body.transformToString();
        const projectData = JSON.parse(dataString);

        // 빠른 후속 조회를 위해 메모리에 캐싱
        mockDB[id] = { pw: pw, data: projectData };

        console.log(`✅ [${id}] 클라우드 로드 성공!`);
        res.status(200).json(projectData);

    } catch (error) {
        console.error("❌ 불러오기 에러 (파일 없음 또는 ID 틀림):", error);
        res.status(404).json({ message: "클라우드에 저장된 데이터가 없거나 ID가 틀렸습니다." });
    }
});

// --------------------------------------------------------
// [API 3] 통합 저장소 (가장 중요한 핵심 API)
// --------------------------------------------------------
app.post('/api/projects/save', upload.array('files'), async (req, res) => {
    try {
        const { projectId, gameData, htmlContent } = req.body;
        const files = req.files || [];

        if (!projectId) return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });
        console.log(`📂 [${projectId}] 클라우드 동기화 시작 (첨부파일: ${files.length}개)`);

        // A. 여러 장의 사진을 R2에 업로드 (Promise.all을 사용해 속도 최적화)
        // { "원본파일명.png": "https://pub-123.../원본파일명.png" } 형태의 지도(Map) 생성
        const urlMap = {};
        if (files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                const r2Url = await uploadToR2(file, projectId);
                urlMap[file.originalname] = r2Url; 
            });
            await Promise.all(uploadPromises); // 병렬 처리로 속도 대폭 향상
        }

        // B. JSON 데이터 속 가짜 파일명들을 업로드된 진짜 R2 주소로 치환 (번역 작업)
        const parsedData = JSON.parse(gameData);
        
        // [헬퍼 함수] 이미지 주소를 찾아 치환해주는 로직
        const replaceUrl = (img) => {
            if (!img) return null;
            const key = typeof img === 'object' ? (img.name || img.preview) : img;
            return urlMap[key] || key; // 지도(urlMap)에 있으면 바꾸고, 없으면 기존 주소 유지
        };

        // 1) 대사창(Events) 내부 이미지 치환
        if (parsedData.events) {
            parsedData.events.forEach(event => {
                event.scenarios.forEach(sc => {
                    sc.protagonistImage = replaceUrl(sc.protagonistImage);
                    sc.heroineImage = replaceUrl(sc.heroineImage);
                    sc.bgImage = replaceUrl(sc.bgImage);
                    sc.src = replaceUrl(sc.src);
                });
            });
        }

        //추가) 커스텀 폰트 저장
        if (parsedData.customFonts) {
            parsedData.customFonts = parsedData.customFonts.map(font => {
                // 1. 프론트엔드에서 보낸 파일명 추출 (보통 폰트명.ttf 형식)
                const fontFileName = font.url; // 프론트 ProjectService에서 f.file.name을 여기 담아 보냄

                // 2. urlMap에서 실제 R2 주소 찾기
                // (만약 Mulmaru.ttf로 보냈다면 urlMap["Mulmaru.ttf"]에 값이 있음)
                const r2Url = urlMap[fontFileName] || font.url;

                return {
                    ...font,
                    url: r2Url 
                };
            });
}
        // 2) 주인공 및 캐릭터 스탠딩 이미지 치환
        if (parsedData.protagonist?.images) {
            parsedData.protagonist.images = parsedData.protagonist.images.map(replaceUrl);
        }
        if (parsedData.characters) {
            parsedData.characters.forEach(char => {
                if (char.images) char.images = char.images.map(replaceUrl);
            });
        }

        // C. 치환이 완벽히 끝난 JSON을 문자열로 바꿔 R2에 'data.json'으로 저장
        const jsonBuffer = Buffer.from(JSON.stringify(parsedData, null, 2), 'utf-8');
        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: `${projectId}/data.json`,
            Body: jsonBuffer,
            ContentType: 'application/json',
        }));
        console.log(`📄 [${projectId}] data.json 업로드 완료`);

        // D. HTML 내용도 R2에 'index.html'로 저장 (웹 호스팅용)
        if (htmlContent) {
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: `${projectId}/index.html`,
                Body: htmlBuffer,
                ContentType: 'text/html',
            }));
            console.log(`📄 [${projectId}] index.html 업로드 완료`);
        }

        // 메모리 업데이트
        mockDB[projectId] = { pw: mockDB[projectId]?.pw || '', data: parsedData };

        console.log(`✅ [${projectId}] 모든 클라우드 동기화 완벽 성공!`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("❌ 저장 에러:", error);
        res.status(500).json({ message: "서버 내부 오류로 저장에 실패했습니다.", error: error.message });
    }
});

// --------------------------------------------------------
// 서버 부팅
// --------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🚀 백엔드 클라우드 동기화 서버 가동 중: http://localhost:${PORT}`);
});