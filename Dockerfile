# 第一阶段：构建 React 前端
FROM node:16-alpine as build-stage

WORKDIR /app

# 复制 package.json 并安装依赖
COPY client/package.json client/package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install

# 复制前端源代码并构建
COPY client/ ./
RUN npm run build

# 第二阶段：构建 Python 后端
FROM python:3.9-slim

WORKDIR /app

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY . .

# 从前一阶段复制 React 构建产物到 client/build
COPY --from=build-stage /app/build ./client/build

# 清理旧数据库（如果存在）
RUN rm -f prod.db

EXPOSE 5000

ENV FLASK_APP=run.py

CMD ["sh", "-c", "flask db upgrade && gunicorn run:app --bind 0.0.0.0:5000"]
