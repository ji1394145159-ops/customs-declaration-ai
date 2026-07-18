# Zeabur 部署指南

## 前置准备

1. 注册 [Zeabur](https://zeabur.cn) 账号（支持微信/支付宝）
2. 将项目代码推送到 GitHub 仓库

## 部署步骤

### 第一步：推送到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "init: 跨境电商报关单据AI助手"
git remote add origin https://github.com/你的用户名/customs-declaration-ai.git
git push -u origin main
```

### 第二步：部署后端服务

1. 登录 Zeabur 控制台
2. 点击 **创建项目** → 选择区域（建议选 **中国大陆**）
3. 点击 **添加服务** → **从 GitHub 部署**
4. 选择你的仓库，**Root Directory** 填写 `backend`
5. Zeabur 会自动识别为 Python 项目
6. 在 **环境变量** 中添加：
   - `AI_PROVIDER` = `zhipuai`
   - `ZHIPUAI_API_KEY` = `你的智谱API Key`
   - `ZHIPUAI_MODEL` = `glm-4v-flash`
7. 部署完成后，记下后端的公网 URL（如 `https://xxx.zeabur.app`）

### 第三步：部署前端服务

1. 再次点击 **添加服务** → **从 GitHub 部署**
2. 选择同一个仓库，**Root Directory** 填写 `frontend`
3. 在 **环境变量** 中添加：
   - `VITE_API_URL` = `https://xxx.zeabur.app/api`（替换为第二步的后端 URL）
4. 部署完成后，Zeabur 会分配一个公网域名

### 第四步：配置自定义域名（可选）

1. 在 Zeabur 控制台中找到前端服务
2. 点击 **设置域名** → **自定义域名**
3. 输入你的域名，按提示配置 DNS 解析

## 注意事项

- 后端的 `uploads` 目录是临时存储，重启后会丢失（生产环境建议用对象存储）
- SQLite 数据库文件也会在重启后丢失（生产环境建议用 MySQL/PostgreSQL）
- 免费套餐有一定限制，详见 Zeabur 官方文档
