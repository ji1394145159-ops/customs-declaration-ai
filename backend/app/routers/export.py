from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List
from io import BytesIO
from app.services.export_service import export_to_excel, export_to_pdf

router = APIRouter(prefix="/api/export", tags=["export"])


class ExportRequest(BaseModel):
    target_country: str
    hs_code: str
    declaration_elements: Dict[str, Any]
    compliance_notes: List[str] = []
    completeness_score: float = 0
    risk_fields: List[Dict[str, Any]] = []


@router.post("/excel")
async def export_excel(request: ExportRequest):
    """导出Excel格式申报单"""
    try:
        data = request.model_dump()
        excel_bytes = export_to_excel(data)
        buffer = BytesIO(excel_bytes)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=declaration.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel导出失败: {str(e)}")


@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    """导出PDF格式申报单"""
    try:
        data = request.model_dump()
        pdf_bytes = export_to_pdf(data)
        buffer = BytesIO(pdf_bytes)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=declaration.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF导出失败: {str(e)}")
