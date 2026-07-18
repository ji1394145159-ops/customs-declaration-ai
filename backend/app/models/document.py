from sqlalchemy import Column, String, Integer, DateTime, Text, Float, JSON
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Document(Base):
    """上传的原始单据"""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # jpg, png, pdf
    file_size = Column(Integer, default=0)
    status = Column(String, default="uploaded")  # uploaded, processing, extracted, completed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ExtractedInfo(Base):
    """AI提取的结构化信息"""
    __tablename__ = "extracted_info"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, nullable=False, index=True)

    # 产品基本信息
    product_name_cn = Column(String)  # 中文品名
    product_name_en = Column(String)  # 英文品名
    specification = Column(String)    # 规格型号
    material = Column(String)         # 材质成分
    brand = Column(String)            # 品牌
    product_category = Column(String) # 产品类别

    # 数量与金额
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_amount = Column(Float)
    currency = Column(String)

    # 重量与包装
    net_weight = Column(Float)        # 净重(kg)
    gross_weight = Column(Float)      # 毛重(kg)
    packaging = Column(String)        # 包装方式

    # 产地
    origin_country = Column(String)   # 原产地

    # 置信度（JSON存储各字段置信度）
    confidence = Column(JSON)         # {"field_name": {"value": "xxx", "confidence": 0.95, "source": "direct"}}

    created_at = Column(DateTime, server_default=func.now())
