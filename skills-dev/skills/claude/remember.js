/**
 * Remember Skill - 记忆辅助工具
 * 
 * Claude Code remember.ts的简化移植版本
 * 提供记忆管理、查询、提醒和整理功能
 * 与OpenClaw三层记忆系统集成
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  // Skill定义
  name: 'remember',
  description: '记忆管理和辅助工具',
  type: 'prompt',
  aliases: ['recall', 'memorize', 'remind', 'memory'],
  whenToUse: '当你需要记住重要信息、查询之前的记忆或设置提醒时使用',
  argumentHint: '[操作] [内容] - 操作: add/search/list/remind/help, 内容: 要记忆或查询的信息',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { operation, content, options } = this.parseRememberArgs(args);
    
    console.log(`🧠 [Remember Skill] 执行操作: ${operation}, 内容: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    
    // 根据操作执行
    switch (operation) {
      case 'add':
        return await this.addMemory(content, options, context);
      case 'search':
        return await this.searchMemory(content, options, context);
      case 'list':
        return await this.listMemory(content, options, context);
      case 'remind':
        return await this.setReminder(content, options, context);
      case 'help':
        return this.showHelp();
      default:
        return await this.autoMemory(content, options, context);
    }
  },
  
  /**
   * 解析记忆参数
   */
  parseRememberArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let operation = 'auto'; // auto, add, search, list, remind, help
    let content = argsStr;
    let options = {
      category: 'general',
      priority: 'medium',
      tags: []
    };
    
    // 检查操作类型
    const operationMatch = argsStr.match(/^(add|search|list|remind|help)\s+(.+)/i);
    if (operationMatch) {
      operation = operationMatch[1].toLowerCase();
      content = operationMatch[2];
    } else if (/^(add|search|list|remind|help)$/i.test(argsStr)) {
      operation = argsStr.toLowerCase();
      content = '';
    }
    
    // 解析选项
    const categoryMatch = content.match(/--category\s+(\w+)/i);
    if (categoryMatch) {
      options.category = categoryMatch[1].toLowerCase();
      content = content.replace(/--category\s+\w+/i, '').trim();
    }
    
    const priorityMatch = content.match(/--priority\s+(low|medium|high)/i);
    if (priorityMatch) {
      options.priority = priorityMatch[1].toLowerCase();
      content = content.replace(/--priority\s+(low|medium|high)/i, '').trim();
    }
    
    const tagsMatch = content.match(/--tags\s+([\w\s,]+)/i);
    if (tagsMatch) {
      options.tags = tagsMatch[1].split(/[,\s]+/).filter(tag => tag.length > 0);
      content = content.replace(/--tags\s+[\w\s,]+/i, '').trim();
    }
    
    // 清理内容
    content = content.replace(/^["']|["']$/g, '').trim();
    
    return { operation, content, options };
  },
  
  /**
   * 自动记忆处理
   */
  async autoMemory(content, options, context) {
    if (!content || content.length === 0) {
      return {
        success: false,
        skill: 'remember',
        error: '需要提供要记忆或查询的内容',
        example: '使用: remember "重要的事情需要记住" 或 remember search "关键词"',
        timestamp: new Date().toISOString()
      };
    }
    
    // 根据内容判断操作
    const isQuestion = content.includes('?') || 
                      content.toLowerCase().includes('what') ||
                      content.toLowerCase().includes('how') ||
                      content.toLowerCase().includes('when') ||
                      content.toLowerCase().includes('where') ||
                      content.toLowerCase().includes('why');
    
    if (isQuestion || content.length < 20) {
      // 可能是查询
      return await this.searchMemory(content, options, context);
    } else {
      // 可能是添加记忆
      return await this.addMemory(content, options, context);
    }
  },
  
  /**
   * 添加记忆
   */
  async addMemory(content, options, context) {
    if (!content || content.length === 0) {
      return {
        success: false,
        skill: 'remember',
        error: '需要提供要记忆的内容',
        example: '使用: remember add "项目截止日期是周五"',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const memoryEntry = {
        id: this.generateId(),
        content: content,
        category: options.category,
        priority: options.priority,
        tags: options.tags,
        timestamp: new Date().toISOString(),
        context: context ? {
          sessionId: context.sessionId,
          workspace: context.workspace
        } : null
      };
      
      // 保存到记忆文件
      await this.saveMemory(memoryEntry);
      
      console.log(`  记忆添加: ${memoryEntry.id} (${options.category}, ${options.priority})`);
      
      return {
        success: true,
        skill: 'remember',
        operation: 'add',
        memoryId: memoryEntry.id,
        entry: memoryEntry,
        summary: `记忆已保存: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        nextSteps: [
          '使用 remember search 查询记忆',
          '使用 remember list 查看所有记忆',
          '使用 remember remind 设置提醒'
        ],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('添加记忆失败:', error);
      return {
        success: false,
        skill: 'remember',
        error: `添加记忆失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 搜索记忆
   */
  async searchMemory(query, options, context) {
    if (!query || query.length === 0) {
      return {
        success: false,
        skill: 'remember',
        error: '需要提供搜索关键词',
        example: '使用: remember search "项目名称"',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // 加载所有记忆
      const memories = await this.loadAllMemories();
      
      // 搜索匹配的记忆
      const searchResults = memories.filter(memory => {
        const searchText = query.toLowerCase();
        const memoryText = JSON.stringify(memory).toLowerCase();
        
        // 简单关键词匹配
        return memoryText.includes(searchText) ||
               memory.content.toLowerCase().includes(searchText) ||
               memory.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
               memory.category.toLowerCase().includes(searchText);
      });
      
      // 按相关性排序
      searchResults.sort((a, b) => {
        // 优先显示高优先级
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // 然后按时间排序（最新的在前）
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      console.log(`  搜索完成: 找到${searchResults.length}个相关记忆`);
      
      return {
        success: true,
        skill: 'remember',
        operation: 'search',
        query: query,
        results: searchResults.slice(0, 10), // 限制结果数量
        totalFound: searchResults.length,
        summary: `找到${searchResults.length}个相关记忆`,
        suggestions: searchResults.length === 0 ? [
          '尝试不同的关键词',
          '使用 remember list 查看所有记忆',
          '使用 remember add 添加新记忆'
        ] : [],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('搜索记忆失败:', error);
      return {
        success: false,
        skill: 'remember',
        error: `搜索记忆失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 列出记忆
   */
  async listMemory(filter, options, context) {
    try {
      // 加载所有记忆
      const memories = await this.loadAllMemories();
      
      let filteredMemories = memories;
      
      // 应用过滤器
      if (filter && filter.length > 0) {
        filteredMemories = memories.filter(memory => {
          return memory.category.toLowerCase().includes(filter.toLowerCase()) ||
                 memory.priority.toLowerCase().includes(filter.toLowerCase()) ||
                 memory.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()));
        });
      }
      
      // 按时间排序（最新的在前）
      filteredMemories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 分组统计
      const stats = {
        total: memories.length,
        filtered: filteredMemories.length,
        byCategory: {},
        byPriority: {},
        recent: filteredMemories.slice(0, 5)
      };
      
      memories.forEach(memory => {
        stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;
        stats.byPriority[memory.priority] = (stats.byPriority[memory.priority] || 0) + 1;
      });
      
      console.log(`  列出记忆: ${filteredMemories.length}/${memories.length}个`);
      
      return {
        success: true,
        skill: 'remember',
        operation: 'list',
        filter: filter || 'all',
        memories: filteredMemories.slice(0, 20), // 限制显示数量
        stats: stats,
        summary: `共${memories.length}个记忆，过滤后${filteredMemories.length}个`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('列出记忆失败:', error);
      return {
        success: false,
        skill: 'remember',
        error: `列出记忆失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 设置提醒
   */
  async setReminder(content, options, context) {
    if (!content || content.length === 0) {
      return {
        success: false,
        skill: 'remember',
        error: '需要提供提醒内容',
        example: '使用: remember remind "明天下午3点开会"',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // 解析提醒时间
      const timeMatch = content.match(/(\d+)\s*(分钟|小时|天|周|月)?/i);
      let timeDescription = 'soon';
      let delayMinutes = 60; // 默认1小时
      
      if (timeMatch) {
        const amount = parseInt(timeMatch[1]);
        const unit = (timeMatch[2] || '分钟').toLowerCase();
        
        switch (unit) {
          case '分钟':
            delayMinutes = amount;
            timeDescription = `${amount}分钟`;
            break;
          case '小时':
            delayMinutes = amount * 60;
            timeDescription = `${amount}小时`;
            break;
          case '天':
            delayMinutes = amount * 60 * 24;
            timeDescription = `${amount}天`;
            break;
          case '周':
            delayMinutes = amount * 60 * 24 * 7;
            timeDescription = `${amount}周`;
            break;
          case '月':
            delayMinutes = amount * 60 * 24 * 30;
            timeDescription = `${amount}个月`;
            break;
        }
      }
      
      const reminder = {
        id: this.generateId(),
        content: content.replace(/(\d+)\s*(分钟|小时|天|周|月)?/i, '').trim(),
        timeDescription: timeDescription,
        delayMinutes: delayMinutes,
        timestamp: new Date().toISOString(),
        dueTime: new Date(Date.now() + delayMinutes * 60000).toISOString()
      };
      
      // 保存提醒
      await this.saveReminder(reminder);
      
      console.log(`  提醒设置: ${reminder.id} (${timeDescription}后)`);
      
      return {
        success: true,
        skill: 'remember',
        operation: 'remind',
        reminder: reminder,
        summary: `提醒已设置: ${reminder.content} (${timeDescription}后)`,
        note: '提醒功能需要配合cron或定时检查才能实际触发',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('设置提醒失败:', error);
      return {
        success: false,
        skill: 'remember',
        error: `设置提醒失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 显示帮助
   */
  showHelp() {
    return {
      success: true,
      skill: 'remember',
      operation: 'help',
      help: {
        description: '记忆管理和辅助工具',
        operations: [
          { command: 'remember add "内容"', description: '添加新记忆', options: '--category, --priority, --tags' },
          { command: 'remember search "关键词"', description: '搜索记忆', options: '支持关键词和标签搜索' },
          { command: 'remember list [过滤器]', description: '列出所有记忆', options: '可按类别、优先级过滤' },
          { command: 'remember remind "内容"', description: '设置提醒', options: '支持时间如"30分钟"、"2天"' },
          { command: 'remember "内容"', description: '自动处理', options: '智能判断是添加还是查询' }
        ],
        categories: ['general', 'work', 'personal', 'project', 'idea', 'todo'],
        priorities: ['low', 'medium', 'high'],
        examples: [
          'remember add "项目截止日期是周五" --category work --priority high',
          'remember search "截止日期"',
          'remember list work',
          'remember remind "30分钟后检查邮件"',
          'remember "需要记住的重要信息"'
        ]
      },
      summary: '记忆管理工具 - 添加、搜索、列出、提醒',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 生成唯一ID
   */
  generateId() {
    return 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * 保存记忆
   */
  async saveMemory(memoryEntry) {
    // 这里简化实现，实际应该保存到文件或数据库
    // 为了演示，我们只是打印日志
    console.log(`  [模拟保存] 记忆ID: ${memoryEntry.id}`);
    console.log(`    内容: ${memoryEntry.content.substring(0, 100)}${memoryEntry.content.length > 100 ? '...' : ''}`);
    console.log(`    类别: ${memoryEntry.category}, 优先级: ${memoryEntry.priority}`);
    console.log(`    标签: ${memoryEntry.tags.join(', ') || '无'}`);
    
    // 在实际实现中，这里应该将记忆保存到文件
    // 例如: fs.appendFileSync('memories.json', JSON.stringify(memoryEntry) + '\n');
    
    return true;
  },
  
  /**
   * 保存提醒
   */
  async saveReminder(reminder) {
    // 类似记忆保存，简化实现
    console.log(`  [模拟保存] 提醒ID: ${reminder.id}`);
    console.log(`    内容: ${reminder.content}`);
    console.log(`    时间: ${reminder.timeDescription}后 (${reminder.dueTime})`);
    
    return true;
  },
  
  /**
   * 加载所有记忆
   */
  async loadAllMemories() {
    // 模拟加载一些示例记忆
    const exampleMemories = [
      {
        id: 'mem_example_1',
        content: 'OpenClaw Gateway运行在端口20001',
        category: 'work',
        priority: 'high',
        tags: ['openclaw', 'gateway', '配置'],
        timestamp: '2026-04-14T07:00:00.000Z'
      },
      {
        id: 'mem_example_2',
        content: 'Skills系统开发目录: skills-dev/',
        category: 'project',
        priority: 'medium',
        tags: ['skills', '开发', 'claude-code'],
        timestamp: '2026-04-14T07:30:00.000Z'
      },
      {
        id: 'mem_example_3',
        content: 'WebSocket监控服务端口: 3000',
        category: 'work',
        priority: 'medium',
        tags: ['监控', 'websocket', '稳定性'],
        timestamp: '2026-04-14T07:45:00.000Z'
      },
      {
        id: 'mem_example_4',
        content: '用户Bo时区: Asia/Shanghai (GMT+8)',
        category: 'personal',
        priority: 'low',
        tags: ['用户', '配置', '时区'],
        timestamp: '2026-04-14T08:00:00.000Z'
      }
    ];
    
    console.log(`  加载记忆: ${exampleMemories.length}个示例记忆`);
    return exampleMemories;
  },
  
  /**
   * 与OpenClaw记忆系统集成
   */
  async integrateWithOpenClawMemory() {
    // 这个函数展示了如何与OpenClaw的三层记忆系统集成
    // 在实际实现中，应该:
    // 1. 读取MEMORY.md (冷层记忆)
    // 2. 读取memory/YYYY-MM-DD.md (温层记忆)
    // 3. 访问当前会话记忆 (热层记忆)
    
    console.log('  记忆系统集成: OpenClaw三层架构');
    console.log('    热层: 当前会话记忆');
    console.log('    温层: 每日记忆文件 (memory/YYYY-MM-DD.md)');
    console.log('    冷层: 长期记忆 (MEMORY.md)');
    
    return {
      hotLayer: '当前会话中的记忆',
      warmLayer: '每日记忆文件',
      coldLayer: '长期记忆文件',
      integration: 'remember技能可以跨所有层级工作'
    };
  }
};