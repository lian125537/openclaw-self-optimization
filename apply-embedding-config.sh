#!/bin/bash
# 应用嵌入API配置并重启系统

echo "🚀 应用嵌入API配置"
echo "=================="

# 1. 设置环境变量
echo "1. 设置环境变量..."
export OPENCLAW_MEMORY_EMBEDDING_PROVIDER="openai"
export OPENCLAW_MEMORY_EMBEDDING_MODEL="Qwen/Qwen3-Embedding-0.6B"
export OPENCLAW_MEMORY_EMBEDDING_BASE_URL="https://api.siliconflow.cn/v1"
export OPENCLAW_MEMORY_EMBEDDING_API_KEY="sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb"

echo "   ✅ 环境变量已设置"

# 2. 验证API连接
echo -e "\n2. 验证API连接..."
curl -s -H "Authorization: Bearer $OPENCLAW_MEMORY_EMBEDDING_API_KEY" \
  "$OPENCLAW_MEMORY_EMBEDDING_BASE_URL/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"$OPENCLAW_MEMORY_EMBEDDING_MODEL"'",
    "input": "测试OpenClaw嵌入配置",
    "encoding_format": "float"
  }' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and data['data']:
        dim = len(data['data'][0]['embedding'])
        print(f'   ✅ API连接成功，维度: {dim}')
    else:
        print('   ❌ API响应格式异常')
except Exception as e:
    print(f'   ❌ API测试失败: {e}')
" 2>/dev/null || echo "   ⚠️ API测试需要进一步验证"

# 3. 安全重启Gateway
echo -e "\n3. 安全重启Gateway应用配置..."
if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "   Gateway服务运行中，执行优雅重启..."
    systemctl --user restart openclaw-gateway.service
else
    echo "   Gateway服务未运行，直接启动..."
    systemctl --user start openclaw-gateway.service
fi

echo "   ⏳ 等待Gateway启动..."
sleep 5

# 4. 检查Gateway状态
echo -e "\n4. 检查Gateway状态..."
if curl -s http://127.0.0.1:18789/health > /dev/null; then
    echo "   ✅ Gateway运行正常"
    
    # 检查健康状态
    response_time=$(curl -s -o /dev/null -w "%{time_total}s" http://127.0.0.1:18789/health)
    echo "   响应时间: ${response_time}"
else
    echo "   ❌ Gateway无法访问"
    echo "   尝试直接启动..."
    openclaw gateway start 2>&1 | tail -5
fi

# 5. 检查嵌入配置状态
echo -e "\n5. 检查嵌入配置状态..."
echo "   环境变量状态:"
echo "   OPENCLAW_MEMORY_EMBEDDING_PROVIDER=$OPENCLAW_MEMORY_EMBEDDING_PROVIDER"
echo "   OPENCLAW_MEMORY_EMBEDDING_MODEL=$OPENCLAW_MEMORY_EMBEDDING_MODEL"
echo "   OPENCLAW_MEMORY_EMBEDDING_BASE_URL=$OPENCLAW_MEMORY_EMBEDDING_BASE_URL"
echo "   OPENCLAW_MEMORY_EMBEDDING_API_KEY=[已设置]"

# 6. 创建永久环境变量配置
echo -e "\n6. 创建永久配置..."
cat >> ~/.bashrc << 'EOF'

# OpenClaw内存嵌入配置 (2026-04-16)
export OPENCLAW_MEMORY_EMBEDDING_PROVIDER="openai"
export OPENCLAW_MEMORY_EMBEDDING_MODEL="Qwen/Qwen3-Embedding-0.6B"
export OPENCLAW_MEMORY_EMBEDDING_BASE_URL="https://api.siliconflow.cn/v1"
export OPENCLAW_MEMORY_EMBEDDING_API_KEY="sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb"
EOF

echo "   ✅ 永久配置已添加到 ~/.bashrc"

# 7. 建议下一步
echo -e "\n7. 建议下一步操作:"
echo "   a) 重新登录或运行: source ~/.bashrc"
echo "   b) 检查记忆状态: openclaw memory status"
echo "   c) 重建索引: openclaw memory index --force"
echo "   d) 测试搜索: openclaw memory search \"测试关键词\""

echo -e "\n✅ 嵌入配置应用完成"
echo "   系统需要重新登录或重启终端以使环境变量永久生效"