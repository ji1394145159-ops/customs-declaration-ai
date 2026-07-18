from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.declaration_service import (
    generate_declaration_elements, calculate_completeness, identify_risk_fields
)

router = APIRouter(prefix="/api/declaration", tags=["declaration"])


class DeclarationRequest(BaseModel):
    product_info: Dict[str, Any]
    target_country: str  # US, EU, ID, VN
    hs_code: str


class DeclarationUpdateRequest(BaseModel):
    declaration_id: str
    elements: Dict[str, Any]
    target_country: str


# 内存存储（demo阶段，后续可替换为数据库）
declarations_db = {}


@router.post("/generate")
async def generate_declaration(request: DeclarationRequest):
    """生成申报单"""
    try:
        result = generate_declaration_elements(
            request.product_info,
            request.target_country,
            request.hs_code
        )

        completeness = calculate_completeness(result["elements"])
        risk_fields = identify_risk_fields(request.product_info, result["elements"])

        import uuid
        declaration_id = str(uuid.uuid4())

        declaration = {
            "id": declaration_id,
            "target_country": request.target_country,
            "hs_code": request.hs_code,
            "declaration_elements": result["elements"],
            "compliance_notes": result["compliance_notes"],
            "completeness_score": completeness,
            "risk_fields": risk_fields,
            "status": "draft"
        }

        declarations_db[declaration_id] = declaration

        return {
            "success": True,
            "data": declaration
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"申报单生成失败: {str(e)}")


@router.put("/update")
async def update_declaration(request: DeclarationUpdateRequest):
    """更新申报单（人工修改后）"""
    if request.declaration_id not in declarations_db:
        raise HTTPException(status_code=404, detail="申报单不存在")

    declaration = declarations_db[request.declaration_id]
    declaration["declaration_elements"] = request.elements
    declaration["completeness_score"] = calculate_completeness(request.elements)
    declaration["status"] = "reviewed"

    return {
        "success": True,
        "data": declaration
    }


@router.post("/{declaration_id}/confirm")
async def confirm_declaration(declaration_id: str):
    """确认申报单"""
    if declaration_id not in declarations_db:
        raise HTTPException(status_code=404, detail="申报单不存在")

    declarations_db[declaration_id]["status"] = "confirmed"
    return {
        "success": True,
        "data": declarations_db[declaration_id]
    }


@router.get("/list")
async def list_declarations():
    """获取所有申报单列表"""
    return {
        "success": True,
        "data": list(declarations_db.values()),
        "total": len(declarations_db)
    }


@router.get("/{declaration_id}")
async def get_declaration(declaration_id: str):
    """获取单个申报单详情"""
    if declaration_id not in declarations_db:
        raise HTTPException(status_code=404, detail="申报单不存在")

    return {
        "success": True,
        "data": declarations_db[declaration_id]
    }
