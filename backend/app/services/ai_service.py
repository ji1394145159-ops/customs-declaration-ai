import base64
import json
import httpx
from app.config import (
    AI_PROVIDER, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL,
    DASHSCOPE_API_KEY, DASHSCOPE_MODEL, ZHIPUAI_API_KEY, ZHIPUAI_MODEL
)


async def encode_image_to_base64(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


async def call_ai_with_image(image_base64: str, prompt: str) -> str:
    """调用多模态大模型，传入图片和prompt，返回文本结果"""
    if AI_PROVIDER == "openai":
        return await _call_openai(image_base64, prompt)
    elif AI_PROVIDER == "dashscope":
        return await _call_dashscope(image_base64, prompt)
    elif AI_PROVIDER == "zhipuai":
        return await _call_zhipuai(image_base64, prompt)
    else:
        raise ValueError(f"Unsupported AI provider: {AI_PROVIDER}")


async def call_ai_text_only(prompt: str) -> str:
    """纯文本调用大模型"""
    if AI_PROVIDER == "openai":
        return await _call_openai_text(prompt)
    elif AI_PROVIDER == "dashscope":
        return await _call_dashscope_text(prompt)
    elif AI_PROVIDER == "zhipuai":
        return await _call_zhipuai_text(prompt)
    else:
        raise ValueError(f"Unsupported AI provider: {AI_PROVIDER}")


# ============ OpenAI ============

async def _call_openai(image_base64: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENAI_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                    }
                ]
            }
        ],
        "max_tokens": 4096
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(f"{OPENAI_BASE_URL}/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_openai_text(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENAI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(f"{OPENAI_BASE_URL}/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ============ DashScope (通义千问) ============

async def _call_dashscope(image_base64: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": DASHSCOPE_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }
        ]
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            json=payload, headers=headers
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_dashscope_text(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": DASHSCOPE_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            json=payload, headers=headers
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ============ ZhipuAI (智谱) ============

async def _call_zhipuai(image_base64: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {ZHIPUAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": ZHIPUAI_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }
        ]
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            json=payload, headers=headers
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_zhipuai_text(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {ZHIPUAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": ZHIPUAI_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            json=payload, headers=headers
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
