#!/bin/bash

echo "🚀 开始部署OpenClaw S级问题修复系统..."

# 工作目录
WORKSPACE="/home/boz/.openclaw/workspace"
OPENCLAW_DIR="/usr/lib/node_modules/openclaw"

echo "1. 检查OpenClaw目录..."
if [ ! -d "$OPENCLAW_DIR" ]; then
    echo "❌ OpenClaw目录不存在: $OPENCLAW_DIR"
    exit 1
fi

echo "2. 复制修复文件..."
sudo cp "$WORKSPACE/s-level-fix-complete.js" "$OPENCLAW_DIR/s-level-fix.js"
sudo cp "$WORKSPACE/S_LEVEL_FIX_PLAN.md" "$OPENCLAW_DIR/"

echo "3. 创建集成脚本..."
cat > "$WORKSPACE/integrate-s-level-fix.js" << 'EOF'
#!/usr/bin/env node
/**
 * OpenClaw S级问题修复集成脚本
 * 将修复系统集成到OpenClaw Gateway
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始集成S级问题修复系统到OpenClaw...');

// 检查OpenClaw配置
const configPath = '/home/boz/.openclaw/openclaw.json';
if (!fs.existsSync(configPath)) {
    console.error('❌ OpenClaw配置文件不存在:', configPath);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 添加修复系统配置
if (!config.plugins) {
    config.plugins = {};
}

if (!config.plugins.allow) {
    config.plugins.allow = [];
}

// 添加S级修复插件
if (!config.plugins.allow.includes('s-level-fix')) {
    config.plugins.allow.push('s-level-fix');
}

// 添加错误处理配置
if (!config.errorHandling) {
    config.errorHandling = {};
}

config.errorHandling = {
    ...config.errorHandling,
    retry: {
        enabled: true,
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        jitter: true
    },
    concurrency: {
        maxConcurrent: 4,
        queueLimit: 100,
        monitorInterval: 5000
    },
    monitoring: {
        enabled: true,
        reportInterval: 30000,
        alertThreshold: 10
    }
};

// 保存配置
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ OpenClaw配置已更新');

// 创建启动脚本
const startupScript = `
// S级问题修复系统启动
const { OpenClawSLevelFix } = require('./s-level-fix.js');

let fixSystem = null;

function initializeSLevelFix() {
    try {
        fixSystem = new OpenClawSLevelFix();
        console.log('✅ S级问题修复系统已初始化');
        
        // 包装Gateway API调用
        wrapGatewayAPIs();
        
        return fixSystem;
    } catch (error) {
        console.error('❌ S级问题修复系统初始化失败:', error);
        return null;
    }
}

function wrapGatewayAPIs() {
    const originalSend = global.chat?.send;
    if (originalSend) {
        global.chat.send = async function(...args) {
            if (fixSystem) {
                return await fixSystem.callWithRetry(() => originalSend.apply(this, args), {
                    api: 'chat.send',
                    timestamp: new Date().toISOString()
                });
            }
            return await originalSend.apply(this, args);
        };
        console.log('✅ chat.send API已包装');
    }
    
    // 可以添加更多API包装
}

// 导出
module.exports = {
    initializeSLevelFix,
    getFixSystem: () => fixSystem
};
`;

fs.writeFileSync(path.join('/usr/lib/node_modules/openclaw', 's-level-fix-integration.js'), startupScript);
console.log('✅ 集成脚本已创建');

console.log('\n🎉 S级问题修复系统集成完成！');
console.log('\n📋 下一步操作:');
console.log('1. 重启OpenClaw Gateway: openclaw gateway restart');
console.log('2. 验证修复系统: node /usr/lib/node_modules/openclaw/s-level-fix.js');
console.log('3. 监控系统状态: 查看日志 journalctl --user -u openclaw-gateway -f');
EOF

chmod +x "$WORKSPACE/integrate-s-level-fix.js"

echo "4. 运行集成脚本..."
node "$WORKSPACE/integrate-s-level-fix.js"

echo "5. 创建监控服务..."
cat > "$WORKSPACE/monitor-s-level-fix.sh" << 'EOF'
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
EOF

chmod +x "$WORKSPACE/monitor-s-level-fix.sh"

echo "6. 创建自动启动配置..."
cat > "$WORKSPACE/start-s-level-fix-service.sh" << 'EOF'
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
EOF

chmod +x "$WORKSPACE/start-s-level-fix-service.sh"

echo "7. 添加到cron定时任务..."
(crontab -l 2>/dev/null; echo "@reboot /home/boz/.openclaw/workspace/start-s-level-fix-service.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/boz/.openclaw/workspace/monitor-s-level-fix.sh >> /tmp/s-level-fix-cron.log 2>&1") | crontab -

echo ""
echo "🎉 S级问题修复系统部署完成！"
echo ""
echo "📋 部署总结:"
echo "✅ 修复系统文件已复制到: $OPENCLAW_DIR/s-level-fix.js"
echo "✅ 集成脚本已创建: $WORKSPACE/integrate-s-level-fix.js"
echo "✅ 监控服务已配置: $WORKSPACE/monitor-s-level-fix.sh"
echo "✅ 自动启动已设置 (cron)"
echo ""
echo "🚀 立即启动修复系统:"
echo "  bash $WORKSPACE/start-s-level-fix-service.sh"
echo ""
echo "👁️ 查看监控:"
echo "  tail -f /tmp/s-level-fix.log"
echo ""
echo "📊 查看报告:"
echo "  cat /tmp/s-level-fix-report.md"