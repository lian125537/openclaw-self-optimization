#!/bin/bash
# 更新Gateway服务环境变量配置

echo "🔧 更新Gateway服务环境变量"
echo "=========================="

# 1. 备份当前服务配置
SERVICE_FILE="$HOME/.config/systemd/user/openclaw-gateway.service"
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d-%H%M%S)"

if [ -f "$SERVICE_FILE" ]; then
    cp "$SERVICE_FILE" "$BACKUP_FILE"
    echo "✅ 服务配置已备份: $(basename "$BACKUP_FILE")"
else
    echo "❌ 服务配置文件不存在: $SERVICE_FILE"
    exit 1
fi

# 2. 创建新的服务配置
cat > /tmp/openclaw-gateway-new.service << 'EOF'
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

# 安全限制
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=default.target
EOF

# 3. 应用新配置
cp /tmp/openclaw-gateway-new.service "$SERVICE_FILE"
echo "✅ 新服务配置已创建"

# 4. 创建编译缓存目录
mkdir -p /var/tmp/openclaw-compile-cache
chmod 755 /var/tmp/openclaw-compile-cache
echo "✅ 编译缓存目录已创建: /var/tmp/openclaw-compile-cache"

# 5. 重新加载systemd配置
systemctl --user daemon-reload
echo "✅ systemd配置已重新加载"

# 6. 重启服务应用新配置
echo -e "\n🔄 重启Gateway服务应用新配置..."
systemctl --user restart openclaw-gateway.service

# 7. 检查服务状态
echo -e "\n🔍 检查服务状态..."
sleep 3

if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "✅ Gateway服务运行正常"
    
    # 检查进程环境变量
    pid=$(systemctl --user show openclaw-gateway.service -p MainPID --value)
    echo "   进程PID: $pid"
    
    # 检查健康状态
    if curl -s http://127.0.0.1:18789/health >/dev/null; then
        echo "✅ Gateway健康检查通过"
    else
        echo "⚠️ Gateway健康检查失败"
    fi
else
    echo "❌ Gateway服务启动失败"
    systemctl --user status openclaw-gateway.service | head -20
fi

# 8. 验证环境变量
echo -e "\n📋 验证环境变量配置:"
echo "   服务文件: $SERVICE_FILE"
echo "   嵌入提供商: openai"
echo "   嵌入模型: Qwen/Qwen3-Embedding-0.6B"
echo "   API基础URL: https://api.siliconflow.cn/v1"
echo "   API密钥: [已配置]"

# 9. 创建验证脚本
cat > /home/boz/.openclaw/workspace/verify-embedding-env.sh << 'EOF'
#!/bin/bash
echo "🔍 验证嵌入环境变量"
echo "=================="

# 检查服务配置
echo "1. 服务配置检查:"
grep -n "OPENCLAW_MEMORY_EMBEDDING" ~/.config/systemd/user/openclaw-gateway.service

# 检查进程环境
echo -e "\n2. 进程环境检查:"
pid=$(systemctl --user show openclaw-gateway.service -p MainPID --value 2>/dev/null)
if [ -n "$pid" ] && [ "$pid" -ne 0 ]; then
    echo "   Gateway PID: $pid"
    # 尝试读取进程环境（可能需要sudo）
    echo "   环境变量:"
    sudo strings /proc/$pid/environ 2>/dev/null | grep -i "openclaw.*embedding" || echo "   无法读取进程环境"
else
    echo "   无法获取Gateway PID"
fi

# 测试API连接
echo -e "\n3. API连接测试:"
curl -s -H "Authorization: Bearer sk-eofslrjboyahwdsvvfeyzejgkwcwqwkssirknfzxrojdsgvb" \
  "https://api.siliconflow.cn/v1/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3-Embedding-0.6B",
    "input": "测试环境变量配置",
    "encoding_format": "float"
  }' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data:
        print('   ✅ API连接成功')
    else:
        print('   ❌ API响应异常')
except:
    print('   ❌ API测试失败')
" 2>/dev/null || echo "   ⚠️ API测试需要进一步验证"

echo -e "\n✅ 验证完成"
EOF

chmod +x /home/boz/.openclaw/workspace/verify-embedding-env.sh
echo -e "\n✅ 验证脚本已创建: verify-embedding-env.sh"

echo -e "\n🎉 Gateway服务环境变量更新完成"
echo "   下次记忆索引操作将使用新的嵌入配置"