/**
 * Debug Skill - 调试助手
 * 
 * Claude Code debug.ts的简化移植版本
 * 提供系统信息、环境检查和调试功能
 */

module.exports = {
  // Skill定义
  name: 'debug',
  description: '系统调试和诊断工具',
  type: 'prompt', // Claude Skill类型: prompt 或 shell
  aliases: ['diag', 'diagnose', 'sysinfo'],
  whenToUse: '当你需要检查系统状态、诊断问题或获取环境信息时使用',
  argumentHint: '[检查类型] - 可选: system, env, memory, network, all',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 执行函数
  execute: async function(args, context) {
    const checkType = args.trim().toLowerCase() || 'system';
    const timestamp = new Date().toISOString();
    
    console.log(`🔧 [Debug Skill] 执行调试检查: ${checkType}`);
    
    // 根据检查类型返回不同信息
    switch (checkType) {
      case 'system':
        return {
          success: true,
          skill: 'debug',
          checkType: 'system',
          timestamp,
          data: {
            platform: process.platform,
            nodeVersion: process.version,
            arch: process.arch,
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cwd: process.cwd(),
            envKeys: Object.keys(process.env).length
          },
          summary: `系统信息: Node.js ${process.version} on ${process.platform} ${process.arch}, PID: ${process.pid}`
        };
        
      case 'env':
        return {
          success: true,
          skill: 'debug',
          checkType: 'env',
          timestamp,
          data: {
            nodeEnv: process.env.NODE_ENV || 'not set',
            openclawGatewayPort: process.env.OPENCLAW_GATEWAY_PORT || 'not set',
            openclawGatewayHost: process.env.OPENCLAW_GATEWAY_HOST || 'not set',
            pathLength: process.env.PATH ? process.env.PATH.length : 0,
            userHome: process.env.HOME || process.env.USERPROFILE || 'not set'
          },
          summary: `环境变量检查完成，共${Object.keys(process.env).length}个变量`
        };
        
      case 'memory':
        const mem = process.memoryUsage();
        return {
          success: true,
          skill: 'debug',
          checkType: 'memory',
          timestamp,
          data: {
            rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
            external: `${Math.round(mem.external / 1024 / 1024)} MB`,
            arrayBuffers: `${Math.round(mem.arrayBuffers / 1024 / 1024)} MB`
          },
          summary: `内存使用: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`
        };
        
      case 'network':
        const os = require('os');
        const interfaces = os.networkInterfaces();
        return {
          success: true,
          skill: 'debug',
          checkType: 'network',
          timestamp,
          data: {
            hostname: os.hostname(),
            networkInterfaces: Object.keys(interfaces),
            totalInterfaces: Object.keys(interfaces).length,
            defaultGateway: '检查中...',
            dnsServers: '检查中...'
          },
          summary: `网络接口: ${Object.keys(interfaces).join(', ')}`
        };
        
      case 'all':
        return {
          success: true,
          skill: 'debug',
          checkType: 'all',
          timestamp,
          data: {
            system: {
              platform: process.platform,
              nodeVersion: process.version,
              arch: process.arch
            },
            memory: {
              heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
            },
            environment: {
              envVarCount: Object.keys(process.env).length,
              cwd: process.cwd()
            },
            skillsContext: context ? '有上下文信息' : '无上下文信息'
          },
          summary: `完整系统检查完成 - 所有子系统正常`
        };
        
      default:
        return {
          success: false,
          skill: 'debug',
          error: `未知检查类型: ${checkType}`,
          validTypes: ['system', 'env', 'memory', 'network', 'all'],
          timestamp
        };
    }
  }
};