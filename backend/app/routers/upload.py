import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """上传单个文件"""
    # 检查文件扩展名
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件格式: {ext}，仅支持 JPG/PNG/PDF")

    # 读取文件内容
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"文件过大，最大支持 {MAX_FILE_SIZE // 1024 // 1024}MB")

    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    # 确保上传目录存在
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 保存文件
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return {
        "id": file_id,
        "filename": file.filename,
        "file_path": file_path,
        "file_type": ext.lstrip("."),
        "file_size": len(content),
        "status": "uploaded"
    }


@router.post("/batch")
async def upload_batch(files: list[UploadFile] = File(...)):
    """批量上传文件"""
    results = []
    for file in files:
        try:
            result = await upload_file(file)
            results.append(result)
        except HTTPException as e:
            results.append({"filename": file.filename, "error": e.detail})
    return {"files": results, "total": len(results), "success": sum(1 for r in results if "error" not in r)}
