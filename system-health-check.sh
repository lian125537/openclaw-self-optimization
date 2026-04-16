#!/bin/bash
# OpenClaw系统健康检查脚本

echo "🏥 OpenClaw系统健康检查"
echo "========================"
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Gateway状态检查
echo "1. Gateway状态:"
if curl -s http://127.0.0.1:18789/health > /dev/null; then
    echo "   ✅ Gateway运行正常"
else
    echo "   ❌ Gateway无法访问"
fi

# 2. 监控服务检查
echo -e "\n2. 监控服务状态:"
monitor_pid=$(ps aux | grep -E "chat-history-preserver" | grep -v grep | awk '{print $2}')
if [ -n "$monitor_pid" ]; then
    echo "   ✅ 聊天记录监控运行中 (PID: $monitor_pid)"
    
    # 检查日志
    log_file="/home/boz/.openclaw/workspace/logs/chat-preserver.log"
    if [ -f "$log_file" ]; then
        last_check=$(tail -1 "$log_file" | grep -o "检查会话.*" || echo "无记录")
        echo "   最后检查: $last_check"
    fi
else
    echo "   ❌ 聊天记录监控未运行"
fi

# 3. 会话状态检查
echo -e "\n3. 会话状态:"
sessions_count=$(openclaw sessions 2>/dev/null | grep -c "agent:main:" || echo "0")
echo "   活跃会话数: $sessions_count"

# 4. 内存使用检查
echo -e "\n4. 内存使用:"
memory_usage=$(ps aux | grep -E "openclaw|node.*preserver" | grep -v grep | awk '{sum += $6} END {print sum/1024 " MB"}')
echo "   总内存使用: ${memory_usage:-0} MB"

# 5. 磁盘空间检查
echo -e "\n5. 磁盘空间:"
workspace_size=$(du -sh /home/boz/.openclaw/workspace 2>/dev/null | cut -f1)
memory_size=$(du -sh /home/boz/.openclaw/memory 2>/dev/null | cut -f1)
echo "   工作空间: $workspace_size"
echo "   记忆数据: $memory_size"

# 6. 配置验证
echo -e "\n6. 配置验证:"
if openclaw config validate > /dev/null 2>&1; then
    echo "   ✅ 配置验证通过"
else
    echo "   ❌ 配置验证失败"
fi

# 7. 安全状态
echo -e "\n7. 安全状态:"
security_status=$(openclaw status 2>/dev/null | grep -A2 "Security audit" | tail -1)
echo "   $security_status"

# 8. 关键文件检查
echo -e "\n8. 关键文件检查:"
important_files=(
    "/home/boz/.openclaw/openclaw.json"
    "/home/boz/.openclaw/workspace/MEMORY.md"
    "/home/boz/.openclaw/workspace/memory/$(date +%Y-%m-%d).md"
    "/home/boz/.openclaw/workspace/logs/chat-preserver.log"
)

for file in "${important_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" 2>/dev/null | cut -f1)
        echo "   ✅ $(basename "$file") 存在 ($size)"
    else
        echo "   ❌ $(basename "$file") 不存在"
    fi
done

# 9. 服务启动时间
echo -e "\n9. 服务运行时间:"
if [ -n "$monitor_pid" ]; then
    uptime=$(ps -o etime= -p "$monitor_pid" | xargs)
    echo "   监控服务运行: $uptime"
fi

# 10. 建议
echo -e "\n10. 健康建议:"
issues=0

# 检查Gateway响应时间
gateway_time=$(timeout 2 curl -s -o /dev/null -w "%{time_total}s" http://127.0.0.1:18789/health 2>/dev/null || echo "超时")
if [[ "$gateway_time" == "超时" ]] || [[ $(echo "$gateway_time > 1" | bc -l 2>/dev/null) -eq 1 ]]; then
    echo "   ⚠️  Gateway响应较慢: ${gateway_time}"
    ((issues++))
else
    echo "   ✅ Gateway响应正常: ${gateway_time}s"
fi

# 检查日志文件大小
log_size=$(du -k /home/boz/.openclaw/workspace/logs/chat-preserver.log 2>/dev/null | cut -f1)
if [ -n "$log_size" ] && [ "$log_size" -gt 10240 ]; then
    echo "   ⚠️  日志文件较大: $((log_size/1024))MB (考虑轮转)"
    ((issues++))
else
    echo "   ✅ 日志文件大小正常"
fi

# 检查记忆文件更新
today_file="/home/boz/.openclaw/workspace/memory/$(date +%Y-%m-%d).md"
if [ -f "$today_file" ]; then
    last_modified=$(stat -c %Y "$today_file")
    now=$(date +%s)
    diff=$((now - last_modified))
    
    if [ "$diff" -gt 3600 ]; then
        echo "   ⚠️  今日记忆文件超过1小时未更新"
        ((issues++))
    else
        echo "   ✅ 记忆文件更新正常 ($((diff/60))分钟前)"
    fi
else
    echo "   ⚠️  今日记忆文件不存在"
    ((issues++))
fi

echo -e "\n📊 健康检查总结:"
if [ "$issues" -eq 0 ]; then
    echo "✅ 系统健康，无发现问题"
else
    echo "⚠️  发现 $issues 个需要注意的问题"
fi

echo ""
echo "🔧 维护命令:"
echo "  重启Gateway: openclaw gateway restart"
echo "  重启监控: pkill -f chat-history-preserver && cd /home/boz/.openclaw/workspace && nohup node chat-history-preserver.js > logs/chat-preserver.log 2>&1 &"
echo "  查看日志: tail -f /home/boz/.openclaw/workspace/logs/chat-preserver.log"
echo "  系统状态: openclaw status"

echo -e "\n✅ 健康检查完成"