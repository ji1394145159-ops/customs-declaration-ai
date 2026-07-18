import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import upload, extract, hscode, declaration, export
from app.database import init_db

app = FastAPI(
    title="跨境电商报关单据AI助手",
    description="AI驱动的报关单据处理平台",
    version="1.0.0"
)

# CORS 配置 - 允许所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(upload.router)
app.include_router(extract.router)
app.include_router(hscode.router)
app.include_router(declaration.router)
app.include_router(export.router)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
async def root():
    return {
        "name": "跨境电商报关单据AI助手",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
