# Dify 部署指南

## 🎯 部署目标

在本地部署 Dify，体验智能体工作流平台功能。

## 📋 系统要求

- CPU >= 2 Core
- RAM >= 4 GiB
- Docker 和 Docker Compose 已安装

## 🚀 部署步骤

### 步骤 1: 进入 Docker 目录

```bash
cd C:\Users\yodat\.openclaw\workspace\dify\docker
```

### 步骤 2: 配置环境变量

```bash
cp .env.example .env
```

### 步骤 3: 启动 Docker Compose

```bash
docker compose up -d
```

### 步骤 4: 访问 Dify 仪表板

打开浏览器访问：http://localhost/install

## 🔧 配置说明

### 环境变量配置

编辑 `.env` 文件，配置以下参数：

```env
# 服务器配置
CONSOLE_API_URL=http://localhost:5001
SERVICE_API_URL=http://localhost:5001
APP_API_URL=http://localhost:5001
FILES_URL=http://localhost:5001

# 数据库配置
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=difyai123456
DB_DATABASE=dify

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=difyai123456
```

### 端口配置

- **Dify Web**: 3000
- **Dify API**: 5001
- **PostgreSQL**: 5432
- **Redis**: 6379

## 📊 验证部署

### 检查容器状态

```bash
docker compose ps
```

### 查看日志

```bash
docker compose logs -f
```

### 测试 API

```bash
curl http://localhost:5001/api/version
```

## 🎯 快速开始

### 1. 初始化设置

访问 http://localhost/install 完成初始化：

1. 创建管理员账户
2. 配置模型提供商
3. 设置工作空间

### 2. 创建第一个智能体

1. 进入 "Studio" → "Create App"
2. 选择 "Chatbot" 类型
3. 配置智能体参数
4. 测试对话功能

### 3. 设计工作流

1. 进入 "Studio" → "Create Workflow"
2. 拖拽节点构建工作流
3. 配置节点参数
4. 测试工作流执行

## 🔍 故障排除

### 问题 1: 端口冲突

**解决方案**:
```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# 修改 .env 文件中的端口
```

### 问题 2: Docker 启动失败

**解决方案**:
```bash
# 检查 Docker 状态
docker info

# 重启 Docker
docker restart

# 重新启动 Dify
docker compose up -d
```

### 问题 3: 数据库连接失败

**解决方案**:
```bash
# 检查数据库容器
docker compose ps

# 查看数据库日志
docker compose logs db

# 重启数据库容器
docker compose restart db
```

## 📈 学习路径

### 第 1 天: 部署和体验
- 部署 Dify 环境
- 创建第一个智能体
- 体验基本功能

### 第 2-3 天: 功能探索
- 学习工作流设计
- 了解模型集成
- 探索智能体开发

### 第 4-7 天: 深入学习
- 分析架构设计
- 研究代码结构
- 对比 OpenClaw

## 🎯 学习目标

### 短期目标（1 周）
- ✅ 成功部署 Dify
- ✅ 创建智能体应用
- ✅ 设计简单工作流

### 中期目标（2 周）
- ✅ 理解架构设计
- ✅ 掌握智能体开发
- ✅ 学习工作流引擎

### 长期目标（1 月）
- ✅ 改进 OpenClaw
- ✅ 开发新技能
- ✅ 优化自动化系统

---
*本指南由 OpenClaw 自我优化系统生成*