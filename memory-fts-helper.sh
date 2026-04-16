#!/bin/bash
# 记忆全文搜索辅助工具
# 在向量搜索不可用时的临时解决方案

MEMORY_DIR="/home/boz/.openclaw/workspace/memory"
TODAY=$(date +%Y-%m-%d)

echo "🔍 记忆全文搜索辅助工具"
echo "========================="

case "$1" in
    "search")
        if [ -z "$2" ]; then
            echo "用法: $0 search <关键词>"
            exit 1
        fi
        echo "搜索关键词: $2"
        echo ""
        
        # 搜索所有记忆文件
        find "$MEMORY_DIR" -name "*.md" -type f | while read file; do
            matches=$(grep -c -i "$2" "$file")
            if [ "$matches" -gt 0 ]; then
                filename=$(basename "$file")
                echo "📄 $filename ($matches 处匹配)"
                grep -n -i "$2" "$file" | head -3 | while read line; do
                    echo "   $line"
                done
                echo ""
            fi
        done
        ;;
        
    "list")
        echo "📚 记忆文件列表:"
        find "$MEMORY_DIR" -name "*.md" -type f | sort | while read file; do
            filename=$(basename "$file")
            size=$(wc -l < "$file")
            modified=$(stat -c %y "$file" | cut -d' ' -f1)
            echo "  $filename ($size 行, 修改于: $modified)"
        done
        ;;
        
    "today")
        echo "📝 今日记忆 ($TODAY):"
        today_file="$MEMORY_DIR/$TODAY.md"
        if [ -f "$today_file" ]; then
            wc -l "$today_file"
            echo ""
            echo "最后10行:"
            tail -10 "$today_file"
        else
            echo "今日记忆文件不存在"
        fi
        ;;
        
    "stats")
        echo "📊 记忆系统统计:"
        total_files=$(find "$MEMORY_DIR" -name "*.md" -type f | wc -l)
        total_lines=$(find "$MEMORY_DIR" -name "*.md" -type f -exec wc -l {} + | tail -1 | awk '{print $1}')
        echo "  文件数量: $total_files"
        echo "  总行数: $total_lines"
        echo ""
        
        # 按日期统计
        echo "  最近文件:"
        find "$MEMORY_DIR" -name "*.md" -type f -exec basename {} \; | sort -r | head -5 | while read file; do
            lines=$(wc -l < "$MEMORY_DIR/$file" 2>/dev/null || echo "0")
            echo "    $file: $lines 行"
        done
        ;;
        
    "backup")
        echo "💾 创建记忆备份..."
        backup_dir="/home/boz/.openclaw/workspace/memory-backup"
        mkdir -p "$backup_dir"
        backup_file="$backup_dir/memory-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$backup_file" -C "$MEMORY_DIR" .
        echo "备份完成: $backup_file"
        echo "大小: $(du -h "$backup_file" | cut -f1)"
        ;;
        
    *)
        echo "用法: $0 <命令>"
        echo ""
        echo "命令:"
        echo "  search <关键词>  搜索记忆文件"
        echo "  list            列出所有记忆文件"
        echo "  today           查看今日记忆"
        echo "  stats           记忆系统统计"
        echo "  backup          创建记忆备份"
        echo ""
        echo "示例:"
        echo "  $0 search OpenClaw"
        echo "  $0 list"
        echo "  $0 today"
        ;;
esac

echo ""
echo "✅ 操作完成"