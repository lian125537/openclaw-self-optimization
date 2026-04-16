#!/bin/bash
# 基础健康监控 - 防止1006断开

LOG_FILE="/tmp/openclaw-health-monitor.log"
MAX_FAILURES=3
CHECK_INTERVAL=30  # 30秒检查一次

echo "🏥 启动OpenClaw健康监控" | tee -a "$LOG_FILE"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "检查间隔: ${CHECK_INTERVAL}秒" | tee -a "$LOG_FILE"
echo "最大失败次数: ${MAX_FAILURES}" | tee -a "$LOG_FILE"
echo "==================================================" | tee -a "$LOG_FILE"

consecutive_failures=0
total_checks=0
healthy_checks=0

while true; do
    total_checks=$((total_checks + 1))
    timestamp=$(date '+%H:%M:%S')
    
    # 健康检查
    if curl -s --max-time 5 http://127.0.0.1:18789/health >/dev/null; then
        # 健康
        consecutive_failures=0
        healthy_checks=$((healthy_checks + 1))
        
        # 每10次成功检查记录一次
        if [ $((healthy_checks % 10)) -eq 0 ]; then
            echo "[$timestamp] ✅ 健康检查通过 (总检查: $total_checks, 健康: $healthy_checks)" | tee -a "$LOG_FILE"
        fi
        
    else
        # 不健康
        consecutive_failures=$((consecutive_failures + 1))
        echo "[$timestamp] ❌ 健康检查失败 (连续失败: $consecutive_failures/$MAX_FAILURES)" | tee -a "$LOG_FILE"
        
        # 检查进程是否存在
        if ! ps aux | grep -q "openclaw.*gateway.*18789"; then
            echo "[$timestamp] ⚠️ Gateway进程不存在，可能已崩溃" | tee -a "$LOG_FILE"
        fi
        
        # 如果达到最大失败次数
        if [ $consecutive_failures -ge $MAX_FAILURES ]; then
            echo "[$timestamp] 🚨 达到最大失败次数，触发恢复..." | tee -a "$LOG_FILE"
            
            # 执行恢复
            /home/boz/.openclaw/workspace/quick-recovery.sh
            
            # 等待恢复
            sleep 10
            
            # 重置计数器
            consecutive_failures=0
            
            # 记录恢复事件
            echo "[$timestamp] 🔄 恢复完成，继续监控..." | tee -a "$LOG_FILE"
        fi
    fi
    
    # 计算健康率
    if [ $total_checks -gt 0 ]; then
        health_rate=$((healthy_checks * 100 / total_checks))
        # 每小时记录一次健康率
        if [ $((total_checks % 120)) -eq 0 ]; then  # 120次 = 1小时（30秒×120）
            echo "[$timestamp] 📊 健康统计: ${health_rate}% (${healthy_checks}/${total_checks})" | tee -a "$LOG_FILE"
        fi
    fi
    
    sleep $CHECK_INTERVAL
done