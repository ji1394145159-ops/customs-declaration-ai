from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.services.hs_service import match_hs_codes

router = APIRouter(prefix="/api/hscode", tags=["hscode"])


class HSMatchRequest(BaseModel):
    product_name_cn: Optional[str] = None
    product_name_en: Optional[str] = None
    material: Optional[str] = None
    product_category: Optional[str] = None
    specification: Optional[str] = None


class HSCodeCandidate(BaseModel):
    code: str
    description_cn: str
    description_en: str
    score: float
    basis: str
    risks: List[str]


@router.post("/match", response_model=dict)
async def match_hs_code(request: HSMatchRequest):
    """匹配HS编码"""
    product_info = request.model_dump()
    candidates = match_hs_codes(product_info)
    return {
        "success": True,
        "candidates": candidates,
        "total": len(candidates)
    }
