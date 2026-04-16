/**
 * Loop Skill - 循环执行工具
 * 
 * Claude Code loop.ts的简化移植版本
 * 提供定时循环执行任务的功能
 */

module.exports = {
  // Skill定义
  name: 'loop',
  description: '定时循环执行任务工具',
  type: 'prompt',
  aliases: ['repeat', 'schedule', 'interval', 'timer'],
  whenToUse: '当你需要定时或循环执行某个任务时使用',
  argumentHint: '[间隔] [指令] - 间隔: 5m, 30m, 2h, 1d (默认: 10m)',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 存储循环任务
  loops: {},
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { operation, interval, command, options } = this.parseLoopArgs(args);
    
    console.log(`🔄 [Loop Skill] 操作: ${operation}, 间隔: ${interval || 'N/A'}, 指令: ${command.substring(0, 50)}${command.length > 50 ? '...' : ''}`);
    
    // 根据操作执行
    switch (operation) {
      case 'start':
        return await this.startLoop(interval, command, options, context);
      case 'stop':
        return await this.stopLoop(command, options, context);
      case 'list':
        return await this.listLoops(options, context);
      case 'status':
        return await this.loopStatus(command, options, context);
      case 'help':
        return this.showLoopHelp();
      default:
        // 如果没有明确操作，默认为start
        return await this.startLoop(interval, command, options, context);
    }
  },
  
  /**
   * 解析循环参数
   */
  parseLoopArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let operation = 'start'; // start, stop, list, status, help
    let interval = '10m'; // 默认10分钟
    let command = '';
    let options = {
      loopId: null,
      maxRuns: null, // 最大运行次数
      immediate: true, // 立即执行一次
      persist: false // 是否持久化
    };
    
    // 检查操作类型
    const operationMatch = argsStr.match(/^(stop|list|status|help)\s*(.*)/i);
    if (operationMatch) {
      operation = operationMatch[1].toLowerCase();
      command = operationMatch[2].trim();
      return { operation, interval, command, options };
    }
    
    // 解析start操作的参数
    let remainingArgs = argsStr;
    
    // 解析间隔（三种模式）
    // 1. 开头的间隔: "5m 检查状态"
    const leadingIntervalMatch = remainingArgs.match(/^(\d+[smhd])\s+(.+)/i);
    if (leadingIntervalMatch) {
      interval = leadingIntervalMatch[1].toLowerCase();
      remainingArgs = leadingIntervalMatch[2];
    } else {
      // 2. 结尾的every: "检查状态 every 5m"
      const everyMatch = remainingArgs.match(/(.+)\s+every\s+(\d+[smhd])\s*$/i);
      if (everyMatch) {
        interval = everyMatch[2].toLowerCase();
        remainingArgs = everyMatch[1].trim();
      }
      // 3. 默认间隔10m
    }
    
    // 解析选项
    const maxRunsMatch = remainingArgs.match(/--max-runs\s+(\d+)/i);
    if (maxRunsMatch) {
      options.maxRuns = parseInt(maxRunsMatch[1]);
      remainingArgs = remainingArgs.replace(/--max-runs\s+\d+/i, '').trim();
    }
    
    const noImmediateMatch = remainingArgs.match(/--no-immediate/i);
    if (noImmediateMatch) {
      options.immediate = false;
      remainingArgs = remainingArgs.replace(/--no-immediate/i, '').trim();
    }
    
    const persistMatch = remainingArgs.match(/--persist/i);
    if (persistMatch) {
      options.persist = true;
      remainingArgs = remainingArgs.replace(/--persist/i, '').trim();
    }
    
    const idMatch = remainingArgs.match(/--id\s+([\w-]+)/i);
    if (idMatch) {
      options.loopId = idMatch[1];
      remainingArgs = remainingArgs.replace(/--id\s+[\w-]+/i, '').trim();
    }
    
    // 清理命令
    command = remainingArgs.replace(/^["']|["']$/g, '').trim();
    
    // 如果没有命令，显示帮助
    if (!command && operation === 'start') {
      operation = 'help';
    }
    
    return { operation, interval, command, options };
  },
  
  /**
   * 显示循环帮助
   */
  showLoopHelp() {
    return {
      success: true,
      skill: 'loop',
      operation: 'help',
      help: {
        description: '定时循环执行任务工具',
        syntax: 'loop [间隔] [指令] [选项]',
        intervals: [
          { format: 'Ns', example: '30s', description: 'N秒 (最小1秒，实际按分钟执行)' },
          { format: 'Nm', example: '5m', description: 'N分钟' },
          { format: 'Nh', example: '2h', description: 'N小时' },
          { format: 'Nd', example: '1d', description: 'N天' }
        ],
        operations: [
          { command: 'loop 5m "检查状态"', description: '每5分钟检查状态' },
          { command: 'loop "监控系统" every 30m', description: '每30分钟监控系统' },
          { command: 'loop stop [ID]', description: '停止循环任务' },
          { command: 'loop list', description: '列出所有循环任务' },
          { command: 'loop status [ID]', description: '查看任务状态' }
        ],
        options: [
          { option: '--max-runs N', description: '最大运行次数' },
          { option: '--no-immediate', description: '不立即执行，等待第一次间隔' },
          { option: '--persist', description: '持久化保存（实验性）' },
          { option: '--id ID', description: '指定任务ID' }
        ],
        examples: [
          'loop 5m "检查Gateway状态"',
          'loop "监控系统负载" every 30m --max-runs 10',
          'loop "每日备份" every 1d --persist',
          'loop stop gateway-monitor',
          'loop list'
        ]
      },
      summary: '循环执行工具 - 定时重复执行任务',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 启动循环
   */
  async startLoop(interval, command, options, context) {
    if (!command || command.length === 0) {
      return {
        success: false,
        skill: 'loop',
        error: '需要提供要循环执行的指令',
        example: '使用: loop 5m "检查系统状态"',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // 解析时间间隔
      const intervalMs = this.parseIntervalToMs(interval);
      if (!intervalMs) {
        return {
          success: false,
          skill: 'loop',
          error: `无效的时间间隔: ${interval}`,
          suggestion: '使用格式如: 30s, 5m, 2h, 1d',
          timestamp: new Date().toISOString()
        };
      }
      
      // 生成任务ID
      const loopId = options.loopId || this.generateLoopId(command);
      const humanInterval = this.formatIntervalHuman(interval);
      
      console.log(`  启动循环任务: ${loopId}`);
      console.log(`    间隔: ${interval} (${humanInterval})`);
      console.log(`    指令: ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);
      console.log(`    选项: 最大运行${options.maxRuns || '无限'}次, 立即执行: ${options.immediate}`);
      
      // 创建循环任务
      const loopTask = {
        id: loopId,
        interval: interval,
        intervalMs: intervalMs,
        command: command,
        options: options,
        status: 'running',
        runs: 0,
        successes: 0,
        failures: 0,
        createdAt: new Date().toISOString(),
        lastRun: null,
        nextRun: new Date(Date.now() + (options.immediate ? 0 : intervalMs)).toISOString(),
        timer: null,
        context: context ? {
          sessionId: context.sessionId,
          workspace: context.workspace
        } : null
      };
      
      // 存储任务
      this.loops[loopId] = loopTask;
      
      // 设置定时器
      if (options.immediate) {
        // 立即执行一次
        this.executeLoopCommand(loopTask);
      }
      
      // 设置循环执行
      loopTask.timer = setInterval(() => {
        this.executeLoopCommand(loopTask);
      }, intervalMs);
      
      // 如果设置了最大运行次数，设置清理
      if (options.maxRuns) {
        setTimeout(() => {
          if (loopTask.runs >= options.maxRuns) {
            this.stopLoopById(loopId);
          }
        }, options.maxRuns * intervalMs + 1000);
      }
      
      return {
        success: true,
        skill: 'loop',
        operation: 'start',
        loopId: loopId,
        task: {
          id: loopId,
          interval: interval,
          humanInterval: humanInterval,
          command: command.substring(0, 100) + (command.length > 100 ? '...' : ''),
          nextRun: loopTask.nextRun,
          maxRuns: options.maxRuns || '无限'
        },
        summary: `循环任务已启动: ${loopId} (每${humanInterval}执行)`,
        commands: [
          `停止: loop stop ${loopId}`,
          `状态: loop status ${loopId}`,
          `列表: loop list`
        ],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('启动循环失败:', error);
      return {
        success: false,
        skill: 'loop',
        error: `启动循环失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 执行循环命令
   */
  async executeLoopCommand(loopTask) {
    const runId = `run_${loopTask.runs + 1}`;
    const startTime = Date.now();
    
    console.log(`  🔄 执行循环任务: ${loopTask.id} (${runId})`);
    console.log(`     命令: ${loopTask.command.substring(0, 60)}${loopTask.command.length > 60 ? '...' : ''}`);
    
    try {
      // 模拟命令执行（实际应用中这里会执行真实命令）
      const result = await this.simulateCommandExecution(loopTask);
      
      const duration = Date.now() - startTime;
      loopTask.runs++;
      loopTask.successes++;
      loopTask.lastRun = new Date().toISOString();
      loopTask.nextRun = new Date(Date.now() + loopTask.intervalMs).toISOString();
      
      console.log(`     ✅ 执行成功 (${duration}ms)`);
      console.log(`     运行次数: ${loopTask.runs}, 成功: ${loopTask.successes}, 失败: ${loopTask.failures}`);
      
      // 检查是否达到最大运行次数
      if (loopTask.options.maxRuns && loopTask.runs >= loopTask.options.maxRuns) {
        console.log(`     🎯 达到最大运行次数: ${loopTask.options.maxRuns}`);
        this.stopLoopById(loopTask.id);
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      loopTask.runs++;
      loopTask.failures++;
      loopTask.lastRun = new Date().toISOString();
      
      console.log(`     ❌ 执行失败 (${duration}ms): ${error.message}`);
      console.log(`     运行次数: ${loopTask.runs}, 成功: ${loopTask.successes}, 失败: ${loopTask.failures}`);
      
      // 连续失败检查
      if (loopTask.failures >= 3) {
        console.log(`     ⚠️  连续失败3次，自动停止任务: ${loopTask.id}`);
        this.stopLoopById(loopTask.id, '连续失败3次');
      }
      
      throw error;
    }
  },
  
  /**
   * 模拟命令执行
   */
  async simulateCommandExecution(loopTask) {
    // 模拟执行时间 (100-5000ms)
    const delay = 100 + Math.random() * 4900;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 模拟成功率 (95%)
    if (Math.random() < 0.95) {
      return {
        success: true,
        loopId: loopTask.id,
        runNumber: loopTask.runs + 1,
        timestamp: new Date().toISOString(),
        simulated: true,
        message: `循环任务 ${loopTask.id} 第${loopTask.runs + 1}次执行成功`
      };
    } else {
      throw new Error(`模拟执行失败 (${loopTask.id} 第${loopTask.runs + 1}次)`);
    }
  },
  
  /**
   * 停止循环
   */
  async stopLoop(command, options, context) {
    const loopId = command || options.loopId;
    
    if (!loopId) {
      return {
        success: false,
        skill: 'loop',
        error: '需要提供要停止的循环任务ID',
        suggestion: '使用: loop stop [ID] 或 loop list 查看所有任务',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const result = this.stopLoopById(loopId);
      
      if (result.success) {
        return {
          success: true,
          skill: 'loop',
          operation: 'stop',
          loopId: loopId,
          stopped: true,
          summary: `循环任务已停止: ${loopId}`,
          stats: result.stats,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          skill: 'loop',
          error: `找不到循环任务: ${loopId}`,
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('停止循环失败:', error);
      return {
        success: false,
        skill: 'loop',
        error: `停止循环失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 停止指定ID的循环
   */
  stopLoopById(loopId, reason = '手动停止') {
    const loopTask = this.loops[loopId];
    
    if (!loopTask) {
      return {
        success: false,
        error: `循环任务不存在: ${loopId}`
      };
    }
    
    // 清除定时器
    if (loopTask.timer) {
      clearInterval(loopTask.timer);
      loopTask.timer = null;
    }
    
    // 更新状态
    loopTask.status = 'stopped';
    loopTask.stoppedAt = new Date().toISOString();
    loopTask.stopReason = reason;
    
    console.log(`  停止循环任务: ${loopId} (原因: ${reason})`);
    console.log(`    总运行: ${loopTask.runs}次, 成功: ${loopTask.successes}, 失败: ${loopTask.failures}`);
    
    const stats = {
      totalRuns: loopTask.runs,
      successes: loopTask.successes,
      failures: loopTask.failures,
      successRate: loopTask.runs > 0 ? Math.round(loopTask.successes / loopTask.runs * 100) : 0,
      duration: loopTask.createdAt ? 
        Math.round((new Date() - new Date(loopTask.createdAt)) / 1000) : 0
    };
    
    // 从活动列表中移除
    delete this.loops[loopId];
    
    return {
      success: true,
      loopId: loopId,
      stats: stats,
      message: `循环任务 ${loopId} 已停止`
    };
  },
  
  /**
   * 列出所有循环
   */
  async listLoops(options, context) {
    try {
      const loopIds = Object.keys(this.loops);
      const activeLoops = [];
      const stoppedLoops = [];
      
      // 分类循环任务
      Object.values(this.loops).forEach(task => {
        if (task.status === 'running') {
          activeLoops.push(task);
        } else {
          stoppedLoops.push(task);
        }
      });
      
      console.log(`  列出循环任务: ${activeLoops.length}个活动中, ${stoppedLoops.length}个已停止`);
      
      return {
        success: true,
        skill: 'loop',
        operation: 'list',
        active: activeLoops.map(task => this.formatLoopForDisplay(task)),
        stopped: stoppedLoops.map(task => this.formatLoopForDisplay(task)),
        summary: `共${loopIds.length}个循环任务 (${activeLoops.length}活动中)`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('列出循环失败:', error);
      return {
        success: false,
        skill: 'loop',
        error: `列出循环失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 格式化循环任务显示
   */
  formatLoopForDisplay(task) {
    const humanInterval = this.formatIntervalHuman(task.interval);
    const successRate = task.runs > 0 ? Math.round(task.successes / task.runs * 100) : 0;
    
    return {
      id: task.id,
      interval: task.interval,
      humanInterval: humanInterval,
      command: task.command.substring(0, 80) + (task.command.length > 80 ? '...' : ''),
      status: task.status,
      runs: task.runs,
      successRate: `${successRate}%`,
      nextRun: task.nextRun,
      lastRun: task.lastRun,
      createdAt: task.createdAt
    };
  },
  
  /**
   * 循环状态
   */
  async loopStatus(loopId, options, context) {
    if (!loopId) {
      return {
        success: false,
        skill: 'loop',
        error: '需要提供循环任务ID',
        suggestion: '使用: loop status [ID] 或 loop list 查看所有任务',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const task = this.loops[loopId];
      
      if (!task) {
        return {
          success: false,
          skill: 'loop',
          error: `找不到循环任务: ${loopId}`,
          timestamp: new Date().toISOString()
        };
      }
      
      const humanInterval = this.formatIntervalHuman(task.interval);
      const successRate = task.runs > 0 ? Math.round(task.successes / task.runs * 100) : 0;
      const uptimeSeconds = task.createdAt ? 
        Math.round((new Date() - new Date(task.createdAt)) / 1000) : 0;
      
      console.log(`  循环任务状态: ${loopId}`);
      console.log(`    状态: ${task.status}, 运行: ${task.runs}次, 成功率: ${successRate}%`);
      
      return {
        success: true,
        skill: 'loop',
        operation: 'status',
        loopId: loopId,
        task: this.formatLoopForDisplay(task),
        stats: {
          totalRuns: task.runs,
          successes: task.successes,
          failures: task.failures,
          successRate: `${successRate}%`,
          uptime: this.formatDuration(uptimeSeconds),
          interval: humanInterval,
          nextRun: task.nextRun
        },
        summary: `循环任务 ${loopId}: ${task.status}, 运行${task.runs}次, 成功率${successRate}%`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('获取循环状态失败:', error);
      return {
        success: false,
        skill: 'loop',
        error: `获取循环状态失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  /**
   * 解析时间间隔为毫秒
   */
  parseIntervalToMs(interval) {
    const match = interval.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 's': return value * 1000; // 秒
      case 'm': return value * 60 * 1000; // 分钟
      case 'h': return value * 60 * 60 * 1000; // 小时
      case 'd': return value * 24 * 60 * 60 * 1000; // 天
      default: return null;
    }
  },
  
  /**
   * 格式化时间间隔为人类可读
   */
  formatIntervalHuman(interval) {
    const match = interval.match(/^(\d+)([smhd])$/i);
    if (!match) return interval;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const units = {
      s: '秒',
      m: '分钟',
      h: '小时',
      d: '天'
    };
    
    return `${value}${units[unit] || unit}`;
  },
  
  /**
   * 格式化持续时间
   */
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
    return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
  },
  
  /**
   * 生成循环ID
   */
  generateLoopId(command) {
    const timestamp = Date.now().toString(36);
    const hash = Math.random().toString(36).substr(2, 6);
    const prefix = command.substring(0, 20)
      .toLowerCase()
      .replace(/[^\w]/g, '')
      .replace(/^\d+/, '')
      .substring(0, 10);
    
    return `${prefix || 'loop'}_${timestamp}_${hash}`;
  },
  
  /**
   * 与OpenClaw Cron系统集成
   */
  async integrateWithOpenClawCron() {
    // 这个函数展示了如何与OpenClaw的cron系统集成
    console.log('  循环系统集成: OpenClaw Cron');
    console.log('    OpenClaw内置cron工具可以用于持久化循环任务');
    console.log('    当前实现使用JavaScript定时器，适合短期任务');
    console.log('    对于长期任务，建议使用OpenClaw cron集成');
    
    return {
      shortTerm: 'JavaScript定时器 (适合几分钟到几小时的任务)',
      longTerm: 'OpenClaw Cron (适合每天/每周的持久化任务)',
      integration: 'loop技能可以扩展到使用OpenClaw cron进行持久化'
    };
  }
};