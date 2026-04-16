# GitHub SSH 配置指南

## 当前状态
- **仓库地址**: `https://github.com/lian125537/openclaw-self-optimization`
- **本地提交**: 3次 (等待推送)
- **认证方式**: 需要SSH密钥

## SSH 公钥
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDSxgpsXMFF9hjY5MR6RBNZOuv+BUA7SVZgiyEISculc steve@openclaw.ai
```

## 配置步骤

### 1. 添加SSH公钥到GitHub
1. 访问: https://github.com/settings/keys
2. 点击 "New SSH key"
3. 标题: `OpenClaw-VM`
4. 密钥类型: `Authentication Key`
5. 粘贴上面的公钥
6. 点击 "Add SSH key"

### 2. 测试连接
```bash
# 测试SSH连接
ssh -T git@github.com

# 应该看到:
# Hi lian125537! You've successfully authenticated...
```

### 3. 推送代码
```bash
cd /home/boz/.openclaw/workspace

# 检查远程配置
git remote -v

# 强制推送 (第一次)
git push --force origin master

# 或使用设置脚本
./setup-github-ssh.sh
```

## 本地Git状态
```
提交历史:
76aa8dd - 添加技能系统目录
75a98a1 - 初始提交: 核心身份和记忆文件  
d421e11 - 添加 .gitignore 文件

未跟踪文件:
- 46个记忆文件 (通过.gitignore过滤)
- 13个Claude技能文件
- 各种配置和脚本
```

## 备选方案

### 使用GitHub Token
如果SSH不行，使用token:
```bash
# 设置token环境变量
export GITHUB_TOKEN=你的token

# 使用token推送
./push-with-token.sh
```

获取token: https://github.com/settings/tokens
需要权限: `repo` (完整仓库访问)

### 手动HTTPS推送
```bash
git remote set-url origin https://github.com/lian125537/openclaw-self-optimization.git
git push --force origin master
# 输入用户名和密码/token
```

## 验证成功
推送成功后，访问:
https://github.com/lian125537/openclaw-self-optimization

应该看到:
- AGENTS.md
- SOUL.md  
- USER.md
- MEMORY.md
- skills/ 目录
- .gitignore

## 故障排除

### 问题: Permission denied (publickey)
```bash
# 检查SSH代理
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 测试连接
ssh -T git@github.com
```

### 问题: 仓库不存在或无权限
- 确认仓库URL正确
- 确认有推送权限
- 检查仓库是否公开/私有

### 问题: 网络连接
```bash
# 测试GitHub访问
curl -I https://github.com

# 测试SSH端口
nc -zv github.com 22
```

## 自动备份设置
推送成功后，设置自动备份:
```bash
# 创建备份脚本
chmod +x git-backup.sh

# 测试备份
./git-backup.sh

# 添加到cron (每天凌晨3点)
(crontab -l 2>/dev/null; echo "0 3 * * * cd /home/boz/.openclaw/workspace && ./git-backup.sh >> git-backup.log 2>&1") | crontab -
```

## 联系信息
- **仓库**: https://github.com/lian125537/openclaw-self-optimization
- **维护者**: Bo (lian125537)
- **AI助手**: 史蒂夫·乔布斯 🍎
- **创建时间**: 2026-04-16