# OpenClaw 自我优化系统 - 设置指南

## 🚀 快速设置

### 1. GitHub 认证配置

#### 方法 1: 使用 GitHub CLI (推荐)

```bash
# 登录 GitHub
gh auth login

# 按照提示操作：
# 1. 选择 "GitHub.com"
# 2. 选择 "HTTPS" 协议
# 3. 选择 "Yes" 来认证 Git
# 4. 选择 "Login with a web browser"
# 5. 复制提供的代码并完成浏览器认证
```

#### 方法 2: 使用 Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 点击 "Generate new token"
3. 选择权限：
   - `repo` (完全控制私有仓库)
   - `workflow` (更新 GitHub Actions 工作流)
   - `admin:org` (可选，用于组织管理)
4. 生成 Token 并保存

5. 配置环境变量：
```bash
# Windows (PowerShell)
$env:GITHUB_TOKEN="your_token_here"

# 或添加到 .env 文件
echo "GITHUB_TOKEN=your_token_here" >> .env
```

### 2. 创建 GitHub 仓库

```bash
# 使用 GitHub CLI 创建仓库
gh repo create openclaw-self-optimization --public --clone

# 或手动在 GitHub 网站创建
```

### 3. 推送代码到仓库

```bash
# 进入项目目录
cd openclaw-self-optimization

# 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit: OpenClaw 自我优化系统"

# 关联远程仓库
git remote add origin https://github.com/YOUR_USERNAME/openclaw-self-optimization.git

# 推送代码
git push -u origin main
```

### 4. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **GITHUB_TOKEN** - GitHub Personal Access Token
2. **TELEGRAM_BOT_TOKEN** - Telegram Bot Token (可选)
3. **TELEGRAM_CHAT_ID** - Telegram Chat ID (可选)

### 5. 启动自动化系统

GitHub Actions 会自动运行工作流。你也可以手动触发：

```bash
# 手动触发能力分析
gh workflow run daily-analysis.yml

# 手动触发技能推荐
gh workflow run skill-recommendation.yml

# 手动触发自动安装
gh workflow run auto-install.yml
```

## 📊 系统功能

### 每日能力分析 (每天凌晨 2 点)

- 分析 OpenClaw 系统状态
- 识别能力缺口
- 生成能力报告
- 创建 GitHub Issue

### 技能推荐 (每周三、六)

- 基于任务模式推荐技能
- 生成安装优先级
- 创建推荐报告

### 自动安装 (每周一、四)

- 安装推荐的技能
- 生成安装报告
- 验证安装结果

## 🔧 高级配置

### 自定义工作流时间

编辑 `.github/workflows/*.yml` 文件中的 `cron` 表达式：

```yaml
schedule:
  - cron: '0 18 * * *'  # 每天 UTC 18:00 (北京时间 02:00)
```

### 修改推荐算法

编辑 `config/settings.yml`：

```yaml
skill_recommendation:
  algorithm: "pattern_based"  # 可选: pattern_based/machine_learning/hybrid
```

### 配置通知方式

编辑 `config/settings.yml`：

```yaml
notifications:
  telegram:
    bot_token: "your_bot_token"
    chat_id: "your_chat_id"
```

## 📈 预期效果

| 阶段 | 自动化程度 | 更迭速度 | 能力增长 |
|------|------------|----------|----------|
| 当前 | 65/100 | 每周 1-2 次 | 线性增长 |
| 系统上线后 | 85/100 | 每天自动 | 指数增长 |

## 🐛 故障排除

### 问题 1: GitHub CLI 认证失败

**解决方案**:
```bash
# 清除现有认证
gh auth logout

# 重新认证
gh auth login
```

### 问题 2: 工作流执行失败

**检查步骤**:
1. 查看 GitHub Actions 日志
2. 检查 Secrets 配置是否正确
3. 验证 Python 脚本语法

### 问题 3: 技能安装失败

**解决方案**:
1. 检查 ClawHub CLI 是否安装
2. 验证技能 ID 是否正确
3. 查看安装日志

## 📞 支持

如有问题，请：
1. 查看 GitHub Issues
2. 检查日志文件
3. 联系管理员

---
*最后更新: 2026-03-06*