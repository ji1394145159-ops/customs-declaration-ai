from sqlalchemy import Column, String, Integer, DateTime, Text, Float, JSON
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Declaration(Base):
    """生成的申报单"""
    __tablename__ = "declarations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False, index=True)
    extracted_info_id = Column(String, nullable=False)

    # 目标国
    target_country = Column(String, nullable=False)  # US, EU, ID, VN

    # HS编码
    hs_code = Column(String)
    hs_code_candidates = Column(JSON)  # [{"code": "8507.60", "desc": "...", "score": 0.95}]
    hs_classification_basis = Column(Text)  # 归类依据

    # 申报要素（JSON存储）
    declaration_elements = Column(JSON)  # {"field": "value", ...}
    compliance_notes = Column(JSON)      # ["提示1", "提示2"]

    # 状态
    status = Column(String, default="draft")  # draft, reviewed, confirmed
    completeness_score = Column(Float)        # 完整度评分 0-100
    risk_fields = Column(JSON)                # 高风险字段列表

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
