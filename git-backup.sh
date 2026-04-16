#!/bin/bash

# Git自动备份脚本

set -e

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 开始Git自动备份..."

cd /home/boz/.openclaw/workspace

# 检查是否是Git仓库
if [ ! -d .git ]; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 获取当前分支
BRANCH=$(git branch --show-current)
echo "🌿 分支: $BRANCH"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 发现未提交的更改，自动提交..."
    
    # 添加所有更改
    git add .
    
    # 提交消息
    COMMIT_MSG="自动备份: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 尝试提交
    if git commit -m "$COMMIT_MSG" >/dev/null 2>&1; then
        echo "✅ 自动提交成功: $COMMIT_MSG"
        HAS_NEW_COMMIT=true
    else
        echo "⚠️  没有需要提交的更改"
        HAS_NEW_COMMIT=false
    fi
else
    echo "✅ 工作区干净，无未提交更改"
    HAS_NEW_COMMIT=false
fi

# 拉取远程更新（非强制）
echo "⬇️  拉取远程更新..."
if git pull origin "$BRANCH" --rebase >/dev/null 2>&1; then
    echo "✅ 远程更新拉取成功"
else
    echo "⚠️  远程更新拉取失败或无需更新"
fi

# 推送本地更改
echo "⬆️  推送本地更改..."
if git push origin "$BRANCH" >/dev/null 2>&1; then
    echo "✅ 本地更改推送成功"
    
    # 显示推送信息
    LATEST_COMMIT=$(git log --oneline -1)
    echo "📦 最新提交: $LATEST_COMMIT"
else
    echo "❌ 推送失败"
    exit 1
fi

# 显示仓库状态
echo ""
echo "📊 仓库状态:"
echo "  分支: $BRANCH"
echo "  提交: $(git rev-parse --short HEAD)"
echo "  远程: $(git remote get-url origin | sed 's/.*@//')"
echo "  新提交: $HAS_NEW_COMMIT"

echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 备份完成"

# 记录日志
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/git-backup-$(date '+%Y-%m-%d').log"

{
    echo "=== 备份记录 $(date '+%Y-%m-%d %H:%M:%S') ==="
    echo "分支: $BRANCH"
    echo "提交: $(git rev-parse HEAD)"
    echo "新提交: $HAS_NEW_COMMIT"
    echo "状态: 成功"
    echo ""
} >> "$LOG_FILE"

echo "📝 日志已记录: $LOG_FILE"