#!/bin/bash
# S级问题修复系统自动启动服务

echo "🚀 启动S级问题修复系统..."

# 检查是否已运行
if pgrep -f "s-level-fix" > /dev/null; then
    echo "✅ 修复系统已在运行"
    exit 0
fi

# 启动修复系统
cd /usr/lib/node_modules/openclaw
nohup node s-level-fix.js > /tmp/s-level-fix.log 2>&1 &

# 等待启动
sleep 2

# 检查是否启动成功
if pgrep -f "s-level-fix" > /dev/null; then
    echo "✅ S级问题修复系统启动成功"
    echo "📝 日志文件: /tmp/s-level-fix.log"
    
    # 启动监控
    nohup /home/boz/.openclaw/workspace/monitor-s-level-fix.sh > /tmp/s-level-fix-monitor.log 2>&1 &
    echo "✅ 监控服务已启动"
else
    echo "❌ S级问题修复系统启动失败"
    echo "查看日志: cat /tmp/s-level-fix.log"
    exit 1
fi
