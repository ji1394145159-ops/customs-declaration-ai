import json
import os
from typing import Dict, List

# 合规规则库
COMPLIANCE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "compliance.json")


def load_compliance_rules() -> Dict:
    """加载合规规则库"""
    with open(COMPLIANCE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_declaration_elements(product_info: dict, target_country: str, hs_code: str) -> Dict:
    """根据目标国和产品信息生成申报要素"""
    rules = load_compliance_rules()
    country_rules = rules.get(target_country, rules.get("US", {}))

    elements = {}
    compliance_notes = []

    # 基础要素（所有国家通用）
    elements["商品描述"] = product_info.get("product_name_cn", "") or product_info.get("product_name_en", "")
    elements["英文描述"] = product_info.get("product_name_en", "")
    elements["HS编码"] = hs_code
    elements["数量"] = product_info.get("quantity", "")
    elements["单位"] = "件"
    elements["单价"] = product_info.get("unit_price", "")
    elements["总金额"] = product_info.get("total_amount", "")
    elements["币种"] = product_info.get("currency", "USD")
    elements["净重(kg)"] = product_info.get("net_weight", "")
    elements["毛重(kg)"] = product_info.get("gross_weight", "")
    elements["原产国"] = product_info.get("origin_country", "中国")
    elements["包装方式"] = product_info.get("packaging", "")

    # 目标国特定要素
    required_fields = country_rules.get("required_fields", [])
    for field_def in required_fields:
        field_name = field_def["name"]
        if field_name not in elements:
            elements[field_name] = field_def.get("default", "")

    # 合规提示
    category = product_info.get("product_category", "")
    special_rules = country_rules.get("special_categories", {})
    for cat_key, cat_rules in special_rules.items():
        if cat_key.lower() in category.lower():
            compliance_notes.extend(cat_rules.get("notes", []))
            # 添加特殊字段
            for extra_field in cat_rules.get("extra_fields", []):
                elements[extra_field["name"]] = extra_field.get("default", "")

    # 通用合规提示
    compliance_notes.extend(country_rules.get("general_notes", []))

    return {
        "elements": elements,
        "compliance_notes": compliance_notes
    }


def calculate_completeness(elements: dict) -> float:
    """计算申报要素完整度评分"""
    total = len(elements)
    if total == 0:
        return 0

    filled = sum(1 for v in elements.values() if v is not None and v != "" and v != "待确认")
    return round(filled / total * 100, 1)


def identify_risk_fields(product_info: dict, elements: dict) -> List[Dict]:
    """识别高风险/低置信度字段"""
    risks = []

    confidence = product_info.get("confidence", {})
    for field, conf_data in confidence.items():
        if isinstance(conf_data, dict):
            score = conf_data.get("score", 0)
            source = conf_data.get("source", "")
            if score < 0.5:
                risks.append({
                    "field": field,
                    "reason": f"置信度过低({score})",
                    "suggestion": "建议人工核实"
                })
            elif source == "inferred":
                risks.append({
                    "field": field,
                    "reason": "AI推断，非直接识别",
                    "suggestion": "建议人工确认"
                })

    # 检查关键字段缺失
    critical_fields = ["product_name_cn", "product_name_en", "quantity", "total_amount"]
    for field in critical_fields:
        if not product_info.get(field):
            risks.append({
                "field": field,
                "reason": "关键字段缺失",
                "suggestion": "需要人工补充"
            })

    return risks
