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
