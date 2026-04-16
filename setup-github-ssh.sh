#!/bin/bash

# GitHub SSH配置脚本

echo "🔑 配置GitHub SSH访问..."

# 检查是否已有SSH密钥
if [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_rsa ]; then
    echo "✅ 已有SSH密钥"
    echo "公钥内容:"
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        cat ~/.ssh/id_ed25519.pub
    elif [ -f ~/.ssh/id_rsa.pub ]; then
        cat ~/.ssh/id_rsa.pub
    fi
else
    echo "生成新的SSH密钥..."
    ssh-keygen -t ed25519 -C "steve@openclaw.ai" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH密钥已生成"
    echo "公钥内容:"
    cat ~/.ssh/id_ed25519.pub
fi

echo ""
echo "📋 请将上面的公钥添加到GitHub:"
echo "  1. 访问: https://github.com/settings/keys"
echo "  2. 点击 'New SSH key'"
echo "  3. 粘贴公钥内容"
echo "  4. 标题: OpenClaw-VM"
echo "  5. 保存"
echo ""
echo "按回车继续测试连接..."
read -r

# 测试SSH连接
echo "测试GitHub SSH连接..."
ssh -T git@github.com 2>&1 | head -5

# 配置Git使用SSH
echo ""
echo "配置Git使用SSH..."
cd /home/boz/.openclaw/workspace
git remote set-url origin git@github.com:lian125537/openclaw-self-optimization.git

echo "✅ 配置完成"
echo ""
echo "🎯 下一步:"
echo "  1. 添加公钥到GitHub"
echo "  2. 运行: git push origin master"
echo "  3. 验证推送成功"