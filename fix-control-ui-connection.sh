#!/bin/bash
# 修复Control UI连接问题

echo "🔧 修复Control UI连接"
echo "==================="

# 1. 确认Gateway运行状态
echo "1. 检查Gateway状态..."
if curl -s http://127.0.0.1:18789/health >/dev/null; then
    echo "✅ Gateway运行正常"
    echo "   健康状态: $(curl -s http://127.0.0.1:18789/health)"
else
    echo "❌ Gateway未运行，尝试启动..."
    openclaw gateway start 2>&1 | tail -5
    sleep 3
fi

# 2. 显示当前token配置
echo -e "\n2. 当前token配置:"
TOKEN=$(grep -A1 '"token":' /home/boz/.openclaw/openclaw.json | tail -1 | cut -d'"' -f4)
echo "   token: $TOKEN"
echo "   长度: ${#TOKEN}字符"

# 3. 检查Control UI可能的问题
echo -e "\n3. Control UI连接诊断:"
echo "   a) Gateway地址: http://127.0.0.1:18789"
echo "   b) WebSocket地址: ws://127.0.0.1:18789"
echo "   c) Token已更新，需要刷新页面"

# 4. 创建连接测试页面
echo -e "\n4. 创建连接测试页面..."
cat > /tmp/test-openclaw-connection.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>OpenClaw连接测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>OpenClaw连接测试</h1>
    
    <div id="status"></div>
    
    <button onclick="testHealth()">测试健康检查</button>
    <button onclick="testWebSocket()">测试WebSocket</button>
    <button onclick="clearCache()">清除浏览器缓存</button>
    
    <script>
        const GATEWAY_URL = 'http://127.0.0.1:18789';
        
        function showMessage(text, type) {
            const div = document.createElement('div');
            div.className = `status ${type}`;
            div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
            document.getElementById('status').prepend(div);
        }
        
        async function testHealth() {
            try {
                const response = await fetch(`${GATEWAY_URL}/health`);
                const data = await response.json();
                showMessage(`健康检查: ${JSON.stringify(data)}`, 'success');
            } catch (error) {
                showMessage(`健康检查失败: ${error.message}`, 'error');
            }
        }
        
        function testWebSocket() {
            const ws = new WebSocket(`ws://127.0.0.1:18789`);
            
            ws.onopen = () => {
                showMessage('WebSocket连接成功', 'success');
                ws.close();
            };
            
            ws.onerror = (error) => {
                showMessage(`WebSocket连接失败: ${error.type}`, 'error');
            };
            
            ws.onclose = (event) => {
                showMessage(`WebSocket关闭: 代码=${event.code}, 原因=${event.reason}`, 'info');
            };
            
            setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    showMessage('WebSocket连接超时', 'error');
                    ws.close();
                }
            }, 5000);
        }
        
        function clearCache() {
            if (confirm('清除浏览器缓存？这会导致页面刷新。')) {
                // 清除localStorage和sessionStorage
                localStorage.clear();
                sessionStorage.clear();
                
                // 强制重新加载
                showMessage('缓存已清除，正在刷新页面...', 'info');
                setTimeout(() => location.reload(true), 1000);
            }
        }
        
        // 自动测试健康检查
        window.onload = testHealth;
    </script>
</body>
</html>
EOF

echo "✅ 测试页面已创建: /tmp/test-openclaw-connection.html"
echo "   用浏览器打开此文件测试连接"

# 5. 提供重新连接步骤
echo -e "\n5. Control UI重新连接步骤:"
echo "   步骤1: 完全关闭浏览器标签页"
echo "   步骤2: 清除浏览器缓存 (Ctrl+Shift+Delete)"
echo "   步骤3: 重新打开 http://127.0.0.1:18789"
echo "   步骤4: 如果提示token，使用: $TOKEN"

# 6. 备用方案：重启整个服务
echo -e "\n6. 备用方案 - 完全重启:"
echo "   # 停止所有服务"
echo "   pkill -f openclaw-gateway"
echo "   sleep 2"
echo "   # 重新启动"
echo "   openclaw gateway start"

echo -e "\n🎯 建议操作:"
echo "   1. 先尝试刷新Control UI页面 (F5或Ctrl+R)"
echo "   2. 如果不行，清除浏览器缓存"
echo "   3. 最后尝试完全重启"

echo -e "\n✅ 诊断完成"