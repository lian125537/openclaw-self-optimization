#!/bin/bash
# 修复Gateway服务权限问题

echo "🔧 修复Gateway服务权限"
echo "====================="

SERVICE_FILE="$HOME/.config/systemd/user/openclaw-gateway.service"

# 1. 恢复备份
BACKUP_FILE="${SERVICE_FILE}.backup.20260416-054050"
if [ -f "$BACKUP_FILE" ]; then
    echo "1. 恢复备份配置..."
    cp "$BACKUP_FILE" "$SERVICE_FILE"
    echo "✅ 已恢复备份配置"
else
    echo "❌ 备份文件不存在，创建最小化配置..."
    cat > "$SERVICE_FILE" << 'EOF'
[Unit]
Description=OpenClaw Gateway (v2026.4.14)
After=network.target

[Service]
Type=simple
Restart=on-failure
RestartSec=5

# 核心环境变量 - 内存嵌入配置
Environment=OPENCLAW_MEMORY_EMBEDDING_PROVIDER=openai
Environment=OPENCLAW_MEMORY_EMBEDDING_MODEL=Qwen/Qwen3-Embedding-0.6B
Environment=OPENCLAW_MEMORY_EMBEDDING_BASE_URL=https://api.siliconflow.cn/v1
Environment=OPENCLAW_MEMORY_EMBEDDING_API_KEY=sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb

# 性能优化环境变量
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Environment=OPENCLAW_NO_RESPAWN=1

ExecStart=/usr/bin/node /usr/lib/node_modules/openclaw/dist/index.js gateway --port 18789
WorkingDirectory=/home/boz

StandardOutput=journal
StandardError=journal
SyslogIdentifier=openclaw-gateway

# 简化安全设置 - 避免权限问题
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=default.target
EOF
    echo "✅ 已创建最小化配置"
fi

# 2. 重新加载配置
echo -e "\n2. 重新加载systemd配置..."
systemctl --user daemon-reload
echo "✅ systemd配置已重新加载"

# 3. 启动服务
echo -e "\n3. 启动Gateway服务..."
systemctl --user restart openclaw-gateway.service

# 4. 检查状态
echo -e "\n4. 检查服务状态..."
sleep 3

if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "✅ Gateway服务运行正常"
    
    # 显示详细信息
    pid=$(systemctl --user show openclaw-gateway.service -p MainPID --value)
    echo "   进程PID: $pid"
    echo "   运行时间: $(systemctl --user status openclaw-gateway.service | grep "Active:" | cut -d';' -f2)"
    
    # 检查健康状态
    if curl -s --max-time 5 http://127.0.0.1:18789/health >/dev/null; then
        echo "✅ Gateway健康检查通过"
        echo "   响应: $(curl -s http://127.0.0.1:18789/health)"
    else
        echo "⚠️ Gateway健康检查失败，但服务在运行"
    fi
else
    echo "❌ Gateway服务启动失败"
    echo "   详细错误信息:"
    systemctl --user status openclaw-gateway.service | head -30
    
    # 尝试直接启动
    echo -e "\n🔄 尝试直接启动..."
    timeout 10 openclaw gateway start 2>&1 | tail -10
fi

# 5. 验证环境变量
echo -e "\n5. 验证环境变量:"
echo "   服务文件: $SERVICE_FILE"
grep -n "Environment=" "$SERVICE_FILE" | grep -i embedding

# 6. 创建监控脚本
echo -e "\n6. 创建服务监控..."
cat > /home/boz/.openclaw/workspace/monitor-gateway-health.sh << 'EOF'
#!/bin/bash
# Gateway健康监控脚本

SERVICE="openclaw-gateway.service"
HEALTH_URL="http://127.0.0.1:18789/health"
LOG_FILE="/home/boz/.openclaw/workspace/logs/gateway-monitor.log"

mkdir -p "$(dirname "$LOG_FILE")"

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

echo "[$(timestamp)] 开始Gateway健康检查" >> "$LOG_FILE"

# 检查服务状态
if ! systemctl --user is-active "$SERVICE" >/dev/null 2>&1; then
    echo "[$(timestamp)] ❌ 服务未运行，尝试启动..." >> "$LOG_FILE"
    systemctl --user start "$SERVICE"
    sleep 3
fi

# 检查健康端点
if ! curl -s --max-time 5 "$HEALTH_URL" >/dev/null; then
    echo "[$(timestamp)] ⚠️ 健康检查失败，重启服务..." >> "$LOG_FILE"
    systemctl --user restart "$SERVICE"
    sleep 5
fi

# 记录状态
if systemctl --user is-active "$SERVICE" >/dev/null 2>&1 && curl -s "$HEALTH_URL" >/dev/null; then
    echo "[$(timestamp)] ✅ 服务正常" >> "$LOG_FILE"
else
    echo "[$(timestamp)] 🚨 服务异常，需要手动干预" >> "$LOG_FILE"
fi
EOF

chmod +x /home/boz/.openclaw/workspace/monitor-gateway-health.sh
echo "✅ 监控脚本已创建: monitor-gateway-health.sh"

# 7. 添加到cron
echo -e "\n7. 设置自动监控..."
(crontab -l 2>/dev/null | grep -v "monitor-gateway-health"; echo "*/5 * * * * /home/boz/.openclaw/workspace/monitor-gateway-health.sh") | crontab -
echo "✅ 已添加到cron (每5分钟检查一次)"

echo -e "\n🎉 Gateway服务修复完成"
echo "   如果仍有连接问题，请刷新Control UI页面"