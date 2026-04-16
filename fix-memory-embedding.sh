#!/bin/bash
# 临时修复内存嵌入问题的脚本

echo "🔧 修复内存嵌入问题"

# 1. 检查当前状态
echo "当前内存状态:"
openclaw memory status 2>&1 | grep -E "(Indexed|Embeddings|files)"

# 2. 尝试使用不同的嵌入提供商
echo -e "\n尝试配置本地嵌入..."

# 检查是否有本地嵌入模型
if command -v ollama &> /dev/null; then
    echo "Ollama可用，尝试启动嵌入模型..."
    ollama pull nomic-embed-text 2>/dev/null &
else
    echo "Ollama不可用，尝试其他方法..."
fi

# 3. 临时解决方案：使用环境变量
echo -e "\n设置环境变量..."
export OPENCLAW_MEMORY_EMBEDDING_PROVIDER="local"
export OPENCLAW_MEMORY_DISABLE_EMBEDDINGS="false"

# 4. 尝试重新索引（可能仍然失败，但尝试一下）
echo -e "\n尝试重新索引..."
openclaw memory index --force 2>&1 | tail -5

# 5. 如果嵌入仍然失败，建议使用全文搜索
echo -e "\n如果嵌入仍然失败，建议："
echo "1. 暂时使用全文搜索功能"
echo "2. 等待OpenClaw更新支持DeepSeek嵌入"
echo "3. 或安装本地嵌入模型如BGE-M3"

# 6. 检查全文搜索是否可用
echo -e "\n检查全文搜索状态:"
openclaw memory status 2>&1 | grep -i "fts"

echo -e "\n✅ 修复脚本完成"