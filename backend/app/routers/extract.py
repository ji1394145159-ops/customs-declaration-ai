from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.extract_service import extract_info_from_image

router = APIRouter(prefix="/api/extract", tags=["extract"])


class ExtractRequest(BaseModel):
    file_path: str
    file_type: str


class ExtractResponse(BaseModel):
    product_name_cn: Optional[str] = None
    product_name_en: Optional[str] = None
    specification: Optional[str] = None
    material: Optional[str] = None
    brand: Optional[str] = None
    product_category: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    net_weight: Optional[float] = None
    gross_weight: Optional[float] = None
    packaging: Optional[str] = None
    origin_country: Optional[str] = None
    confidence: Optional[Dict[str, Any]] = None


@router.post("", response_model=dict)
async def extract_info(request: ExtractRequest):
    """从上传的文件中提取关键信息"""
    import os
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="文件不存在")

    try:
        result = await extract_info_from_image(request.file_path)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"信息提取失败: {str(e)}")
