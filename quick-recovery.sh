#!/bin/bash
# 快速恢复到稳定基线

echo "🔄 快速恢复到稳定基线..."
cp /home/boz/.openclaw/stable-backups/openclaw-stable-baseline-*.json /home/boz/.openclaw/openclaw.json 2>/dev/null

# 清理环境
unset OPENCLAW_MEMORY_EMBEDDING_API_KEY 2>/dev/null
unset OPENCLAW_MEMORY_EMBEDDING_PROVIDER 2>/dev/null
unset OPENCLAW_MEMORY_EMBEDDING_MODEL 2>/dev/null
unset OPENCLAW_MEMORY_EMBEDDING_BASE_URL 2>/dev/null

# 重启Gateway
pkill -f "openclaw.*gateway" 2>/dev/null
sleep 2
openclaw gateway start > /tmp/openclaw-recovery.log 2>&1 &

echo "✅ 恢复完成，Gateway正在重启..."
echo "日志: /tmp/openclaw-recovery.log"
