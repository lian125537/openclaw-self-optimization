#!/bin/bash
# 立即修复1006错误 - 安全重启Gateway

echo "🔧 立即修复1006错误"
echo "==================="

# 1. 检查当前状态
echo "1. 检查Gateway状态..."
if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "   ✅ Gateway服务运行中"
    CURRENT_STATUS="running"
else
    echo "   ❌ Gateway服务未运行"
    CURRENT_STATUS="stopped"
fi

# 2. 检查健康端点
echo -e "\n2. 检查健康端点..."
if curl -s --max-time 3 http://127.0.0.1:18789/health >/dev/null; then
    echo "   ✅ Gateway健康端点可访问"
    HEALTH_STATUS="healthy"
else
    echo "   ❌ Gateway健康端点不可访问"
    HEALTH_STATUS="unhealthy"
fi

# 3. 根据状态采取行动
echo -e "\n3. 采取修复行动..."
case "$CURRENT_STATUS-$HEALTH_STATUS" in
    "running-healthy")
        echo "   ✅ 系统正常，无需操作"
        ;;
    "running-unhealthy")
        echo "   ⚠️ 服务运行但不可访问，执行重启..."
        systemctl --user restart openclaw-gateway.service
        ;;
    "stopped-"*)
        echo "   🔄 服务停止，启动服务..."
        systemctl --user start openclaw-gateway.service
        ;;
    *)
        echo "   🔧 未知状态，尝试启动..."
        systemctl --user start openclaw-gateway.service
        ;;
esac

# 4. 等待并验证
echo -e "\n4. 验证修复结果..."
sleep 3

if systemctl --user is-active openclaw-gateway.service >/dev/null 2>&1; then
    echo "   ✅ Gateway服务已启动"
    
    # 检查健康状态
    if curl -s --max-time 5 http://127.0.0.1:18789/health; then
        echo -e "\n   ✅ Gateway完全恢复"
        echo "   健康状态: {\"ok\":true,\"status\":\"live\"}"
    else
        echo "   ⚠️ 服务启动但健康检查失败"
        echo "   尝试备用启动方式..."
        openclaw gateway start 2>&1 | tail -5
    fi
else
    echo "   ❌ Gateway服务启动失败"
    echo "   尝试直接启动..."
    openclaw gateway start 2>&1 | tail -10
fi

# 5. 检查WebSocket连接
echo -e "\n5. 检查系统状态..."
openclaw status 2>&1 | grep -A2 "Gateway" | head -5

echo -e "\n✅ 修复操作完成"
echo "   如果仍有1006错误，请刷新Control UI页面"