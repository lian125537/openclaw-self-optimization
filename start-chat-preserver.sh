#!/bin/bash

# 聊天记录保持系统启动脚本

echo "🚀 启动聊天记录保持系统..."
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "工作目录: $(pwd)"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查会话目录
SESSION_DIR="/home/boz/.openclaw/agents/main/sessions"
if [ ! -d "$SESSION_DIR" ]; then
    echo "❌ 会话目录不存在: $SESSION_DIR"
    exit 1
fi

echo "✅ 会话目录: $SESSION_DIR"

# 检查记忆目录
MEMORY_DIR="/home/boz/.openclaw/workspace/memory"
if [ ! -d "$MEMORY_DIR" ]; then
    echo "❌ 记忆目录不存在: $MEMORY_DIR"
    exit 1
fi

echo "✅ 记忆目录: $MEMORY_DIR"

# 创建日志目录
LOG_DIR="/home/boz/.openclaw/workspace/logs"
mkdir -p "$LOG_DIR"
echo "✅ 日志目录: $LOG_DIR"

# 检查是否已在运行
PID_FILE="/tmp/chat-preserver.pid"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "⚠️  聊天记录保持系统已在运行 (PID: $OLD_PID)"
        echo "   停止旧进程..."
        kill "$OLD_PID"
        sleep 2
    fi
fi

# 启动服务
echo ""
echo "📚 启动聊天记录保持服务..."
nohup node /home/boz/.openclaw/workspace/chat-history-preserver.js > "$LOG_DIR/chat-preserver.log" 2>&1 &
NEW_PID=$!

# 保存PID
echo $NEW_PID > "$PID_FILE"
echo "✅ 服务已启动 (PID: $NEW_PID)"
echo "📝 日志文件: $LOG_DIR/chat-preserver.log"

# 等待服务启动
sleep 3

# 检查服务状态
if kill -0 "$NEW_PID" 2>/dev/null; then
    echo ""
    echo "🎉 聊天记录保持系统启动成功!"
    echo ""
    echo "📊 系统功能:"
    echo "   • 实时监控OpenClaw会话"
    echo "   • 自动保存聊天记录到每日记忆文件"
    echo "   • 防止上下文被清空"
    echo "   • 创建会话备份"
    echo ""
    echo "⏰ 检查间隔: 60秒"
    echo "📁 备份目录: /home/boz/.openclaw/workspace/memory/chat-history/"
    echo ""
    echo "🛑 停止命令: pkill -f chat-history-preserver"
else
    echo "❌ 服务启动失败"
    echo "查看日志: tail -f $LOG_DIR/chat-preserver.log"
    exit 1
fi

# 显示最近日志
echo "📋 最近日志:"
tail -5 "$LOG_DIR/chat-preserver.log" 2>/dev/null || echo "暂无日志"

echo ""
echo "🔧 系统将持续运行，按 Ctrl+C 返回终端"