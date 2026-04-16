#!/bin/bash

# 设置聊天记录保持系统Cron任务

echo "⏰ 设置聊天记录保持系统Cron任务..."
echo ""

# 检查当前用户的crontab
CRON_USER=$(whoami)
CRON_FILE="/tmp/crontab-${CRON_USER}"

echo "👤 用户: $CRON_USER"
echo ""

# 导出当前crontab
crontab -l > "$CRON_FILE" 2>/dev/null || echo "# Empty crontab for $CRON_USER" > "$CRON_FILE"

# 检查是否已存在相关任务
if grep -q "chat-history-preserver" "$CRON_FILE"; then
    echo "⚠️  已存在聊天记录保持任务，更新中..."
    # 删除旧任务
    grep -v "chat-history-preserver" "$CRON_FILE" > "${CRON_FILE}.new"
    mv "${CRON_FILE}.new" "$CRON_FILE"
fi

# 添加新任务
echo "" >> "$CRON_FILE"
echo "# OpenClaw 聊天记录保持系统" >> "$CRON_FILE"
echo "# 系统启动时自动运行" >> "$CRON_FILE"
echo "@reboot /bin/bash /home/boz/.openclaw/workspace/start-chat-preserver.sh >> /home/boz/.openclaw/workspace/logs/cron-startup.log 2>&1" >> "$CRON_FILE"
echo "" >> "$CRON_FILE"
echo "# 每天凌晨3点重启服务（防止内存泄漏）" >> "$CRON_FILE"
echo "0 3 * * * pkill -f chat-history-preserver && sleep 5 && /bin/bash /home/boz/.openclaw/workspace/start-chat-preserver.sh >> /home/boz/.openclaw/workspace/logs/cron-daily-restart.log 2>&1" >> "$CRON_FILE"
echo "" >> "$CRON_FILE"
echo "# 每小时检查服务状态" >> "$CRON_FILE"
echo "0 * * * * if ! pgrep -f chat-history-preserver > /dev/null; then /bin/bash /home/boz/.openclaw/workspace/start-chat-preserver.sh >> /home/boz/.openclaw/workspace/logs/cron-health-check.log 2>&1; fi" >> "$CRON_FILE"

# 安装新crontab
crontab "$CRON_FILE"

echo "✅ Cron任务设置完成:"
echo ""
crontab -l | grep -A2 -B2 "chat-history-preserver"
echo ""
echo "📋 任务说明:"
echo "   1. @reboot - 系统启动时自动运行"
echo "   2. 0 3 * * * - 每天凌晨3点重启服务"
echo "   3. 0 * * * * - 每小时检查服务状态"
echo ""
echo "📁 日志文件:"
echo "   • /home/boz/.openclaw/workspace/logs/cron-startup.log"
echo "   • /home/boz/.openclaw/workspace/logs/cron-daily-restart.log"
echo "   • /home/boz/.openclaw/workspace/logs/cron-health-check.log"
echo ""
echo "🚀 现在启动服务..."
/bin/bash /home/boz/.openclaw/workspace/start-chat-preserver.sh