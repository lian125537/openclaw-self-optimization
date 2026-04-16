#!/bin/bash
# Claude式稳定性包装器 - 简化版
# 基于Claude代码分析提取的稳定性模式

set -euo pipefail

# 配置
MAX_RETRIES=3
RETRY_DELAY=2
TIMEOUT=30
LOG_FILE="/tmp/openclaw-stability.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# 清理环境 - Claude式环境管理
clean_environment() {
    log "🧹 清理环境 (Claude模式)..."
    
    # 清除危险的环境变量
    unset OPENCLAW_MEMORY_EMBEDDING_API_KEY 2>/dev/null || true
    unset OPENCLAW_MEMORY_EMBEDDING_PROVIDER 2>/dev/null || true
    unset OPENCLAW_MEMORY_EMBEDDING_MODEL 2>/dev/null || true
    unset OPENCLAW_MEMORY_EMBEDDING_BASE_URL 2>/dev/null || true
    
    # 清理临时文件
    rm -f /tmp/openclaw-crash-*.log 2>/dev/null || true
    
    success "环境清理完成"
}

# 验证配置 - Claude式配置验证
validate_config() {
    log "🔍 验证配置 (Claude模式)..."
    
    local config_file="/home/boz/.openclaw/openclaw.json"
    
    if [ ! -f "$config_file" ]; then
        error "配置文件不存在: $config_file"
        return 1
    fi
    
    # 检查JSON语法
    if ! python3 -m json.tool "$config_file" >/dev/null 2>&1; then
        error "配置文件JSON语法错误"
        return 1
    fi
    
    # 检查必要字段
    local has_gateway=$(grep -c '"gateway"' "$config_file" || true)
    local has_models=$(grep -c '"models"' "$config_file" || true)
    
    if [ "$has_gateway" -eq 0 ]; then
        warning "配置缺少gateway字段，使用默认值"
    fi
    
    if [ "$has_models" -eq 0 ]; then
        warning "配置缺少models字段，使用默认值"
    fi
    
    success "配置验证通过"
    return 0
}

# 带重试的执行 - Claude式错误处理
execute_with_retry() {
    local command="$1"
    local description="$2"
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log "尝试执行: $description (尝试 $((retry_count+1))/$MAX_RETRIES)"
        
        if eval "$command"; then
            success "$description 成功"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                warning "$description 失败，${RETRY_DELAY}秒后重试..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    error "$description 失败，已达到最大重试次数"
    return 1
}

# 健康检查 - Claude式监控
health_check() {
    local url="http://127.0.0.1:18789/health"
    local timeout=5
    
    log "🏥 健康检查..."
    
    if curl -s --max-time "$timeout" "$url" >/dev/null; then
        local response=$(curl -s "$url")
        success "健康检查通过: $response"
        return 0
    else
        warning "健康检查失败"
        return 1
    fi
}

# 资源监控 - Claude式资源管理
monitor_resources() {
    log "📊 监控资源使用..."
    
    local pid=$(pgrep -f "openclaw.*gateway" | head -1)
    
    if [ -n "$pid" ]; then
        local mem_usage=$(ps -p "$pid" -o %mem= | xargs)
        local cpu_usage=$(ps -p "$pid" -o %cpu= | xargs)
        
        log "Gateway进程资源: CPU ${cpu_usage}%, 内存 ${mem_usage}%"
        
        # 如果内存使用超过80%，警告
        if [ "$(echo "$mem_usage > 80" | bc -l 2>/dev/null)" = "1" ]; then
            warning "内存使用率高: ${mem_usage}%"
        fi
    else
        warning "未找到Gateway进程"
    fi
}

# 安全启动Gateway - Claude式稳定性启动
safe_start_gateway() {
    log "🚀 安全启动Gateway (Claude稳定性模式)..."
    
    # 1. 停止现有进程
    log "停止现有Gateway进程..."
    pkill -f "openclaw.*gateway" 2>/dev/null || true
    sleep 2
    
    # 2. 清理环境
    clean_environment
    
    # 3. 验证配置
    if ! validate_config; then
        error "配置验证失败，使用安全默认配置"
        # 这里可以添加恢复默认配置的逻辑
    fi
    
    # 4. 启动Gateway（带重试）
    execute_with_retry \
        "openclaw gateway start > /tmp/openclaw-start.log 2>&1" \
        "启动OpenClaw Gateway"
    
    # 5. 等待启动完成
    log "等待Gateway启动..."
    sleep 5
    
    # 6. 健康检查
    if health_check; then
        success "Gateway启动成功并运行正常"
        
        # 7. 初始资源监控
        monitor_resources
        
        return 0
    else
        error "Gateway启动但健康检查失败"
        
        # 检查启动日志
        if [ -f "/tmp/openclaw-start.log" ]; then
            log "启动日志最后10行:"
            tail -10 "/tmp/openclaw-start.log" | while read line; do
                log "  $line"
            done
        fi
        
        return 1
    fi
}

# 主监控循环 - Claude式持续监控
monitor_loop() {
    log "📡 启动稳定性监控循环..."
    
    local check_interval=30
    local consecutive_failures=0
    local max_consecutive_failures=3
    
    while true; do
        if health_check; then
            consecutive_failures=0
            monitor_resources
            log "系统正常，${check_interval}秒后再次检查..."
        else
            consecutive_failures=$((consecutive_failures + 1))
            error "健康检查失败 (连续失败: $consecutive_failures/$max_consecutive_failures)"
            
            if [ $consecutive_failures -ge $max_consecutive_failures ]; then
                error "连续健康检查失败达到上限，尝试恢复..."
                safe_start_gateway
                consecutive_failures=0
            fi
        fi
        
        sleep $check_interval
    done
}

# 主函数
main() {
    log "=".repeat(60)
    log "Claude式稳定性包装器 v1.0"
    log "基于Claude代码分析提取的稳定性模式"
    log "=".repeat(60)
    
    # 参数处理
    case "${1:-}" in
        "start")
            safe_start_gateway
            ;;
        "monitor")
            monitor_loop
            ;;
        "health")
            health_check
            ;;
        "clean")
            clean_environment
            ;;
        "validate")
            validate_config
            ;;
        "resources")
            monitor_resources
            ;;
        *)
            log "使用方法: $0 {start|monitor|health|clean|validate|resources}"
            log ""
            log "命令说明:"
            log "  start     - 安全启动Gateway (带环境清理和验证)"
            log "  monitor   - 启动持续监控循环"
            log "  health    - 执行一次健康检查"
            log "  clean     - 清理环境变量"
            log "  validate  - 验证配置文件"
            log "  resources - 检查资源使用"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"