#!/bin/bash
# OpenClaw日志管理脚本

LOG_DIR="/home/boz/.openclaw/workspace/logs"
BACKUP_DIR="/home/boz/.openclaw/workspace/logs/backup"
MAX_SIZE_KB=10240  # 10MB
MAX_BACKUPS=10

echo "📝 OpenClaw日志管理"
echo "==================="

case "$1" in
    "status")
        echo "日志状态:"
        echo ""
        
        # 检查主要日志文件
        for log_file in "$LOG_DIR"/*.log; do
            if [ -f "$log_file" ]; then
                filename=$(basename "$log_file")
                size_kb=$(du -k "$log_file" | cut -f1)
                lines=$(wc -l < "$log_file")
                modified=$(stat -c %y "$log_file" | cut -d' ' -f1-2)
                
                echo "📄 $filename:"
                echo "   大小: $size_kb KB ($lines 行)"
                echo "   修改: $modified"
                
                if [ "$size_kb" -gt "$MAX_SIZE_KB" ]; then
                    echo "   ⚠️  超过大小限制 ($MAX_SIZE_KB KB)"
                fi
                echo ""
            fi
        done
        
        # 检查备份
        if [ -d "$BACKUP_DIR" ]; then
            backup_count=$(find "$BACKUP_DIR" -name "*.log.*" -type f | wc -l)
            echo "备份数量: $backup_count"
        else
            echo "备份目录不存在"
        fi
        ;;
        
    "rotate")
        echo "执行日志轮转..."
        mkdir -p "$BACKUP_DIR"
        
        timestamp=$(date +%Y%m%d-%H%M%S)
        
        for log_file in "$LOG_DIR"/*.log; do
            if [ -f "$log_file" ]; then
                filename=$(basename "$log_file")
                size_kb=$(du -k "$log_file" | cut -f1)
                
                if [ "$size_kb" -gt "$MAX_SIZE_KB" ]; then
                    echo "轮转 $filename ($size_kb KB)..."
                    
                    # 创建备份
                    backup_file="$BACKUP_DIR/$filename.$timestamp"
                    cp "$log_file" "$backup_file"
                    
                    # 清空原文件（保留文件句柄）
                    : > "$log_file"
                    
                    echo "  备份到: $(basename "$backup_file")"
                else
                    echo "跳过 $filename ($size_kb KB < $MAX_SIZE_KB KB)"
                fi
            fi
        done
        
        # 清理旧备份
        if [ -d "$BACKUP_DIR" ]; then
            echo -e "\n清理旧备份..."
            backup_files=($(find "$BACKUP_DIR" -name "*.log.*" -type f | sort))
            total=${#backup_files[@]}
            
            if [ "$total" -gt "$MAX_BACKUPS" ]; then
                to_delete=$((total - MAX_BACKUPS))
                echo "删除 $to_delete 个旧备份..."
                
                for ((i=0; i<to_delete; i++)); do
                    echo "  删除: $(basename "${backup_files[$i]}")"
                    rm "${backup_files[$i]}"
                done
            else
                echo "备份数量正常 ($total/$MAX_BACKUPS)"
            fi
        fi
        ;;
        
    "clean")
        echo "清理日志..."
        days=${2:-30}  # 默认保留30天
        
        echo "删除超过 $days 天的日志备份..."
        
        if [ -d "$BACKUP_DIR" ]; then
            find "$BACKUP_DIR" -name "*.log.*" -type f -mtime +$days -exec echo "  删除: {}" \; -delete
        fi
        
        # 也可以清理日志目录中的旧文件
        find "$LOG_DIR" -name "*.log.*" -type f -mtime +$days -exec echo "  删除: {}" \; -delete 2>/dev/null
        ;;
        
    "tail")
        log_file="$LOG_DIR/chat-preserver.log"
        if [ -f "$log_file" ]; then
            echo "实时查看日志: $log_file"
            echo "按 Ctrl+C 退出"
            echo ""
            tail -f "$log_file"
        else
            echo "日志文件不存在: $log_file"
        fi
        ;;
        
    "view")
        log_file="$LOG_DIR/${2:-chat-preserver.log}"
        if [ -f "$log_file" ]; then
            echo "查看日志: $log_file"
            echo "================"
            tail -${3:-50} "$log_file"
        else
            echo "日志文件不存在: $log_file"
        fi
        ;;
        
    "setup-cron")
        echo "设置日志轮转Cron任务..."
        crontab -l > /tmp/openclaw-cron 2>/dev/null || echo "# OpenClaw Cron Jobs" > /tmp/openclaw-cron
        
        # 添加日志轮转任务（每天凌晨2点）
        if ! grep -q "log-manager.sh rotate" /tmp/openclaw-cron; then
            echo "0 2 * * * /home/boz/.openclaw/workspace/log-manager.sh rotate" >> /tmp/openclaw-cron
            echo "✅ 添加日志轮转任务"
        else
            echo "⚠️  日志轮转任务已存在"
        fi
        
        # 添加健康检查任务（每小时）
        if ! grep -q "system-health-check.sh" /tmp/openclaw-cron; then
            echo "0 * * * * /home/boz/.openclaw/workspace/system-health-check.sh >> /home/boz/.openclaw/workspace/logs/health-check.log 2>&1" >> /tmp/openclaw-cron
            echo "✅ 添加健康检查任务"
        else
            echo "⚠️  健康检查任务已存在"
        fi
        
        # 应用Cron
        crontab /tmp/openclaw-cron
        rm /tmp/openclaw-cron
        
        echo -e "\n当前Cron任务:"
        crontab -l | grep -E "(log-manager|system-health-check)"
        ;;
        
    *)
        echo "用法: $0 <命令>"
        echo ""
        echo "命令:"
        echo "  status        查看日志状态"
        echo "  rotate        执行日志轮转"
        echo "  clean [days]  清理旧日志（默认30天）"
        echo "  tail          实时查看日志"
        echo "  view [file] [lines] 查看日志文件"
        echo "  setup-cron    设置自动日志管理"
        echo ""
        echo "示例:"
        echo "  $0 status"
        echo "  $0 rotate"
        echo "  $0 clean 7"
        echo "  $0 tail"
        echo "  $0 view chat-preserver.log 100"
        echo "  $0 setup-cron"
        ;;
esac

echo -e "\n✅ 操作完成"