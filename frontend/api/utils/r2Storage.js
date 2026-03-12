// backend/utils/r2Storage.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

// R2 클라이언트 세팅
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * @param file - multer를 통해 받은 파일 객체
 * @param projectId - 폴더명이 될 프로젝트 ID
 */
export const uploadToR2 = async (file, projectId) => {
    // 1. 폴더 경로 설정 (projectId가 없으면 'temp' 폴더에 저장)
    const folder = projectId ? `${projectId}/` : 'temp/';
    
    // 2. 고유 파일명 생성
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    // 3. 최종 저장 경로 (Key) -> "프로젝트ID/파일명" 형태가 됨
    const fullPath = folder + fileName;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fullPath, // ⭐ 이 부분이 핵심입니다.
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await s3.send(command);

    // 4. 반환 주소에도 폴더 경로가 포함되어야 함
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`;
    return publicUrl;
};