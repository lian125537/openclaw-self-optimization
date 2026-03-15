# GitHub CLI 使用指南

## 操作时间
2026-03-06 14:00 GMT+8

## 目标
使用 GitHub CLI (gh) 来 Fork `lian125537/openclaw-self-optimization` 仓库

## 步骤 1: 安装 GitHub CLI

### Windows
```powershell
# 使用 Winget (推荐)
winget install --id GitHub.cli

# 或使用 Scoop
scoop install gh

# 或使用 Chocolatey
choco install gh
```

### macOS
```bash
# 使用 Homebrew (推荐)
brew install gh

# 或使用 MacPorts
sudo port install gh
```

### Linux

**Ubuntu/Debian:**
```bash
# 添加 GitHub CLI 仓库
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Fedora/RHEL:**
```bash
# 使用 DNF
sudo dnf install gh
```

**Arch Linux:**
```bash
# 使用 Pacman
sudo pacman -S github-cli
```

## 步骤 2: 验证安装

打开终端/命令行，运行：
```bash
gh --version
```

预期输出：
```
gh version X.Y.Z (YYYY-MM-DD)
```

## 步骤 3: 登录 GitHub

### 方法 1: 交互式登录 (推荐)
```bash
gh auth login
```

按照提示操作：
1. 选择登录方式: `GitHub.com`
2. 选择认证方式: `HTTPS`
3. 选择认证方法: `Login with a web browser`
4. 按照浏览器提示完成登录
5. 选择是否配置 Git: `Yes`
6. 选择是否启用 Git 协议: `HTTPS`

### 方法 2: 使用 Token 登录
```bash
# 生成 Personal Access Token
# 访问: https://github.com/settings/tokens
# 勾选: repo, workflow, delete_repo

# 使用 Token 登录
gh auth login --with-token < your-token.txt
```

### 方法 3: 使用环境变量
```bash
# 设置环境变量
export GITHUB_TOKEN=your_token_here

# 登录
gh auth login
```

## 步骤 4: 验证登录状态

```bash
gh auth status
```

预期输出：
```
github.com
  ✓ Logged in to github.com as your-username
  ✓ Git operations: HTTPS
  ✓ Token: *******************
```

## 步骤 5: Fork 仓库

### 基本 Fork 命令
```bash
gh repo fork lian125537/openclaw-self-optimization --clone=false
```

### 详细选项
```bash
# Fork 到个人账户
gh repo fork lian125537/openclaw-self-optimization --clone=false

# Fork 到组织账户
gh repo fork lian125537/openclaw-self-optimization --org=your-org-name --clone=false

# Fork 并克隆到本地
gh repo fork lian125537/openclaw-self-optimization --clone=true

# 指定本地克隆路径
gh repo fork lian125537/openclaw-self-optimization --clone=true --remote-name=origin
```

### 完整 Fork 流程
```bash
# 1. Fork 仓库
gh repo fork lian125537/openclaw-self-optimization --clone=false

# 2. 验证 Fork 成功
gh repo view your-username/openclaw-self-optimization

# 3. 克隆到本地 (可选)
gh repo clone your-username/openclaw-self-optimization
```

## 步骤 6: 验证 Fork 成功

### 检查远程仓库
```bash
# 列出所有远程仓库
gh repo list

# 查看特定仓库信息
gh repo view your-username/openclaw-self-optimization
```

### 通过浏览器验证
1. 访问: `https://github.com/your-username/openclaw-self-optimization`
2. 确认仓库内容完整

## 步骤 7: 配置 GitHub Actions

### 访问仓库设置
```bash
# 打开仓库设置页面
gh repo view your-username/openclaw-self-optimization --web
```

### 配置 Secrets
1. 进入 Settings > Secrets and variables > Actions
2. 添加以下 secrets:
   - `GITHUB_TOKEN`: GitHub Personal Access Token
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token (可选)
   - `TELEGRAM_CHAT_ID`: Telegram Chat ID (可选)

## 步骤 8: 启用自动化工作流

### 检查工作流文件
```bash
# 进入仓库目录
cd openclaw-self-optimization

# 查看工作流文件
ls -la .github/workflows/
```

### 手动触发工作流
```bash
# 触发每日分析工作流
gh workflow run daily-analysis.yml

# 查看工作流运行状态
gh run list --workflow=daily-analysis.yml
```

## 常见问题

### 问题 1: gh 命令未找到
**解决方案**:
- 检查安装是否成功: `gh --version`
- 重启终端/命令行
- 检查 PATH 环境变量

### 问题 2: 登录失败
**解决方案**:
- 检查网络连接
- 确保 Token 有正确权限
- 重新生成 Token 并重试

### 问题 3: Fork 失败
**解决方案**:
- 检查仓库是否存在
- 确保有 fork 权限
- 检查 GitHub 服务状态

### 问题 4: 权限不足
**解决方案**:
- 确保 Token 有 `repo` 权限
- 检查账户是否有限制
- 联系 GitHub 支持

## 完整操作流程

### 立即操作 (5分钟)
1. **安装 GitHub CLI** (如果未安装)
2. **登录 GitHub**: `gh auth login`
3. **Fork 仓库**: `gh repo fork lian125537/openclaw-self-optimization --clone=false`

### 配置自动化 (15分钟)
4. **配置 GitHub Actions Secrets**
5. **启用自动化工作流**
6. **测试自动化流程**

## 时间安排

### 当前时间
2026-03-06 14:00 GMT+8

### 预计完成时间
- 安装 GitHub CLI: 2-5 分钟
- 登录 GitHub: 2-3 分钟
- Fork 仓库: 1-2 分钟
- 配置 GitHub Actions: 10-15 分钟
- 启用自动化: 5-10 分钟
- **总时间**: 20-35 分钟完成基础配置

## 相关文件

- **GitHub CLI 使用指南**: `C:\Users\yodat\.openclaw\workspace\GitHubCLI使用指南.md`
- **仓库分析报告**: `C:\Users\yodat\.openclaw\workspace\仓库分析报告.md`
- **执行日志**: `C:\Users\yodat\.openclaw\workspace\执行日志.md`

---

**开始操作时间**: 2026-03-06 14:00 GMT+8
**预计完成时间**: 2026-03-06 14:35 GMT+8