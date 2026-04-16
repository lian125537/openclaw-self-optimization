#!/bin/bash

# Git 远程仓库设置脚本
# 用于设置OpenClaw工作空间的远程备份

set -e

echo "🚀 开始设置Git远程仓库..."

# 检查当前目录是否是Git仓库
if [ ! -d .git ]; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 检查是否有远程仓库
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$REMOTE_URL" ]; then
    echo "📦 已有远程仓库: $REMOTE_URL"
    echo "是否更新? (y/n)"
    read -r UPDATE_REMOTE
    if [ "$UPDATE_REMOTE" != "y" ]; then
        echo "跳过远程仓库设置"
        exit 0
    fi
fi

# 显示当前Git状态
echo ""
echo "📊 当前Git状态:"
git status --short
echo ""

# 显示最近提交
echo "📝 最近提交:"
git log --oneline -5
echo ""

# 提示用户选择远程仓库类型
echo "请选择远程仓库类型:"
echo "1) GitHub (推荐)"
echo "2) GitLab"
echo "3) Gitee"
echo "4) 其他 (手动输入URL)"
echo "5) 跳过"
read -r REPO_CHOICE

case $REPO_CHOICE in
    1)
        REPO_TYPE="github"
        DEFAULT_DOMAIN="github.com"
        ;;
    2)
        REPO_TYPE="gitlab"
        DEFAULT_DOMAIN="gitlab.com"
        ;;
    3)
        REPO_TYPE="gitee"
        DEFAULT_DOMAIN="gitee.com"
        ;;
    4)
        REPO_TYPE="other"
        ;;
    5)
        echo "跳过远程仓库设置"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

if [ "$REPO_TYPE" = "other" ]; then
    echo "请输入远程仓库URL (例如: https://git.example.com/username/repo.git):"
    read -r REMOTE_URL
else
    echo "请输入用户名/组织名:"
    read -r USERNAME
    
    echo "请输入仓库名 (建议: openclaw-workspace):"
    read -r REPO_NAME
    
    if [ -z "$REPO_NAME" ]; then
        REPO_NAME="openclaw-workspace"
    fi
    
    REMOTE_URL="https://${DEFAULT_DOMAIN}/${USERNAME}/${REPO_NAME}.git"
    
    echo ""
    echo "📋 仓库信息:"
    echo "类型: $REPO_TYPE"
    echo "URL: $REMOTE_URL"
    echo ""
    echo "⚠️  请确保仓库已创建:"
    echo "  1. 登录 $DEFAULT_DOMAIN"
    echo "  2. 创建新仓库: $REPO_NAME"
    echo "  3. 不要初始化README、.gitignore等文件"
    echo ""
    echo "是否已创建仓库? (y/n)"
    read -r REPO_CREATED
    
    if [ "$REPO_CREATED" != "y" ]; then
        echo "请先创建仓库，然后重新运行此脚本"
        exit 1
    fi
fi

# 设置远程仓库
echo "设置远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

# 验证远程仓库
echo "验证远程连接..."
if git ls-remote origin >/dev/null 2>&1; then
    echo "✅ 远程仓库连接成功"
else
    echo "❌ 无法连接到远程仓库"
    echo "请检查:"
    echo "  1. 网络连接"
    echo "  2. 仓库URL是否正确"
    echo "  3. 是否有访问权限"
    exit 1
fi

# 推送代码
echo "推送代码到远程仓库..."
BRANCH_NAME=$(git branch --show-current)

# 第一次推送可能需要强制推送
echo "是否强制推送? (第一次推送通常需要) (y/n)"
read -r FORCE_PUSH

if [ "$FORCE_PUSH" = "y" ]; then
    git push -u origin "$BRANCH_NAME" --force
else
    git push -u origin "$BRANCH_NAME"
fi

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功"
else
    echo "❌ 代码推送失败"
    exit 1
fi

# 创建推送钩子 (自动推送)
echo "创建自动推送钩子..."
HOOK_FILE=".git/hooks/post-commit"
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# 提交后自动推送

# 等待1秒，避免冲突
sleep 1

# 获取当前分支
BRANCH=$(git branch --show-current)

# 尝试推送
if git push origin "$BRANCH" 2>/dev/null; then
    echo "✅ 自动推送成功"
else
    echo "⚠️  自动推送失败，请手动推送"
fi
EOF

chmod +x "$HOOK_FILE"
echo "✅ 自动推送钩子已创建"

# 创建备份脚本
echo "创建定期备份脚本..."
BACKUP_SCRIPT="git-backup.sh"
cat > "$BACKUP_SCRIPT" << 'EOF'
#!/bin/bash
# Git定期备份脚本

set -e

echo "[$(date)] 开始Git备份..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "有未提交的更改，自动提交..."
    git add .
    git commit -m "自动备份: $(date '+%Y-%m-%d %H:%M:%S')" || true
fi

# 拉取远程更新
echo "拉取远程更新..."
git pull origin main --rebase 2>/dev/null || true

# 推送本地更改
echo "推送本地更改..."
if git push origin main 2>/dev/null; then
    echo "✅ 备份成功"
else
    echo "❌ 备份失败"
    exit 1
fi

echo "[$(date)] 备份完成"
EOF

chmod +x "$BACKUP_SCRIPT"
echo "✅ 备份脚本已创建: $BACKUP_SCRIPT"

# 添加到cron定时任务
echo "添加到cron定时任务 (每天凌晨3点备份)..."
CRON_JOB="0 3 * * * cd $(pwd) && ./git-backup.sh >> git-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "git-backup.sh"; echo "$CRON_JOB") | crontab -

echo ""
echo "🎉 Git远程仓库设置完成!"
echo ""
echo "📋 总结:"
echo "  远程仓库: $REMOTE_URL"
echo "  当前分支: $BRANCH_NAME"
echo "  自动推送: 已启用 (提交后自动推送)"
echo "  定期备份: 每天凌晨3点"
echo "  备份脚本: ./git-backup.sh"
echo ""
echo "🔧 手动备份命令:"
echo "  ./git-backup.sh"
echo ""
echo "📁 查看远程仓库:"
echo "  git remote -v"
echo "  git log --oneline --graph --all"