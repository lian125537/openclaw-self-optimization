#!/bin/bash
# 设置OpenClaw嵌入环境变量

echo "🔧 设置OpenClaw嵌入环境变量"
echo "============================="

# 设置环境变量
export OPENCLAW_MEMORY_EMBEDDING_PROVIDER="openai"
export OPENCLAW_MEMORY_EMBEDDING_MODEL="Qwen/Qwen3-Embedding-0.6B"
export OPENCLAW_MEMORY_EMBEDDING_BASE_URL="https://api.siliconflow.cn/v1"
export OPENCLAW_MEMORY_EMBEDDING_API_KEY="sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb"

echo "✅ 环境变量已设置:"
echo "   OPENCLAW_MEMORY_EMBEDDING_PROVIDER=$OPENCLAW_MEMORY_EMBEDDING_PROVIDER"
echo "   OPENCLAW_MEMORY_EMBEDDING_MODEL=$OPENCLAW_MEMORY_EMBEDDING_MODEL"
echo "   OPENCLAW_MEMORY_EMBEDDING_BASE_URL=$OPENCLAW_MEMORY_EMBEDDING_BASE_URL"
echo "   OPENCLAW_MEMORY_EMBEDDING_API_KEY=[已设置]"

echo -e "\n🚀 重启Gateway应用配置..."
openclaw gateway restart

echo -e "\n⏳ 等待Gateway重启..."
sleep 5

echo -e "\n🔍 检查嵌入配置状态..."
# 尝试检查memory状态
if command -v openclaw &> /dev/null; then
    echo "检查OpenClaw命令..."
    openclaw status 2>&1 | grep -i "memory\|embedding" || echo "状态检查中..."
else
    echo "OpenClaw命令不可用"
fi

echo -e "\n📋 验证API连接..."
curl -s -H "Authorization: Bearer $OPENCLAW_MEMORY_EMBEDDING_API_KEY" \
  "$OPENCLAW_MEMORY_EMBEDDING_BASE_URL/models" \
  | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = [m['id'] for m in data.get('data', [])]
    embed_models = [m for m in models if 'embed' in m.lower()]
    print(f'✅ API连接成功，找到 {len(embed_models)} 个嵌入模型')
    for model in embed_models[:3]:
        print(f'   - {model}')
except:
    print('❌ API连接失败')
" 2>/dev/null || echo "API测试失败"

echo -e "\n✅ 环境变量设置完成"
echo -e "\n💡 提示: 要使环境变量永久生效，请将以下内容添加到 ~/.bashrc 或 ~/.profile:"
echo "export OPENCLAW_MEMORY_EMBEDDING_PROVIDER=\"openai\""
echo "export OPENCLAW_MEMORY_EMBEDDING_MODEL=\"Qwen/Qwen3-Embedding-0.6B\""
echo "export OPENCLAW_MEMORY_EMBEDDING_BASE_URL=\"https://api.siliconflow.cn/v1\""
echo "export OPENCLAW_MEMORY_EMBEDDING_API_KEY=\"sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb\""