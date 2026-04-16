#!/bin/bash

# 使用GitHub token推送脚本
# 需要设置GITHUB_TOKEN环境变量

set -e

echo "🚀 使用GitHub Token推送代码..."

# 检查当前目录
if [ ! -d .git ]; then
    echo "❌ 当前目录不是Git仓库"
    exit 1
fi

# 检查token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 请设置GITHUB_TOKEN环境变量"
    echo "获取token: https://github.com/settings/tokens"
    echo "需要权限: repo"
    exit 1
fi

# 获取仓库信息
REPO_URL="https://github.com/lian125537/openclaw-self-optimization.git"
REPO_WITH_TOKEN="https://${GITHUB_TOKEN}@github.com/lian125537/openclaw-self-optimization.git"

echo "📦 仓库: $REPO_URL"
echo "🔑 使用token推送"

# 设置远程仓库
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_WITH_TOKEN"

# 验证连接
echo "验证远程连接..."
if git ls-remote origin >/dev/null 2>&1; then
    echo "✅ 远程仓库连接成功"
else
    echo "❌ 无法连接到远程仓库"
    echo "请检查:"
    echo "  1. Token是否有repo权限"
    echo "  2. 网络连接"
    exit 1
fi

# 获取当前分支
BRANCH=$(git branch --show-current)
echo "🌿 当前分支: $BRANCH"

# 显示将要推送的提交
echo ""
echo "📝 将要推送的提交:"
git log --oneline -5

echo ""
echo "是否继续推送? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "取消推送"
    exit 0
fi

# 推送代码
echo "推送代码..."
if git push --force origin "$BRANCH"; then
    echo "✅ 代码推送成功"
else
    echo "❌ 代码推送失败"
    exit 1
fi

# 恢复原始URL（不含token）
git remote set-url origin "$REPO_URL"

echo ""
echo "🎉 推送完成!"
echo ""
echo "📋 仓库信息:"
echo "  URL: https://github.com/lian125537/openclaw-self-optimization"
echo "  分支: $BRANCH"
echo "  提交: $(git rev-parse --short HEAD)"
echo ""
echo "🔗 查看仓库:"
echo "  https://github.com/lian125537/openclaw-self-optimization"