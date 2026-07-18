import json
import os
from typing import List, Dict

# HS编码数据文件路径
HS_CODES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "hs_codes.json")


def load_hs_codes() -> List[Dict]:
    """加载HS编码库"""
    with open(HS_CODES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def match_hs_codes(product_info: dict) -> List[Dict]:
    """基于产品信息匹配HS编码，返回候选编码列表（1-3个）"""
    hs_codes = load_hs_codes()

    product_name = (product_info.get("product_name_cn") or "") + " " + (product_info.get("product_name_en") or "")
    material = product_info.get("material") or ""
    category = product_info.get("product_category") or ""
    specification = product_info.get("specification") or ""
    search_text = f"{product_name} {material} {category} {specification}".lower()

    scored = []
    for item in hs_codes:
        score = 0
        keywords = item.get("keywords", [])
        desc_cn = item.get("description_cn", "").lower()
        desc_en = item.get("description_en", "").lower()

        for kw in keywords:
            if kw.lower() in search_text:
                score += 3

        if any(word in desc_cn for word in search_text.split() if len(word) > 1):
            score += 2
        if any(word in desc_en for word in search_text.split() if len(word) > 2):
            score += 2

        if category and category.lower() in desc_cn:
            score += 5
        if category and category.lower() in desc_en:
            score += 5

        if score > 0:
            scored.append({
                "code": item["code"],
                "description_cn": item["description_cn"],
                "description_en": item["description_en"],
                "score": min(round(score / 15, 2), 1.0),
                "basis": item.get("classification_basis", ""),
                "risks": item.get("risks", [])
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:3] if scored else [{
        "code": "待人工确定",
        "description_cn": "无法自动匹配，建议人工查询",
        "description_en": "Manual lookup recommended",
        "score": 0,
        "basis": "产品信息不足或不在已知编码库中",
        "risks": []
    }]
