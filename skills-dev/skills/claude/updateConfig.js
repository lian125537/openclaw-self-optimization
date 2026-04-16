/**
 * UpdateConfig Skill - 配置管理工具
 * 
 * Claude Code updateConfig.ts的简化移植版本
 * 提供OpenClaw配置文件的读取、更新和管理功能
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  // Skill定义
  name: 'updateConfig',
  description: 'OpenClaw配置管理工具',
  type: 'prompt',
  aliases: ['config', 'configure', 'settings', 'configManager'],
  whenToUse: '当你需要查看或修改OpenClaw配置时使用',
  argumentHint: '[操作] [路径] [值] - 操作: get/set/list/backup/reset/help',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 配置路径
  configPaths: [
    'C:\\Users\\yodat\\.openclaw\\.openclaw\\openclaw.json',
    'C:\\Users\\yodat\\.openclaw\\openclaw.json',
    'C:\\openclaw\\.openclaw\\openclaw.json'
  ],
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { operation, configPath, keyPath, value, options } = this.parseConfigArgs(args);
    
    console.log(`⚙️ [UpdateConfig Skill] 操作: ${operation}, 配置: ${configPath}, 键: ${keyPath}, 值: ${value ? '已设置' : '未设置'}`);
    
    // 根据操作执行
    switch (operation) {
      case 'get':
        return await this.getConfig(configPath, keyPath, options, context);
      case 'set':
        return await this.setConfig(configPath, keyPath, value, options, context);
      case 'list':
        return await this.listConfigs(options, context);
      case 'backup':
        return await this.backupConfig(configPath, options, context);
      case 'reset':
        return await this.resetConfig(configPath, options, context);
      case 'validate':
        return await this.validateConfig(configPath, options, context);
      case 'help':
        return this.showConfigHelp();
      default:
        return await this.autoConfigAction(configPath, keyPath, value, options, context);
    }
  },
  
  /**
   * 解析配置参数
   */
  parseConfigArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let operation = 'auto'; // get, set, list, backup, reset, validate, help, auto
    let configPath = '';
    let keyPath = '';
    let value = null;
    let options = {
      createBackup: true,
      prettyPrint: true,
      format: 'json',
      dryRun: false
    };
    
    // 检查操作类型
    const operationMatch = argsStr.match(/^(get|set|list|backup|reset|validate|help)\s+(.+)/i);
    if (operationMatch) {
      operation = operationMatch[1].toLowerCase();
      const remaining = operationMatch[2];
      
      // 对于set操作，解析键值对
      if (operation === 'set') {
        const setMatch = remaining.match(/^([\w\.\-]+)\s+([\w\.\-]+)\s+(.+)/i);
        if (setMatch) {
          configPath = setMatch[1];
          keyPath = setMatch[2];
          value = setMatch[3].trim();
        } else {
          // 可能是简单的设置
          const simpleMatch = remaining.match(/^([\w\.\-]+)\s+(.+)/i);
          if (simpleMatch) {
            keyPath = simpleMatch[1];
            value = simpleMatch[2].trim();
          }
        }
      } else {
        // 对于其他操作，第一个参数可能是配置路径
        const pathMatch = remaining.match(/^([\w\.\-\\/]+)(?:\s+(.+))?/i);
        if (pathMatch) {
          configPath = pathMatch[1];
          if (operation === 'get') {
            keyPath = pathMatch[2] || '';
          }
        }
      }
    } else if (/^(get|set|list|backup|reset|validate|help)$/i.test(argsStr)) {
      operation = argsStr.toLowerCase();
    }
    
    // 解析选项
    if (argsStr.includes('--no-backup')) {
      options.createBackup = false;
    }
    
    if (argsStr.includes('--dry-run')) {
      options.dryRun = true;
    }
    
    if (argsStr.includes('--compact')) {
      options.prettyPrint = false;
    }
    
    if (argsStr.includes('--yaml')) {
      options.format = 'yaml';
    }
    
    // 清理值
    if (value) {
      value = value.replace(/^["']|["']$/g, '').trim();
    }
    
    return { operation, configPath, keyPath, value, options };
  },
  
  /**
   * 显示配置帮助
   */
  showConfigHelp() {
    return {
      success: true,
      skill: 'updateConfig',
      operation: 'help',
      help: {
        description: 'OpenClaw配置管理工具',
        operations: [
          { command: 'updateConfig get [路径] [键]', description: '获取配置值', example: 'updateConfig get gateway.port' },
          { command: 'updateConfig set [键] [值]', description: '设置配置值', example: 'updateConfig set gateway.port 20001' },
          { command: 'updateConfig list', description: '列出所有配置文件', example: 'updateConfig list' },
          { command: 'updateConfig backup [路径]', description: '备份配置文件', example: 'updateConfig backup' },
          { command: 'updateConfig reset [路径]', description: '重置为默认配置', example: 'updateConfig reset --dry-run' },
          { command: 'updateConfig validate [路径]', description: '验证配置文件', example: 'updateConfig validate' }
        ],
        options: [
          { option: '--no-backup', description: '设置时不创建备份' },
          { option: '--dry-run', description: '模拟操作，不实际修改' },
          { option: '--compact', description: '紧凑输出格式' },
          { option: '--yaml', description: 'YAML格式输出' }
        ],
        configPaths: this.configPaths,
        examples: [
          'updateConfig get gateway.port',
          'updateConfig set gateway.port 20001',
          'updateConfig list',
          'updateConfig backup',
          'updateConfig validate --dry-run'
        ]
      },
      summary: '配置管理工具 - 读取、更新、备份OpenClaw配置',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 自动配置操作
   */
  async autoConfigAction(configPath, keyPath, value, options, context) {
    // 自动判断操作
    if (value !== null) {
      // 有值，可能是set操作
      return await this.setConfig(configPath || this.findActiveConfig(), keyPath, value, options, context);
    } else if (keyPath) {
      // 有键路径，可能是get操作
      return await this.getConfig(configPath || this.findActiveConfig(), keyPath, options, context);
    } else if (configPath) {
      // 只有配置路径，可能是get操作（获取整个配置）
      return await this.getConfig(configPath, '', options, context);
    } else {
      // 什么都没有，显示帮助
      return this.showConfigHelp();
    }
  },
  
  /**
   * 查找活动配置文件
   */
  findActiveConfig() {
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        console.log(`  找到配置文件: ${configPath}`);
        return configPath;
      }
    }
    console.log('  未找到配置文件，使用第一个路径作为默认');
    return this.configPaths[0];
  },
  
  /**
   * 获取配置
   */
  async getConfig(configPath, keyPath, options, context) {
    try {
      const actualPath = configPath || this.findActiveConfig();
      
      if (!fs.existsSync(actualPath)) {
        return {
          success: false,
          skill: 'updateConfig',
          error: `配置文件不存在: ${actualPath}`,
          suggestion: '使用 updateConfig list 查看可用配置文件',
          timestamp: new Date().toISOString()
        };
      }
      
      const configContent = fs.readFileSync(actualPath, 'utf8');
      const config = JSON.parse(configContent);
      
      let result = config;
      let resultPath = keyPath;
      
      // 如果有键路径，导航到该值
      if (keyPath && keyPath.trim() !== '') {
        const keys = keyPath.split('.');
        result = config;
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key];
          } else {
            return {
              success: false,
              skill: 'updateConfig',
              error: `配置键不存在: ${keyPath}`,
              availableKeys: this.getAvailableKeys(config, keys.slice(0, -1).join('.')),
              timestamp: new Date().toISOString()
            };
          }
        }
      }
      
      console.log(`  获取配置: ${actualPath}${keyPath ? ' -> ' + keyPath : ''}`);
      
      return {
        success: true,
        skill: 'updateConfig',
        operation: 'get',
        configPath: actualPath,
        keyPath: keyPath || '全部',
        value: result,
        valueType: typeof result,
        summary: `获取配置${keyPath ? '键: ' + keyPath : '文件'}成功`,
        format: options.format,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('获取配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `获取配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 获取可用键
   */
  getAvailableKeys(config, parentPath = '') {
    const keys = [];
    
    if (config && typeof config === 'object') {
      for (const key in config) {
        const fullPath = parentPath ? `${parentPath}.${key}` : key;
        keys.push(fullPath);
        
        if (config[key] && typeof config[key] === 'object') {
          keys.push(...this.getAvailableKeys(config[key], fullPath));
        }
      }
    }
    
    return keys.slice(0, 20); // 限制返回数量
  },
  
  /**
   * 设置配置
   */
  async setConfig(configPath, keyPath, value, options, context) {
    try {
      const actualPath = configPath || this.findActiveConfig();
      
      if (!fs.existsSync(actualPath)) {
        // 如果文件不存在，创建基础配置
        const defaultConfig = {
          gateway: {
            port: 20001,
            auth: { mode: "none" }
          },
          plugins: {
            allow: ["memory-core", "dreaming", "cron", "gateway", "help", "models", "plugins", "sessions", "subagents", "tools", "web", "memory", "status", "onboard", "agents"]
          }
        };
        
        fs.writeFileSync(actualPath, JSON.stringify(defaultConfig, null, 2));
        console.log(`  创建新配置文件: ${actualPath}`);
      }
      
      // 读取现有配置
      const configContent = fs.readFileSync(actualPath, 'utf8');
      const config = JSON.parse(configContent);
      
      // 解析值（尝试转换为适当类型）
      let parsedValue = value;
      if (value.toLowerCase() === 'true') parsedValue = true;
      else if (value.toLowerCase() === 'false') parsedValue = false;
      else if (value.toLowerCase() === 'null') parsedValue = null;
      else if (!isNaN(value) && value.trim() !== '') parsedValue = Number(value);
      else if (value.startsWith('{') || value.startsWith('[')) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // 保持为字符串
        }
      }
      
      // 备份原始配置
      if (options.createBackup && !options.dryRun) {
        const backupPath = `${actualPath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, configContent);
        console.log(`  创建备份: ${backupPath}`);
      }
      
      // 设置值
      if (!keyPath || keyPath.trim() === '') {
        // 设置整个配置
        if (options.dryRun) {
          console.log(`  [模拟] 设置整个配置 (dry-run)`);
        } else {
          fs.writeFileSync(actualPath, JSON.stringify(parsedValue, null, 2));
          console.log(`  设置整个配置完成`);
        }
      } else {
        // 设置特定键
        const keys = keyPath.split('.');
        let current = config;
        
        // 导航到父对象
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current)) {
            current[key] = {};
          }
          current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        const oldValue = current[finalKey];
        
        if (options.dryRun) {
          console.log(`  [模拟] 设置 ${keyPath}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(parsedValue)}`);
        } else {
          current[finalKey] = parsedValue;
          fs.writeFileSync(actualPath, JSON.stringify(config, null, 2));
          console.log(`  设置 ${keyPath}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(parsedValue)}`);
        }
      }
      
      return {
        success: true,
        skill: 'updateConfig',
        operation: 'set',
        configPath: actualPath,
        keyPath: keyPath || '全部',
        oldValue: keyPath ? this.getValueByPath(config, keyPath) : config,
        newValue: parsedValue,
        dryRun: options.dryRun,
        backupCreated: options.createBackup && !options.dryRun,
        summary: options.dryRun ? 
          `模拟设置配置${keyPath ? '键: ' + keyPath : ''} (dry-run)` :
          `设置配置${keyPath ? '键: ' + keyPath : ''}成功`,
        nextSteps: options.dryRun ? [] : [
          '重启Gateway使更改生效',
          '使用 updateConfig get 验证更改',
          '使用 updateConfig backup 创建额外备份'
        ],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('设置配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `设置配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 通过路径获取值
   */
  getValueByPath(config, keyPath) {
    if (!keyPath) return config;
    
    const keys = keyPath.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  },
  
  /**
   * 列出配置文件
   */
  async listConfigs(options, context) {
    try {
      const configs = [];
      
      for (const configPath of this.configPaths) {
        const exists = fs.existsSync(configPath);
        let info = { path: configPath, exists };
        
        if (exists) {
          try {
            const stats = fs.statSync(configPath);
            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content);
            
            info.size = stats.size;
            info.modified = stats.mtime;
            info.isValid = true;
            info.keyCount = this.countKeys(config);
            info.hasGateway = 'gateway' in config;
            info.hasPlugins = 'plugins' in config;
            
            // 提取关键信息
            info.summary = this.getConfigSummary(config);
          } catch (error) {
            info.isValid = false;
            info.error = error.message;
          }
        }
        
        configs.push(info);
      }
      
      const activeConfig = this.findActiveConfig();
      console.log(`  列出配置文件: 找到${configs.filter(c => c.exists).length}/${configs.length}个`);
      
      return {
        success: true,
        skill: 'updateConfig',
        operation: 'list',
        configs: configs,
        activeConfig: activeConfig,
        summary: `找到${configs.filter(c => c.exists).length}个配置文件`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('列出配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `列出配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 计算键数量
   */
  countKeys(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 5) return 0;
    
    let count = Object.keys(obj).length;
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        count += this.countKeys(obj[key], depth + 1);
      }
    }
    
    return count;
  },
  
  /**
   * 获取配置摘要
   */
  getConfigSummary(config) {
    const summary = [];
    
    if (config.gateway) {
      if (config.gateway.port) summary.push(`Gateway端口: ${config.gateway.port}`);
      if (config.gateway.auth && config.gateway.auth.mode) summary.push(`认证模式: ${config.gateway.auth.mode}`);
    }
    
    if (config.plugins && config.plugins.allow) {
      summary.push(`插件数量: ${config.plugins.allow.length}`);
    }
    
    if (config.memory && config.memory.core) {
      summary.push('记忆系统: 已配置');
    }
    
    return summary.length > 0 ? summary.join(', ') : '基础配置';
  },
  
  /**
   * 备份配置
   */
  async backupConfig(configPath, options, context) {
    try {
      const actualPath = configPath || this.findActiveConfig();
      
      if (!fs.existsSync(actualPath)) {
        return {
          success: false,
          skill: 'updateConfig',
          error: `配置文件不存在: ${actualPath}`,
          timestamp: new Date().toISOString()
        };
      }
      
      const backupPath = `${actualPath}.backup.${Date.now()}.json`;
      fs.copyFileSync(actualPath, backupPath);
      
      console.log(`  备份完成: ${actualPath} -> ${backupPath}`);
      
      return {
        success: true,
        skill: 'updateConfig',
        operation: 'backup',
        originalPath: actualPath,
        backupPath: backupPath,
        summary: `配置文件备份成功`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('备份配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `备份配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 重置配置
   */
  async resetConfig(configPath, options, context) {
    try {
      const actualPath = configPath || this.findActiveConfig();
      
      if (!fs.existsSync(actualPath)) {
        return {
          success: false,
          skill: 'updateConfig',
          error: `配置文件不存在: ${actualPath}`,
          timestamp: new Date().toISOString()
        };
      }
      
      // 默认配置
      const defaultConfig = {
        gateway: {
          port: 20001,
          auth: { mode: "none" },
          controlUi: {
            allowedOrigins: [
              "file://",
              "http://localhost:*",
              "http://127.0.0.1:*"
            ]
          }
        },
        plugins: {
          allow: ["memory-core", "dreaming", "cron", "gateway", "help", "models", "plugins", "sessions", "subagents", "tools", "web", "memory", "status", "onboard", "agents"]
        },
        browser: {
          enabled: true,
          defaultProfile: "openclaw"
        },
        session: {
          idleMinutes: 10080
        },
        skills: {
          entries: {
            pdf: { enabled: true },
            xlsx: { enabled: true },
            docx: { enabled: true },
            pptx: { enabled: true }
          }
        }
      };
      
      // 备份当前配置
      const backupPath = `${actualPath}.backup.before-reset.${Date.now()}.json`;
      fs.copyFileSync(actualPath, backupPath);
      
      if (options.dryRun) {
        console.log(`  [模拟] 重置配置 (dry-run)`);
        console.log(`    备份位置: ${backupPath}`);
      } else {
        fs.writeFileSync(actualPath, JSON.stringify(defaultConfig, null, 2));
        console.log(`  配置重置完成`);
        console.log(`    备份位置: ${backupPath}`);
      }
      
      return {
        success: true,
        skill: 'updateConfig',
        operation: 'reset',
        configPath: actualPath,
        backupPath: backupPath,
        dryRun: options.dryRun,
        summary: options.dryRun ? '模拟重置配置 (dry-run)' : '配置重置成功',
        warning: '重置后需要重启Gateway使更改生效',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('重置配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `重置配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 验证配置
   */
  async validateConfig(configPath, options, context) {
    try {
      const actualPath = configPath || this.findActiveConfig();
      
      if (!fs.existsSync(actualPath)) {
        return {
          success: false,
          skill: 'updateConfig',
          error: `配置文件不存在: ${actualPath}`,
          timestamp: new Date().toISOString()
        };
      }
      
      const configContent = fs.readFileSync(actualPath, 'utf8');
      const issues = [];
      
      // 检查JSON语法
      try {
        JSON.parse(configContent);
      } catch (error) {
        issues.push({
          type: 'syntax',
          severity: 'error',
          message: `JSON语法错误: ${error.message}`,
          line: this.getLineFromError(error, configContent)
        });
      }
      
      // 如果语法正确，进一步检查
      if (issues.length === 0) {
        const config = JSON.parse(configContent);
        
        // 检查必需字段
        if (!config.gateway) {
          issues.push({
            type: 'structure',
            severity: 'warning',
            message: '缺少gateway配置节',
            suggestion: '建议添加gateway配置'
          });
        } else {
          if (!config.gateway.port) {
            issues.push({
              type: 'structure',
              severity: 'warning',
              message: 'gateway缺少port配置',
              suggestion: '建议设置gateway.port (默认: 20001)'
            });
          }
        }
        
        if (!config.plugins) {
          issues.push({
            type: 'structure',
            severity: 'info',
            message: '缺少plugins配置节',
            suggestion: '建议添加plugins配置以启用插件'
          });
        } else if (!config.plugins.allow || !Array.isArray(config.plugins.allow)) {
          issues.push({
            type: 'structure',
            severity: 'warning',
            message: 'plugins.allow必须是数组',
            suggestion: '建议设置plugins.allow为字符串数组'
          });
        }
      }
      
      const hasErrors = issues.some(issue => issue.severity === 'error');
      const hasWarnings = issues.some(issue => issue.severity === 'warning');
      
      console.log(`  验证配置: ${actualPath}`);
      console.log(`    问题数量: ${issues.length} (${hasErrors ? '有错误' : '无错误'})`);
      
      return {
        success: !hasErrors,
        skill: 'updateConfig',
        operation: 'validate',
        configPath: actualPath,
        issues: issues,
        errorCount: issues.filter(i => i.severity === 'error').length,
        warningCount: issues.filter(i => i.severity === 'warning').length,
        infoCount: issues.filter(i => i.severity === 'info').length,
        isValid: !hasErrors,
        summary: hasErrors ? '配置验证失败' : '配置验证通过',
        recommendations: issues.length > 0 ? [
          '根据建议修复问题',
          '使用 updateConfig set 更新配置',
          '验证后重启Gateway'
        ] : ['配置格式正确，无需修改'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('验证配置失败:', error);
      return {
        success: false,
        skill: 'updateConfig',
        error: `验证配置失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 从错误中获取行号
   */
  getLineFromError(error, content) {
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      const lines = content.substring(0, position).split('\n');
      return lines.length;
    }
    return null;
  }
};