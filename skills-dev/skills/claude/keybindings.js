/**
 * Keybindings Skill - 命令快捷方式管理工具
 * 
 * Claude Code keybindings.ts的简化移植版本
 * 针对OpenClaw环境适配：将键盘快捷键转换为命令快捷方式/别名管理
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  // Skill定义
  name: 'keybindings',
  description: 'OpenClaw命令快捷方式和别名管理工具',
  type: 'prompt',
  aliases: ['shortcuts', 'aliases', 'commands', 'keymap'],
  whenToUse: '当你需要管理命令快捷方式、创建别名或自定义工作流时使用',
  argumentHint: '[操作] [快捷方式] [命令] - 操作: list/add/remove/get/help',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 快捷方式文件路径
  shortcutsPath: path.join(process.cwd(), '.openclaw-shortcuts.json'),
  
  // 预定义快捷方式
  predefinedShortcuts: {
    // 调试相关
    'diag': 'debug system',
    'sysinfo': 'debug info',
    
    // 配置相关
    'config': 'updateConfig list',
    'settings': 'updateConfig get',
    
    // 记忆相关
    'mem': 'remember list',
    'remind': 'remember remind',
    
    // 文本相关
    'simple': 'simplify',
    'clarify': 'simplify comprehensive',
    
    // 执行相关
    'run': 'batch parallel',
    'bulk': 'batch sequential',
    
    // 验证相关
    'check': 'verify',
    'test': 'verify test',
    
    // 循环相关
    'repeat': 'loop add',
    'timer': 'loop list'
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { operation, shortcut, command, options } = this.parseKeybindingArgs(args);
    
    console.log(`⌨️ [Keybindings Skill] 操作: ${operation}, 快捷方式: ${shortcut}, 命令: ${command ? '已设置' : '未设置'}`);
    
    // 根据操作执行
    switch (operation) {
      case 'list':
        return await this.listShortcuts(options, context);
      case 'add':
        return await this.addShortcut(shortcut, command, options, context);
      case 'remove':
        return await this.removeShortcut(shortcut, options, context);
      case 'get':
        return await this.getShortcut(shortcut, options, context);
      case 'import':
        return await this.importShortcuts(options, context);
      case 'export':
        return await this.exportShortcuts(options, context);
      case 'help':
        return this.showKeybindingHelp();
      case 'doctor':
        return await this.validateShortcuts(options, context);
      default:
        return await this.autoKeybindingAction(shortcut, command, options, context);
    }
  },
  
  /**
   * 解析快捷方式参数
   */
  parseKeybindingArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let operation = 'auto'; // list, add, remove, get, import, export, help, doctor, auto
    let shortcut = '';
    let command = null;
    let options = {
      force: false,
      global: false,
      dryRun: false,
      format: 'json'
    };
    
    // 检查操作类型
    const operationMatch = argsStr.match(/^(list|add|remove|get|import|export|help|doctor)\s+(.+)/i);
    if (operationMatch) {
      operation = operationMatch[1].toLowerCase();
      const remaining = operationMatch[2];
      
      // 对于add操作，解析快捷方式和命令
      if (operation === 'add') {
        const addMatch = remaining.match(/^([\w\-]+)\s+(.+)/i);
        if (addMatch) {
          shortcut = addMatch[1];
          command = addMatch[2].trim();
        }
      } else if (operation === 'remove' || operation === 'get') {
        // 对于remove/get操作，第一个参数是快捷方式
        const shortcutMatch = remaining.match(/^([\w\-]+)/i);
        if (shortcutMatch) {
          shortcut = shortcutMatch[1];
        }
      }
    } else if (/^(list|add|remove|get|import|export|help|doctor)$/i.test(argsStr)) {
      operation = argsStr.toLowerCase();
    }
    
    // 解析选项
    if (argsStr.includes('--force')) {
      options.force = true;
    }
    
    if (argsStr.includes('--global')) {
      options.global = true;
    }
    
    if (argsStr.includes('--dry-run')) {
      options.dryRun = true;
    }
    
    if (argsStr.includes('--yaml')) {
      options.format = 'yaml';
    }
    
    // 清理命令
    if (command) {
      command = command.replace(/^["']|["']$/g, '').trim();
    }
    
    return { operation, shortcut, command, options };
  },
  
  /**
   * 显示快捷方式帮助
   */
  showKeybindingHelp() {
    return {
      success: true,
      skill: 'keybindings',
      operation: 'help',
      help: {
        description: 'OpenClaw命令快捷方式和别名管理工具',
        concept: '将复杂的命令映射为简单的快捷方式，提高工作效率',
        operations: [
          { command: 'keybindings list', description: '列出所有快捷方式', example: 'keybindings list' },
          { command: 'keybindings add [快捷方式] [命令]', description: '添加快捷方式', example: 'keybindings add diag "debug system"' },
          { command: 'keybindings remove [快捷方式]', description: '删除快捷方式', example: 'keybindings remove diag' },
          { command: 'keybindings get [快捷方式]', description: '获取快捷方式详情', example: 'keybindings get diag' },
          { command: 'keybindings import', description: '导入预定义快捷方式', example: 'keybindings import' },
          { command: 'keybindings export', description: '导出快捷方式配置', example: 'keybindings export' },
          { command: 'keybindings doctor', description: '验证快捷方式配置', example: 'keybindings doctor' }
        ],
        options: [
          { option: '--force', description: '强制覆盖现有快捷方式' },
          { option: '--global', description: '使用全局快捷方式文件' },
          { option: '--dry-run', description: '模拟操作，不实际修改' },
          { option: '--yaml', description: 'YAML格式输出' }
        ],
        predefinedShortcuts: Object.keys(this.predefinedShortcuts).slice(0, 10),
        examples: [
          'keybindings list',
          'keybindings add diag "debug system"',
          'keybindings get config',
          'keybindings import --dry-run',
          'keybindings doctor'
        ],
        fileLocation: this.getShortcutsPath(),
        tips: [
          '快捷方式名称只能包含字母、数字和连字符',
          '命令可以包含参数和选项',
          '使用引号包裹包含空格的命令',
          '导入功能会添加预定义快捷方式，不会删除现有配置'
        ]
      },
      summary: '命令快捷方式管理工具 - 创建、管理和使用命令别名',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 获取快捷方式文件路径
   */
  getShortcutsPath(global = false) {
    if (global) {
      return path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'shortcuts.json');
    }
    return this.shortcutsPath;
  },
  
  /**
   * 自动快捷方式操作
   */
  async autoKeybindingAction(shortcut, command, options, context) {
    // 自动判断操作
    if (command !== null) {
      // 有命令，可能是add操作
      return await this.addShortcut(shortcut, command, options, context);
    } else if (shortcut) {
      // 只有快捷方式，可能是get操作
      return await this.getShortcut(shortcut, options, context);
    } else {
      // 什么都没有，显示帮助
      return this.showKeybindingHelp();
    }
  },
  
  /**
   * 加载快捷方式配置
   */
  loadShortcuts(global = false) {
    const shortcutsPath = this.getShortcutsPath(global);
    
    if (!fs.existsSync(shortcutsPath)) {
      // 如果文件不存在，返回空配置
      return {
        $schema: 'https://schemas.openclaw.ai/shortcuts/v1',
        $docs: 'https://docs.openclaw.ai/en/shortcuts',
        version: '1.0',
        shortcuts: {},
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          count: 0
        }
      };
    }
    
    try {
      const content = fs.readFileSync(shortcutsPath, 'utf8');
      const config = JSON.parse(content);
      
      // 确保配置结构完整
      if (!config.shortcuts) {
        config.shortcuts = {};
      }
      
      if (!config.metadata) {
        config.metadata = {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          count: Object.keys(config.shortcuts).length
        };
      }
      
      return config;
    } catch (error) {
      console.error(`加载快捷方式配置失败: ${shortcutsPath}`, error);
      // 返回空配置
      return {
        $schema: 'https://schemas.openclaw.ai/shortcuts/v1',
        $docs: 'https://docs.openclaw.ai/en/shortcuts',
        version: '1.0',
        shortcuts: {},
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          count: 0,
          error: error.message
        }
      };
    }
  },
  
  /**
   * 保存快捷方式配置
   */
  saveShortcuts(config, global = false, dryRun = false) {
    const shortcutsPath = this.getShortcutsPath(global);
    
    // 更新元数据
    config.metadata.modified = new Date().toISOString();
    config.metadata.count = Object.keys(config.shortcuts).length;
    
    // 确保目录存在
    const dir = path.dirname(shortcutsPath);
    if (!fs.existsSync(dir) && !dryRun) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (dryRun) {
      console.log(`  [模拟] 保存快捷方式配置到: ${shortcutsPath}`);
      console.log(`    快捷方式数量: ${config.metadata.count}`);
      return shortcutsPath;
    }
    
    try {
      fs.writeFileSync(shortcutsPath, JSON.stringify(config, null, 2));
      console.log(`  保存快捷方式配置到: ${shortcutsPath}`);
      console.log(`    快捷方式数量: ${config.metadata.count}`);
      return shortcutsPath;
    } catch (error) {
      console.error(`保存快捷方式配置失败: ${shortcutsPath}`, error);
      throw error;
    }
  },
  
  /**
   * 列出所有快捷方式
   */
  async listShortcuts(options, context) {
    try {
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      const shortcuts = config.shortcuts;
      const count = Object.keys(shortcuts).length;
      const totalCount = count + Object.keys(this.predefinedShortcuts).length;
      
      console.log(`  列出快捷方式: ${global ? '全局' : '本地'}配置`);
      console.log(`    自定义: ${count}个`);
      console.log(`    预定义: ${Object.keys(this.predefinedShortcuts).length}个`);
      console.log(`    总计: ${totalCount}个`);
      
      // 构建分类列表
      const categories = {
        debug: {},
        config: {},
        memory: {},
        text: {},
        execution: {},
        validation: {},
        scheduling: {},
        other: {}
      };
      
      // 分类自定义快捷方式
      for (const [shortcut, command] of Object.entries(shortcuts)) {
        const category = this.categorizeShortcut(shortcut, command);
        categories[category][shortcut] = command;
      }
      
      // 分类预定义快捷方式
      for (const [shortcut, command] of Object.entries(this.predefinedShortcuts)) {
        const category = this.categorizeShortcut(shortcut, command);
        categories[category][shortcut] = command;
      }
      
      // 计算统计
      const stats = {
        total: totalCount,
        custom: count,
        predefined: Object.keys(this.predefinedShortcuts).length,
        byCategory: {}
      };
      
      for (const [category, items] of Object.entries(categories)) {
        stats.byCategory[category] = Object.keys(items).length;
      }
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'list',
        global: global,
        shortcuts: shortcuts,
        predefined: this.predefinedShortcuts,
        categories: categories,
        stats: stats,
        configLocation: this.getShortcutsPath(global),
        configMetadata: config.metadata,
        summary: `找到${totalCount}个快捷方式 (${count}个自定义)`,
        usageTips: [
          '使用 keybindings get [名称] 查看详情',
          '使用 keybindings add [名称] [命令] 添加新的',
          '预定义快捷方式始终可用，无需导入'
        ],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('列出快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `列出快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 分类快捷方式
   */
  categorizeShortcut(shortcut, command) {
    const cmdStr = command.toLowerCase();
    
    if (cmdStr.includes('debug') || shortcut.includes('diag') || shortcut.includes('sys')) {
      return 'debug';
    } else if (cmdStr.includes('config') || shortcut.includes('config') || shortcut.includes('settings')) {
      return 'config';
    } else if (cmdStr.includes('remember') || shortcut.includes('mem') || shortcut.includes('remind')) {
      return 'memory';
    } else if (cmdStr.includes('simplify') || shortcut.includes('simple') || shortcut.includes('clarify')) {
      return 'text';
    } else if (cmdStr.includes('batch') || shortcut.includes('run') || shortcut.includes('bulk')) {
      return 'execution';
    } else if (cmdStr.includes('verify') || shortcut.includes('check') || shortcut.includes('test')) {
      return 'validation';
    } else if (cmdStr.includes('loop') || shortcut.includes('repeat') || shortcut.includes('timer')) {
      return 'scheduling';
    } else {
      return 'other';
    }
  },
  
  /**
   * 添加快捷方式
   */
  async addShortcut(shortcut, command, options, context) {
    try {
      if (!shortcut || !command) {
        return {
          success: false,
          skill: 'keybindings',
          error: '需要提供快捷方式名称和命令',
          example: 'keybindings add diag "debug system"',
          timestamp: new Date().toISOString()
        };
      }
      
      // 验证快捷方式名称
      if (!/^[\w\-]+$/.test(shortcut)) {
        return {
          success: false,
          skill: 'keybindings',
          error: '快捷方式名称只能包含字母、数字和连字符',
          validExample: 'diag, sys-info, my-command',
          invalidExample: 'my command, cmd@test, test#1',
          timestamp: new Date().toISOString()
        };
      }
      
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      // 检查是否已存在
      const exists = shortcut in config.shortcuts;
      const isPredefined = shortcut in this.predefinedShortcuts;
      
      if (exists && !options.force && !options.dryRun) {
        return {
          success: false,
          skill: 'keybindings',
          error: `快捷方式 "${shortcut}" 已存在`,
          suggestion: '使用 --force 选项覆盖，或选择其他名称',
          existingCommand: config.shortcuts[shortcut],
          timestamp: new Date().toISOString()
        };
      }
      
      // 检查是否为预定义快捷方式
      if (isPredefined && !options.force) {
        return {
          success: false,
          skill: 'keybindings',
          warning: `"${shortcut}" 是预定义快捷方式`,
          predefinedCommand: this.predefinedShortcuts[shortcut],
          suggestion: '预定义快捷方式无法修改，请使用其他名称',
          timestamp: new Date().toISOString()
        };
      }
      
      const oldCommand = config.shortcuts[shortcut];
      config.shortcuts[shortcut] = command;
      
      if (options.dryRun) {
        console.log(`  [模拟] 添加快捷方式: ${shortcut} -> ${command}`);
        if (exists) {
          console.log(`    覆盖原有命令: ${oldCommand}`);
        }
      } else {
        this.saveShortcuts(config, global, false);
        console.log(`  添加快捷方式: ${shortcut} -> ${command}`);
        if (exists) {
          console.log(`    覆盖原有命令: ${oldCommand}`);
        }
      }
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'add',
        shortcut: shortcut,
        command: command,
        oldCommand: exists ? oldCommand : null,
        global: global,
        force: options.force,
        dryRun: options.dryRun,
        isNew: !exists,
        summary: options.dryRun ? 
          `模拟添加快捷方式 "${shortcut}" (dry-run)` :
          `${exists ? '更新' : '添加'}快捷方式 "${shortcut}" 成功`,
        usage: `使用方式: ${shortcut} [参数]`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('添加快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `添加快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 删除快捷方式
   */
  async removeShortcut(shortcut, options, context) {
    try {
      if (!shortcut) {
        return {
          success: false,
          skill: 'keybindings',
          error: '需要提供快捷方式名称',
          example: 'keybindings remove diag',
          timestamp: new Date().toISOString()
        };
      }
      
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      // 检查是否存在
      const exists = shortcut in config.shortcuts;
      const isPredefined = shortcut in this.predefinedShortcuts;
      
      if (!exists) {
        return {
          success: false,
          skill: 'keybindings',
          error: `快捷方式 "${shortcut}" 不存在`,
          suggestion: isPredefined ? 
            '这是预定义快捷方式，无法删除' :
            '使用 keybindings list 查看所有快捷方式',
          timestamp: new Date().toISOString()
        };
      }
      
      // 检查是否为预定义快捷方式
      if (isPredefined) {
        return {
          success: false,
          skill: 'keybindings',
          error: `"${shortcut}" 是预定义快捷方式，无法删除`,
          predefinedCommand: this.predefinedShortcuts[shortcut],
          suggestion: '预定义快捷方式始终可用，无法删除',
          timestamp: new Date().toISOString()
        };
      }
      
      const oldCommand = config.shortcuts[shortcut];
      delete config.shortcuts[shortcut];
      
      if (options.dryRun) {
        console.log(`  [模拟] 删除快捷方式: ${shortcut}`);
        console.log(`    原有命令: ${oldCommand}`);
      } else {
        this.saveShortcuts(config, global, false);
        console.log(`  删除快捷方式: ${shortcut}`);
        console.log(`    原有命令: ${oldCommand}`);
      }
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'remove',
        shortcut: shortcut,
        oldCommand: oldCommand,
        global: global,
        dryRun: options.dryRun,
        summary: options.dryRun ? 
          `模拟删除快捷方式 "${shortcut}" (dry-run)` :
          `删除快捷方式 "${shortcut}" 成功`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('删除快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `删除快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 获取快捷方式详情
   */
  async getShortcut(shortcut, options, context) {
    try {
      if (!shortcut) {
        return {
          success: false,
          skill: 'keybindings',
          error: '需要提供快捷方式名称',
          example: 'keybindings get diag',
          timestamp: new Date().toISOString()
        };
      }
      
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      // 检查自定义快捷方式
      const customExists = shortcut in config.shortcuts;
      const customCommand = config.shortcuts[shortcut];
      
      // 检查预定义快捷方式
      const predefinedExists = shortcut in this.predefinedShortcuts;
      const predefinedCommand = this.predefinedShortcuts[shortcut];
      
      const exists = customExists || predefinedExists;
      
      if (!exists) {
        return {
          success: false,
          skill: 'keybindings',
          error: `快捷方式 "${shortcut}" 不存在`,
          suggestion: '使用 keybindings list 查看所有快捷方式',
          similar: this.findSimilarShortcuts(shortcut),
          timestamp: new Date().toISOString()
        };
      }
      
      const isCustom = customExists;
      const isPredefined = predefinedExists;
      const command = isCustom ? customCommand : predefinedCommand;
      const source = isCustom ? 'custom' : 'predefined';
      
      console.log(`  获取快捷方式: ${shortcut}`);
      console.log(`    来源: ${source}`);
      console.log(`    命令: ${command}`);
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'get',
        shortcut: shortcut,
        command: command,
        source: source,
        global: global,
        category: this.categorizeShortcut(shortcut, command),
        summary: `快捷方式 "${shortcut}" 详情`,
        usage: `使用方式: ${shortcut} [参数]`,
        expandedCommand: this.expandCommand(command),
        similarShortcuts: this.findSimilarShortcuts(shortcut, command),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('获取快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `获取快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 查找相似快捷方式
   */
  findSimilarShortcuts(target, command = null) {
    const allShortcuts = {
      ...this.predefinedShortcuts,
      ...this.loadShortcuts(false).shortcuts,
      ...this.loadShortcuts(true).shortcuts
    };
    
    const similar = [];
    const targetLower = target.toLowerCase();
    
    for (const [shortcut, cmd] of Object.entries(allShortcuts)) {
      // 名称相似性
      const shortcutLower = shortcut.toLowerCase();
      const nameSimilarity = this.calculateSimilarity(targetLower, shortcutLower);
      
      // 命令相似性（如果提供了命令）
      let commandSimilarity = 0;
      if (command) {
        const cmdLower = cmd.toLowerCase();
        const targetCmdLower = command.toLowerCase();
        commandSimilarity = this.calculateSimilarity(targetCmdLower, cmdLower);
      }
      
      // 综合相似度
      const totalSimilarity = command ? 
        (nameSimilarity * 0.7 + commandSimilarity * 0.3) : 
        nameSimilarity;
      
      if (shortcut !== target && totalSimilarity > 0.3) {
        similar.push({
          shortcut,
          command: cmd,
          similarity: Math.round(totalSimilarity * 100),
          reason: nameSimilarity > 0.6 ? '名称相似' : '命令相似'
        });
      }
    }
    
    // 按相似度排序
    similar.sort((a, b) => b.similarity - a.similarity);
    
    return similar.slice(0, 5);
  },
  
  /**
   * 计算字符串相似度
   */
  calculateSimilarity(str1, str2) {
    // 简单相似度算法
    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;
    
    // 计算共同字符
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  },
  
  /**
   * 扩展命令
   */
  expandCommand(command) {
    // 简单的命令扩展
    const expansions = {
      'debug system': '获取系统信息和诊断数据',
      'debug info': '显示环境信息和配置',
      'updateConfig list': '列出所有配置文件',
      'updateConfig get': '获取配置值',
      'remember list': '列出记忆条目',
      'remember remind': '设置提醒',
      'simplify': '简化文本内容',
      'simplify comprehensive': '全面简化文本',
      'batch parallel': '并行执行批处理任务',
      'batch sequential': '顺序执行批处理任务',
      'verify': '验证代码和配置',
      'verify test': '运行测试',
      'loop add': '添加定时循环任务',
      'loop list': '列出循环任务'
    };
    
    return expansions[command] || `执行命令: ${command}`;
  },
  
  /**
   * 导入预定义快捷方式
   */
  async importShortcuts(options, context) {
    try {
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      let imported = 0;
      let skipped = 0;
      const results = [];
      
      for (const [shortcut, command] of Object.entries(this.predefinedShortcuts)) {
        if (shortcut in config.shortcuts) {
          // 已存在，跳过
          skipped++;
          results.push({
            shortcut,
            status: 'skipped',
            reason: '已存在'
          });
        } else {
          // 添加
          if (!options.dryRun) {
            config.shortcuts[shortcut] = command;
          }
          imported++;
          results.push({
            shortcut,
            status: options.dryRun ? 'pending' : 'imported',
            command: command
          });
        }
      }
      
      if (!options.dryRun && imported > 0) {
        this.saveShortcuts(config, global, false);
      }
      
      console.log(`  导入预定义快捷方式`);
      console.log(`    导入: ${imported}个`);
      console.log(`    跳过: ${skipped}个`);
      if (options.dryRun) {
        console.log(`    模拟运行 (dry-run)`);
      }
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'import',
        global: global,
        dryRun: options.dryRun,
        results: results,
        stats: {
          total: Object.keys(this.predefinedShortcuts).length,
          imported: imported,
          skipped: skipped
        },
        summary: options.dryRun ? 
          `模拟导入${imported}个预定义快捷方式 (dry-run)` :
          `导入${imported}个预定义快捷方式成功`,
        nextSteps: [
          '使用 keybindings list 查看所有快捷方式',
          '使用 keybindings get [名称] 查看详情',
          '预定义快捷方式现在可以像普通命令一样使用'
        ],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('导入快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `导入快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 导出快捷方式配置
   */
  async exportShortcuts(options, context) {
    try {
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      const exportData = {
        $schema: 'https://schemas.openclaw.ai/shortcuts/v1',
        $docs: 'https://docs.openclaw.ai/en/shortcuts',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        source: global ? 'global' : 'local',
        shortcuts: config.shortcuts,
        metadata: config.metadata
      };
      
      const exportPath = path.join(process.cwd(), `openclaw-shortcuts-export-${Date.now()}.json`);
      
      if (!options.dryRun) {
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      }
      
      console.log(`  导出快捷方式配置`);
      console.log(`    快捷方式数量: ${Object.keys(config.shortcuts).length}`);
      console.log(`    导出路径: ${exportPath}`);
      if (options.dryRun) {
        console.log(`    模拟运行 (dry-run)`);
      }
      
      return {
        success: true,
        skill: 'keybindings',
        operation: 'export',
        global: global,
        dryRun: options.dryRun,
        exportPath: options.dryRun ? null : exportPath,
        exportData: options.dryRun ? exportData : null,
        stats: {
          shortcuts: Object.keys(config.shortcuts).length,
          categories: this.countCategories(config.shortcuts)
        },
        summary: options.dryRun ? 
          '模拟导出快捷方式配置 (dry-run)' :
          '导出快捷方式配置成功',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('导出快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `导出快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 统计分类
   */
  countCategories(shortcuts) {
    const counts = {};
    
    for (const [shortcut, command] of Object.entries(shortcuts)) {
      const category = this.categorizeShortcut(shortcut, command);
      counts[category] = (counts[category] || 0) + 1;
    }
    
    return counts;
  },
  
  /**
   * 验证快捷方式配置
   */
  async validateShortcuts(options, context) {
    try {
      const global = options.global;
      const config = this.loadShortcuts(global);
      
      const issues = [];
      const warnings = [];
      const shortcuts = config.shortcuts;
      
      // 检查1: 验证快捷方式名称
      for (const shortcut of Object.keys(shortcuts)) {
        if (!/^[\w\-]+$/.test(shortcut)) {
          issues.push({
            type: 'validation',
            severity: 'error',
            shortcut: shortcut,
            message: '快捷方式名称包含无效字符',
            suggestion: '只使用字母、数字和连字符',
            fix: `重命名为有效名称，或删除该快捷方式`
          });
        }
        
        // 检查名称冲突
        if (shortcut in this.predefinedShortcuts) {
          warnings.push({
            type: 'conflict',
            severity: 'warning',
            shortcut: shortcut,
            message: '与预定义快捷方式冲突',
            predefined: this.predefinedShortcuts[shortcut],
            custom: shortcuts[shortcut],
            suggestion: '考虑使用其他名称以避免混淆'
          });
        }
      }
      
      // 检查2: 验证命令格式
      for (const [shortcut, command] of Object.entries(shortcuts)) {
        if (typeof command !== 'string') {
          issues.push({
            type: 'validation',
            severity: 'error',
            shortcut: shortcut,
            message: '命令必须是字符串',
            currentType: typeof command,
            suggestion: '将命令改为字符串格式'
          });
        } else if (command.trim().length === 0) {
          issues.push({
            type: 'validation',
            severity: 'error',
            shortcut: shortcut,
            message: '命令为空',
            suggestion: '提供有效的命令，或删除该快捷方式'
          });
        }
      }
      
      // 检查3: 重复命令
      const commandMap = {};
      for (const [shortcut, command] of Object.entries(shortcuts)) {
        if (command in commandMap) {
          warnings.push({
            type: 'duplicate',
            severity: 'warning',
            shortcut: shortcut,
            duplicateOf: commandMap[command],
            message: '命令与其他快捷方式重复',
            command: command,
            suggestion: '考虑合并或区分这些快捷方式'
          });
        } else {
          commandMap[command] = shortcut;
        }
      }
      
      const hasErrors = issues.some(issue => issue.severity === 'error');
      const hasWarnings = warnings.length > 0;
      
      console.log(`  验证快捷方式配置`);
      console.log(`    快捷方式数量: ${Object.keys(shortcuts).length}`);
      console.log(`    问题数量: ${issues.length} (${issues.filter(i => i.severity === 'error').length}错误)`);
      console.log(`    警告数量: ${warnings.length}`);
      
      return {
        success: !hasErrors,
        skill: 'keybindings',
        operation: 'doctor',
        global: global,
        configLocation: this.getShortcutsPath(global),
        configMetadata: config.metadata,
        issues: [...issues, ...warnings],
        errorCount: issues.filter(i => i.severity === 'error').length,
        warningCount: warnings.length,
        isValid: !hasErrors,
        summary: hasErrors ? '配置验证失败' : '配置验证通过',
        recommendations: issues.length > 0 ? [
          '根据建议修复问题',
          '使用 keybindings remove 删除无效快捷方式',
          '使用 keybindings add 重新添加'
        ] : ['配置格式正确，无需修改'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('验证快捷方式失败:', error);
      return {
        success: false,
        skill: 'keybindings',
        error: `验证快捷方式失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
};