#!/bin/bash
# S级问题修复监控服务

echo "🔍 S级问题修复系统监控启动..."

# 检查修复系统状态
check_fix_system() {
    echo "检查修复系统状态..."
    
    # 检查进程
    if pgrep -f "s-level-fix" > /dev/null; then
        echo "✅ 修复系统进程运行中"
    else
        echo "⚠️  修复系统进程未运行，尝试启动..."
        cd /usr/lib/node_modules/openclaw
        node s-level-fix.js > /tmp/s-level-fix.log 2>&1 &
    fi
    
    # 检查错误日志
    if [ -f "/tmp/s-level-fix.log" ]; then
        ERROR_COUNT=$(grep -c "❌\|🚨\|ERROR" /tmp/s-level-fix.log | tail -20)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo "⚠️  发现 $ERROR_COUNT 个错误，查看日志: tail -20 /tmp/s-level-fix.log"
        else
            echo "✅ 错误日志正常"
        fi
    fi
    
    # 检查系统负载
    LOAD=$(uptime | awk -F'load average:' '{print $2}')
    echo "📊 系统负载: $LOAD"
}

# 检查OpenClaw Gateway状态
check_gateway() {
    echo "检查OpenClaw Gateway状态..."
    
    if systemctl --user is-active openclaw-gateway.service > /dev/null; then
        echo "✅ Gateway服务运行中"
        
        # 检查健康端点
        RESPONSE=$(curl -s http://127.0.0.1:30000/health || echo "{}")
        if echo "$RESPONSE" | grep -q '"ok":true'; then
            echo "✅ Gateway健康检查通过"
        else
            echo "❌ Gateway健康检查失败"
        fi
    else
        echo "❌ Gateway服务未运行"
    fi
}

# 生成报告
generate_report() {
    echo "📈 生成监控报告..."
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > /tmp/s-level-fix-report.md << REPORT
# S级问题修复系统监控报告
**时间**: $TIMESTAMP

## 系统状态
- 修复系统进程: $(pgrep -f "s-level-fix" > /dev/null && echo "✅ 运行中" || echo "❌ 未运行")
- Gateway服务: $(systemctl --user is-active openclaw-gateway.service > /dev/null && echo "✅ 运行中" || echo "❌ 未运行")

## 错误统计
$(if [ -f "/tmp/s-level-fix.log" ]; then
    echo "- 总错误数: $(grep -c "❌\|🚨\|ERROR" /tmp/s-level-fix.log)"
    echo "- 最近错误:"
    grep "❌\|🚨\|ERROR" /tmp/s-level-fix.log | tail -5 | while read line; do
        echo "  - $line"
    done
else
    echo "- 错误日志文件不存在"
fi)

## 性能指标
- 系统负载: $(uptime | awk -F'load average:' '{print $2}')
- 内存使用: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')
- 磁盘空间: $(df -h / | awk 'NR==2 {print $4 " 可用"})

## 建议
1. 定期检查错误日志
2. 监控系统资源使用
3. 确保Gateway服务稳定运行

REPORT
    
    echo "✅ 报告已生成: /tmp/s-level-fix-report.md"
}

# 主循环
while true; do
    echo ""
    echo "========================================"
    echo "S级问题修复系统监控 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    
    check_fix_system
    check_gateway
    generate_report
    
    echo ""
    echo "⏳ 等待60秒后再次检查..."
    sleep 60
done
