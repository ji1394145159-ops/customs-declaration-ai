import json
import re
from app.services.ai_service import call_ai_with_image, encode_image_to_base64

EXTRACT_PROMPT = """你是一个专业的跨境电商报关信息提取助手。请仔细分析这张产品说明书/采购单/发票图片，提取以下关键信息。

请严格以JSON格式返回结果，不要添加任何额外说明文字。JSON格式如下：

{
  "product_name_cn": "中文品名",
  "product_name_en": "English Product Name",
  "specification": "规格型号",
  "material": "材质成分",
  "brand": "品牌",
  "product_category": "产品类别（如：锂电池、光伏组件、电子配件、纺织品等）",
  "quantity": 数量（整数）,
  "unit_price": 单价（数字）,
  "total_amount": 总金额（数字）,
  "currency": "币种（如USD、CNY、EUR）",
  "net_weight": 净重kg（数字）,
  "gross_weight": 毛重kg（数字）,
  "packaging": "包装方式",
  "origin_country": "原产地",
  "confidence": {
    "product_name_cn": {"value": "实际提取的值", "score": 0.95, "source": "direct"},
    "product_name_en": {"value": "实际提取的值", "score": 0.90, "source": "translated"}
  }
}

重要规则：
1. 对于无法从图片中直接识别的字段，请将值设为null，并在confidence中score设为0，source设为"unidentified"
2. confidence.score 表示置信度（0-1），source 可选值：
   - "direct": 直接从文档中识别
   - "inferred": 根据上下文推断
   - "translated": 翻译所得
   - "unidentified": 无法识别
3. 如果是中文文档，product_name_en 如需翻译，请在source中标注"translated"
4. 数量、金额等数字字段，如果无法识别请设为null，不要编造数字
5. 请尽量准确提取，不要臆测或编造信息"""


async def extract_info_from_image(file_path: str) -> dict:
    """从图片中提取产品信息"""
    image_base64 = await encode_image_to_base64(file_path)
    result_text = await call_ai_with_image(image_base64, EXTRACT_PROMPT)

    # 尝试从返回文本中提取JSON
    try:
        # 先尝试直接解析
        return json.loads(result_text)
    except json.JSONDecodeError:
        # 尝试从markdown代码块中提取
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        # 尝试找第一个{到最后一个}
        brace_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if brace_match:
            return json.loads(brace_match.group())
        raise ValueError(f"AI返回的内容无法解析为JSON: {result_text[:200]}")
