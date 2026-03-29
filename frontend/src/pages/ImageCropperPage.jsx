import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // 라이브러리 필수 CSS

export default function ImageCropperPage() {
    const [imgSrc, setImgSrc] = useState('');
    const [originalFile, setOriginalFile] = useState(null);
    const imgRef = useRef(null);
    
    // 자르기 영역 상태
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    
    // 비율 상태 (디폴트 1:1)
    const [aspectX, setAspectX] = useState(1);
    const [aspectY, setAspectY] = useState(1);
    
    // 결과물 이미지 URL
    const [croppedImgUrl, setCroppedImgUrl] = useState('');

    // 1️⃣ 이미지 업로드 핸들러
    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setOriginalFile(file);
            
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(file);
            setCroppedImgUrl(''); // 새 이미지 올리면 결과물 초기화
        }
    };

    // 2️⃣ 이미지가 로드될 때 박스를 가운데에, 설정된 비율로 띄우기
    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;
        
        const aspect = aspectX / aspectY;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 80 }, aspect, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    };

    // 3️⃣ 비율(Aspect Ratio) 입력 변경 핸들러
    const handleAspectChange = (axis, value) => {
        const numValue = Number(value) || 1;
        if (axis === 'x') setAspectX(numValue);
        if (axis === 'y') setAspectY(numValue);

        // 이미 이미지가 있다면 박스 비율 즉시 업데이트
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            const newAspect = axis === 'x' ? (numValue / aspectY) : (aspectX / numValue);
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 80 }, newAspect, width, height),
                width,
                height
            );
            setCrop(newCrop);
        }
    };

    // 4️⃣ 캔버스를 이용해 실제 이미지 자르기 처리
    const handleCropImage = () => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 원본 이미지의 실제 픽셀 비율 계산
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // 캔버스의 이미지를 Blob(파일 형태)로 변환하여 브라우저에 띄움
        canvas.toBlob((blob) => {
            if (!blob) return;
            if (croppedImgUrl) URL.revokeObjectURL(croppedImgUrl); // 메모리 누수 방지
            setCroppedImgUrl(URL.createObjectURL(blob));
        }, originalFile.type);
    };

    // 5️⃣ 이미지 저장 (날짜_원본이름.확장자 형식)
    const handleSaveImage = () => {
        if (!croppedImgUrl || !originalFile) return;

        // 오늘 날짜 구하기 (예: 20260329)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // "20260329"

        // 원본 파일 이름 분리 (이름 / 확장자)
        const lastDotIndex = originalFile.name.lastIndexOf('.');
        const baseName = originalFile.name.substring(0, lastDotIndex);
        const extension = originalFile.name.substring(lastDotIndex); // ".png" 등

        const newFileName = `${dateStr}_${baseName}${extension}`;

        // 다운로드 링크 생성 및 클릭 유도
        const link = document.createElement('a');
        link.href = croppedImgUrl;
        link.download = newFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

return (
        <div className="cropper-page-container">
            {/* ⭐ 모바일 반응형 처리를 위한 내부 스타일 추가 */}
            <style>{`
                .cropper-page-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
                .cropper-layout { display: flex; gap: 30px; margin-top: 20px; align-items: flex-start; }
                .cropper-viewer { flex: 1; background-color: #f8f9fa; border: 2px dashed #ced4da; border-radius: 8px; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; width: 100%; box-sizing: border-box; overflow: hidden; }
                .cropper-controls { width: 300px; display: flex; flex-direction: column; gap: 20px; flex-shrink: 0; }
                
                /* 📱 모바일 최적화 (768px 이하일 때 세로 배치로 변경) */
                @media screen and (max-width: 768px) {
                    .cropper-page-container { padding: 15px 10px; }
                    .cropper-layout { flex-direction: column; gap: 15px; }
                    .cropper-viewer { min-height: 300px; padding: 10px; border-width: 1.5px; }
                    .cropper-controls { width: 100%; }
                    .aspect-inputs { justify-content: center; } /* 모바일에서 비율 입력창 가운데 정렬 */
                }
            `}</style>

            <h2 style={{ color: '#1971c2', borderBottom: '2px solid #e7f5ff', paddingBottom: '10px', fontSize: '20px', margin: '0 0 10px 0' }}>✂️ 간편 이미지 자르기 도구</h2>
            <p style={{ color: '#868e96', fontSize: '13px', margin: '0 0 15px 0' }}>배경이나 CG 일러스트를 원하는 비율로 쉽게 자를 수 있습니다.</p>

            <div className="cropper-layout">
                
                {/* ⬅️ 왼쪽: 이미지 뷰어 영역 */}
                <div className="cropper-viewer">
                    {!imgSrc ? (
                        <div style={{ textAlign: 'center' }}>
                            <label style={{ cursor: 'pointer', backgroundColor: '#1971c2', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>
                                📁 이미지 파일 업로드
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                            <p style={{ marginTop: '15px', color: '#adb5bd', fontSize: '13px' }}>버튼을 눌러 이미지를 선택하세요</p>
                        </div>
                    ) : (
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspectX / aspectY}
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        >
                            <img ref={imgRef} src={imgSrc} alt="Upload" onLoad={onImageLoad} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
                        </ReactCrop>
                    )}
                </div>

                {/* ➡️ 오른쪽: 컨트롤 패널 */}
                <div className="cropper-controls">
                    
                    <div style={{ backgroundColor: '#fff', border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📐 비율 설정</h4>
                        <div className="aspect-inputs" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="number" value={aspectX} min="1" 
                                onChange={(e) => handleAspectChange('x', e.target.value)} 
                                style={{ width: '60px', padding: '8px', textAlign: 'center', border: '1px solid #ced4da', borderRadius: '4px' }} 
                            />
                            <span style={{ fontWeight: 'bold', color: '#868e96' }}>:</span>
                            <input 
                                type="number" value={aspectY} min="1" 
                                onChange={(e) => handleAspectChange('y', e.target.value)} 
                                style={{ width: '60px', padding: '8px', textAlign: 'center', border: '1px solid #ced4da', borderRadius: '4px' }} 
                            />
                        </div>
                        <div className="aspect-inputs" style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => { handleAspectChange('x', 16); handleAspectChange('y', 9); }} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '4px', fontWeight: 'bold', color: '#495057' }}>16:9 (배경)</button>
                            <button onClick={() => { handleAspectChange('x', 1); handleAspectChange('y', 1); }} style={{ flex: 1, padding: '6px 8px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '4px', fontWeight: 'bold', color: '#495057' }}>1:1 (얼굴)</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            onClick={handleCropImage} 
                            disabled={!imgSrc}
                            style={{ padding: '12px', backgroundColor: imgSrc ? '#20c997' : '#e9ecef', color: imgSrc ? '#fff' : '#adb5bd', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: imgSrc ? 'pointer' : 'not-allowed', fontSize: '15px', transition: '0.2s' }}
                        >
                            ✂️ 영역만큼 이미지 자르기
                        </button>
                        
                        <label style={{ textAlign: 'center', cursor: 'pointer', color: '#495057', fontSize: '13px', textDecoration: 'underline', marginTop: '5px' }}>
                            다른 이미지 업로드하기...
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {/* 자르기 결과 미리보기 및 저장 */}
                    {croppedImgUrl && (
                        <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #a5d8ff', textAlign: 'center' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#1971c2', fontSize: '15px' }}>✨ 결과물 미리보기</h4>
                            <img src={croppedImgUrl} alt="Cropped" style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid #ced4da', marginBottom: '15px' }} />
                            <button 
                                onClick={handleSaveImage}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#1971c2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            >
                                💾 저장하기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}