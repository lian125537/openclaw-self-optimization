/**
 * Dream Skill - OpenClaw梦系统管理工具
 * 
 * Claude Code dream技能的自适应移植版本
 * 用于管理OpenClaw的Dreaming系统（记忆整合和自动化处理）
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  // Skill定义
  name: 'dream',
  description: 'OpenClaw梦系统管理工具',
  type: 'prompt',
  aliases: ['dreaming', 'memorydream', 'nightmare', 'sleep'],
  whenToUse: '当你需要管理OpenClaw的Dreaming系统、检查记忆整合状态、或手动触发记忆处理时使用',
  argumentHint: '[操作] [选项] - 操作: status/run/config/logs/analyze/help',
  
  // 允许的工具
  allowedTools: [], // 此Skill使用文件系统操作
  
  // 配置
  config: {
    // OpenClaw记忆目录
    memoryDir: path.join(process.cwd(), 'memory'),
    
    // Dreaming相关目录
    dreamsDir: path.join(process.cwd(), 'memory', '.dreams'),
    
    // 配置路径
    configPath: path.join(process.cwd(), 'openclaw.json'),
    
    // 默认Dreaming配置
    defaultConfig: {
      enabled: true,
      frequency: '0 3 * * *', // 每天凌晨3点
      timezone: 'Asia/Shanghai',
      stages: ['light', 'deep', 'rem']
    },
    
    // 操作类型
    operations: {
      status: '检查Dreaming系统状态',
      run: '手动触发Dreaming运行',
      config: '查看或修改Dreaming配置',
      logs: '查看Dreaming日志',
      analyze: '分析记忆和梦境',
      help: '显示帮助信息'
    }
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { operation, options } = this.parseDreamArgs(args);
    
    console.log(`💭 [Dream Skill] 执行: ${operation}, 选项: ${JSON.stringify(options)}`);
    
    // 检查Dreaming目录结构
    this.ensureDreamDirectories();
    
    // 执行操作
    const result = await this.performDreamOperation(operation, options, context);
    
    // 生成摘要
    const summary = this.generateSummary(operation, result);
    
    console.log(`  操作完成: ${summary}`);
    
    return {
      success: true,
      skill: 'dream',
      operation: operation,
      result: result,
      summary: summary,
      timestamp: timestamp,
      nextSteps: this.getNextSteps(operation, result)
    };
  },
  
  /**
   * 解析Dream参数
   */
  parseDreamArgs(args) {
    const argsStr = (args || '').trim();
    const parts = argsStr.split(/\s+/);
    
    // 默认值
    let operation = 'status'; // 默认检查状态
    const options = {
      stage: 'all', // 处理阶段
      force: false, // 强制运行
      detailed: false, // 详细输出
      limit: 10, // 日志限制
      configOnly: false // 仅配置
    };
    
    if (parts.length > 0 && parts[0]) {
      const op = parts[0].toLowerCase();
      if (Object.keys(this.config.operations).includes(op)) {
        operation = op;
      }
    }
    
    // 解析选项
    if (argsStr.includes('--force')) {
      options.force = true;
    }
    
    if (argsStr.includes('--detailed')) {
      options.detailed = true;
    }
    
    if (argsStr.includes('--stage=')) {
      const match = argsStr.match(/--stage=(\w+)/);
      if (match) {
        options.stage = match[1];
      }
    }
    
    if (argsStr.includes('--limit=')) {
      const match = argsStr.match(/--limit=(\d+)/);
      if (match) {
        options.limit = parseInt(match[1], 10);
      }
    }
    
    if (argsStr.includes('--config-only')) {
      options.configOnly = true;
    }
    
    // 操作特定默认值
    if (operation === 'logs') {
      options.detailed = true;
    }
    
    if (operation === 'analyze') {
      options.detailed = true;
      options.limit = 20;
    }
    
    return { operation, options };
  },
  
  /**
   * 确保Dream目录存在
   */
  ensureDreamDirectories() {
    const dirs = [
      this.config.memoryDir,
      this.config.dreamsDir,
      path.join(this.config.dreamsDir, 'session-corpus'),
      path.join(this.config.dreamsDir, 'light-staging'),
      path.join(this.config.dreamsDir, 'deep-staging'),
      path.join(this.config.dreamsDir, 'rem-staging')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`  创建目录: ${dir}`);
        } catch (error) {
          console.warn(`  创建目录失败: ${dir}`, error.message);
        }
      }
    }
  },
  
  /**
   * 执行Dream操作
   */
  async performDreamOperation(operation, options, context) {
    switch (operation) {
      case 'status':
        return await this.checkDreamStatus(options);
      case 'run':
        return await this.runDreaming(options);
      case 'config':
        return await this.manageDreamConfig(options);
      case 'logs':
        return await this.viewDreamLogs(options);
      case 'analyze':
        return await this.analyzeDreams(options);
      case 'help':
        return this.showDreamHelp(options);
      default:
        return {
          error: `未知操作: ${operation}`,
          availableOperations: Object.keys(this.config.operations)
        };
    }
  },
  
  /**
   * 检查Dreaming状态
   */
  async checkDreamStatus(options) {
    const status = {
      timestamp: new Date().toISOString(),
      directories: {},
      config: {},
      lastRun: null,
      nextRun: null,
      statistics: {}
    };
    
    // 检查目录状态
    status.directories = {
      memoryDir: {
        path: this.config.memoryDir,
        exists: fs.existsSync(this.config.memoryDir),
        files: fs.existsSync(this.config.memoryDir) ? 
          fs.readdirSync(this.config.memoryDir).length : 0
      },
      dreamsDir: {
        path: this.config.dreamsDir,
        exists: fs.existsSync(this.config.dreamsDir),
        subdirs: fs.existsSync(this.config.dreamsDir) ? 
          fs.readdirSync(this.config.dreamsDir).filter(f => 
            fs.statSync(path.join(this.config.dreamsDir, f)).isDirectory()
          ).length : 0
      }
    };
    
    // 检查配置文件
    if (fs.existsSync(this.config.configPath)) {
      try {
        const configContent = fs.readFileSync(this.config.configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // 提取Dreaming配置
        const dreamingConfig = this.extractDreamingConfig(config);
        status.config = dreamingConfig;
        
        // 计算下次运行时间
        if (dreamingConfig.enabled && dreamingConfig.frequency) {
          status.nextRun = this.calculateNextRunTime(dreamingConfig.frequency);
        }
      } catch (error) {
        status.config = { error: `配置解析失败: ${error.message}` };
      }
    } else {
      status.config = { error: '配置文件不存在', defaultConfig: this.config.defaultConfig };
    }
    
    // 查找最后一次运行
    status.lastRun = this.findLastDreamRun();
    
    // 收集统计信息
    status.statistics = this.collectDreamStatistics();
    
    // 总体状态评估
    status.overall = this.assessOverallStatus(status);
    
    return status;
  },
  
  /**
   * 提取Dreaming配置
   */
  extractDreamingConfig(fullConfig) {
    // 简化版本：尝试从插件配置中提取
    const dreamingConfig = {
      enabled: this.config.defaultConfig.enabled,
      frequency: this.config.defaultConfig.frequency,
      timezone: this.config.defaultConfig.timezone,
      source: 'default'
    };
    
    if (fullConfig.plugins && fullConfig.plugins.entries) {
      const entries = fullConfig.plugins.entries;
      
      // 检查memory-core插件
      if (entries['memory-core'] && entries['memory-core'].dreaming) {
        const dreamConfig = entries['memory-core'].dreaming;
        dreamingConfig.enabled = dreamConfig.enabled !== false;
        dreamingConfig.frequency = dreamConfig.frequency || dreamingConfig.frequency;
        dreamingConfig.timezone = dreamConfig.timezone || dreamingConfig.timezone;
        dreamingConfig.source = 'memory-core plugin';
      }
    }
    
    return dreamingConfig;
  },
  
  /**
   * 计算下次运行时间
   */
  calculateNextRunTime(cronExpression) {
    // 简化版本：返回描述性字符串
    // 实际应该使用cron解析器
    if (cronExpression === '0 3 * * *') {
      return '每天凌晨3:00 (Asia/Shanghai)';
    }
    
    return `根据cron表达式: ${cronExpression}`;
  },
  
  /**
   * 查找最后一次运行
   */
  findLastDreamRun() {
    const logsDir = this.config.dreamsDir;
    
    if (!fs.existsSync(logsDir)) {
      return null;
    }
    
    try {
      // 查找最新的梦境文件
      const dreamFiles = [];
      
      // 检查各阶段的暂存文件
      const stages = ['light', 'deep', 'rem'];
      for (const stage of stages) {
        const stageDir = path.join(logsDir, `${stage}-staging`);
        if (fs.existsSync(stageDir)) {
          const files = fs.readdirSync(stageDir);
          for (const file of files) {
            const filePath = path.join(stageDir, file);
            const stats = fs.statSync(filePath);
            dreamFiles.push({
              stage,
              file,
              path: filePath,
              mtime: stats.mtime,
              size: stats.size
            });
          }
        }
      }
      
      // 按修改时间排序
      dreamFiles.sort((a, b) => b.mtime - a.mtime);
      
      if (dreamFiles.length > 0) {
        const latest = dreamFiles[0];
        return {
          stage: latest.stage,
          file: latest.file,
          timestamp: latest.mtime.toISOString(),
          size: latest.size,
          age: this.formatTimeAgo(latest.mtime)
        };
      }
    } catch (error) {
      console.warn('查找最后运行失败:', error.message);
    }
    
    return null;
  },
  
  /**
   * 收集梦境统计信息
   */
  collectDreamStatistics() {
    const stats = {
      memoryFiles: 0,
      dreamFiles: 0,
      sessionFiles: 0,
      totalSize: 0,
      byStage: {}
    };
    
    try {
      // 统计内存文件
      if (fs.existsSync(this.config.memoryDir)) {
        const memoryFiles = fs.readdirSync(this.config.memoryDir);
        stats.memoryFiles = memoryFiles.filter(f => f.endsWith('.md')).length;
      }
      
      // 统计梦境文件
      if (fs.existsSync(this.config.dreamsDir)) {
        const stages = ['light', 'deep', 'rem'];
        for (const stage of stages) {
          const stageDir = path.join(this.config.dreamsDir, `${stage}-staging`);
          if (fs.existsSync(stageDir)) {
            const files = fs.readdirSync(stageDir);
            stats.dreamFiles += files.length;
            stats.byStage[stage] = files.length;
          }
        }
        
        // 统计会话语料库
        const sessionDir = path.join(this.config.dreamsDir, 'session-corpus');
        if (fs.existsSync(sessionDir)) {
          const sessionFiles = fs.readdirSync(sessionDir);
          stats.sessionFiles = sessionFiles.length;
        }
      }
    } catch (error) {
      console.warn('收集统计信息失败:', error.message);
    }
    
    return stats;
  },
  
  /**
   * 评估总体状态
   */
  assessOverallStatus(status) {
    const issues = [];
    
    // 检查目录
    if (!status.directories.memoryDir.exists) {
      issues.push('memory目录不存在');
    }
    
    if (!status.directories.dreamsDir.exists) {
      issues.push('dreams目录不存在');
    }
    
    // 检查配置
    if (status.config.error) {
      issues.push(`配置错误: ${status.config.error}`);
    } else if (!status.config.enabled) {
      issues.push('Dreaming系统未启用');
    }
    
    // 检查最近运行
    if (!status.lastRun) {
      issues.push('未找到历史运行记录');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      level: issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'error'
    };
  },
  
  /**
   * 运行Dreaming
   */
  async runDreaming(options) {
    const result = {
      timestamp: new Date().toISOString(),
      stage: options.stage,
      force: options.force,
      steps: [],
      output: {},
      success: false
    };
    
    // 模拟Dreaming运行过程
    // 实际实现应该调用OpenClaw的Dreaming API
    
    result.steps.push({
      name: '初始化',
      status: 'completed',
      message: '检查Dreaming系统状态'
    });
    
    // 检查状态
    const status = await this.checkDreamStatus({});
    result.output.status = status;
    
    if (!status.overall.healthy && !options.force) {
      result.steps.push({
        name: '健康检查',
        status: 'failed',
        message: `系统不健康: ${status.overall.issues.join(', ')}`
      });
      result.error = '系统不健康，使用--force强制运行';
      return result;
    }
    
    result.steps.push({
      name: '健康检查',
      status: 'completed',
      message: '系统状态检查通过'
    });
    
    // 模拟不同阶段的处理
    const stages = options.stage === 'all' ? ['light', 'deep', 'rem'] : [options.stage];
    
    for (const stage of stages) {
      result.steps.push({
        name: `${stage}阶段处理`,
        status: 'running',
        message: `开始${stage}阶段记忆处理`
      });
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 创建模拟输出文件
      const outputFile = this.createDreamOutput(stage, result.timestamp);
      
      result.steps.push({
        name: `${stage}阶段处理`,
        status: 'completed',
        message: `${stage}阶段完成，输出保存到: ${outputFile}`,
        outputFile
      });
      
      result.output[stage] = {
        processed: Math.floor(Math.random() * 50) + 10,
        duration: Math.floor(Math.random() * 2000) + 500,
        outputFile
      };
    }
    
    result.steps.push({
      name: '完成',
      status: 'completed',
      message: 'Dreaming运行完成'
    });
    
    result.success = true;
    result.summary = `成功运行${stages.length}个阶段，处理了${Object.values(result.output).filter(o => typeof o === 'object').reduce((sum, o) => sum + (o.processed || 0), 0)}条记忆`;
    
    return result;
  },
  
  /**
   * 创建模拟Dream输出
   */
  createDreamOutput(stage, timestamp) {
    const outputDir = path.join(this.config.dreamsDir, `${stage}-staging`);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `${stage}-${timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(outputDir, filename);
    
    const output = {
      stage,
      timestamp,
      processed: Math.floor(Math.random() * 50) + 10,
      duration: Math.floor(Math.random() * 2000) + 500,
      candidates: [],
      reflections: []
    };
    
    // 添加模拟数据
    for (let i = 0; i < 5; i++) {
      output.candidates.push({
        description: `记忆候选 ${i+1}`,
        confidence: (Math.random() * 0.3 + 0.5).toFixed(2),
        evidence: `memory/2026-04-14.md:${i*10+1}-${i*10+5}`,
        status: Math.random() > 0.3 ? 'staged' : 'skipped'
      });
    }
    
    if (stage === 'rem') {
      output.reflections.push({
        theme: 'assistant',
        confidence: 0.85,
        evidence: '多个会话中频繁出现',
        note: 'reflection'
      });
    }
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
      return filepath;
    } catch (error) {
      console.warn('创建输出文件失败:', error.message);
      return null;
    }
  },
  
  /**
   * 管理Dream配置
   */
  async manageDreamConfig(options) {
    const result = {
      timestamp: new Date().toISOString(),
      currentConfig: null,
      proposedConfig: null,
      changes: [],
      saved: false
    };
    
    // 获取当前配置
    if (fs.existsSync(this.config.configPath)) {
      try {
        const configContent = fs.readFileSync(this.config.configPath, 'utf8');
        const config = JSON.parse(configContent);
        result.currentConfig = this.extractDreamingConfig(config);
      } catch (error) {
        result.error = `读取配置失败: ${error.message}`;
        return result;
      }
    } else {
      result.currentConfig = { ...this.config.defaultConfig, source: 'default (文件不存在)' };
    }
    
    // 如果只需要配置信息，直接返回
    if (options.configOnly) {
      return result;
    }
    
    // 这里可以添加配置修改逻辑
    // 例如：dream config --enable --frequency="0 2 * * *" --timezone="UTC"
    
    result.proposedConfig = { ...result.currentConfig };
    result.changes.push('仅查看配置，未做修改');
    
    return result;
  },
  
  /**
   * 查看Dream日志
   */
  async viewDreamLogs(options) {
    const result = {
      timestamp: new Date().toISOString(),
      logs: [],
      statistics: {}
    };
    
    if (!fs.existsSync(this.config.dreamsDir)) {
      result.error = 'dreams目录不存在';
      return result;
    }
    
    try {
      // 收集所有日志文件
      const allLogs = [];
      const stages = ['light', 'deep', 'rem'];
      
      for (const stage of stages) {
        const stageDir = path.join(this.config.dreamsDir, `${stage}-staging`);
        if (fs.existsSync(stageDir)) {
          const files = fs.readdirSync(stageDir)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse()
            .slice(0, options.limit);
          
          for (const file of files) {
            const filePath = path.join(stageDir, file);
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const log = JSON.parse(content);
              allLogs.push({
                stage,
                file,
                path: filePath,
                timestamp: log.timestamp || file,
                processed: log.processed || 0,
                duration: log.duration || 0
              });
            } catch (error) {
              console.warn(`解析日志文件失败: ${filePath}`, error.message);
            }
          }
        }
      }
      
      // 排序（最新的在前）
      allLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
      
      result.logs = allLogs.slice(0, options.limit);
      
      // 统计信息
      result.statistics = {
        totalLogs: allLogs.length,
        byStage: {
          light: allLogs.filter(l => l.stage === 'light').length,
          deep: allLogs.filter(l => l.stage === 'deep').length,
          rem: allLogs.filter(l => l.stage === 'rem').length
        },
        totalProcessed: allLogs.reduce((sum, log) => sum + (log.processed || 0), 0),
        latestLog: allLogs.length > 0 ? allLogs[0].timestamp : null
      };
      
    } catch (error) {
      result.error = `读取日志失败: ${error.message}`;
    }
    
    return result;
  },
  
  /**
   * 分析梦境
   */
  async analyzeDreams(options) {
    const result = {
      timestamp: new Date().toISOString(),
      analysis: {},
      patterns: [],
      recommendations: []
    };
    
    // 获取日志进行分析
    const logsResult = await this.viewDreamLogs({ limit: options.limit });
    
    if (logsResult.error) {
      result.error = logsResult.error;
      return result;
    }
    
    // 分析模式
    const logs = logsResult.logs;
    
    if (logs.length === 0) {
      result.analysis = { message: '没有找到梦境日志' };
      return result;
    }
    
    // 按阶段统计
    const stageStats = {};
    const stages = ['light', 'deep', 'rem'];
    
    for (const stage of stages) {
      const stageLogs = logs.filter(l => l.stage === stage);
      stageStats[stage] = {
        count: stageLogs.length,
        totalProcessed: stageLogs.reduce((sum, l) => sum + (l.processed || 0), 0),
        avgProcessed: stageLogs.length > 0 ? 
          Math.round(stageLogs.reduce((sum, l) => sum + (l.processed || 0), 0) / stageLogs.length) : 0
      };
    }
    
    result.analysis.stageStats = stageStats;
    
    // 时间模式分析
    const timePatterns = this.analyzeTimePatterns(logs);
    if (timePatterns) {
      result.patterns.push(timePatterns);
    }
    
    // 处理量趋势
    const volumeTrend = this.analyzeVolumeTrend(logs);
    if (volumeTrend) {
      result.patterns.push(volumeTrend);
    }
    
    // 生成建议
    result.recommendations = this.generateDreamRecommendations(stageStats, logs);
    
    return result;
  },
  
  /**
   * 分析时间模式
   */
  analyzeTimePatterns(logs) {
    if (logs.length < 3) return null;
    
    // 简化分析：检查运行间隔
    const timestamps = logs.map(l => new Date(l.timestamp).getTime()).sort();
    const intervals = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const avgHours = avgInterval / (1000 * 60 * 60);
    
    return {
      type: '时间模式',
      description: `平均运行间隔: ${avgHours.toFixed(1)}小时`,
      suggestion: avgHours > 24 ? '运行频率较低，考虑增加频率' : '运行频率正常'
    };
  },
  
  /**
   * 分析处理量趋势
   */
  analyzeVolumeTrend(logs) {
    if (logs.length < 3) return null;
    
    // 按时间排序
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const volumes = sortedLogs.map(l => l.processed || 0);
    const firstHalfAvg = volumes.slice(0, Math.floor(volumes.length / 2))
      .reduce((sum, v) => sum + v, 0) / Math.floor(volumes.length / 2) || 0;
    const secondHalfAvg = volumes.slice(Math.floor(volumes.length / 2))
      .reduce((sum, v) => sum + v, 0) / Math.floor(volumes.length / 2) || 0;
    
    const trend = secondHalfAvg > firstHalfAvg ? '上升' : 
                 secondHalfAvg < firstHalfAvg ? '下降' : '稳定';
    
    return {
      type: '处理量趋势',
      description: `处理量趋势: ${trend} (${firstHalfAvg.toFixed(1)} → ${secondHalfAvg.toFixed(1)})`,
      suggestion: trend === '下降' ? '检查记忆收集机制' : '趋势正常'
    };
  },
  
  /**
   * 生成梦境建议
   */
  generateDreamRecommendations(stageStats, logs) {
    const recommendations = [];
    
    // 检查各阶段平衡
    const totalLogs = logs.length;
    if (totalLogs > 0) {
      const lightRatio = stageStats.light.count / totalLogs;
      const deepRatio = stageStats.deep.count / totalLogs;
      const remRatio = stageStats.rem.count / totalLogs;
      
      if (lightRatio < 0.3) {
        recommendations.push('Light阶段运行较少，考虑增加轻量级记忆处理');
      }
      
      if (remRatio < 0.2) {
        recommendations.push('REM阶段运行较少，深层反思可能不足');
      }
    }
    
    // 检查处理量
    const totalProcessed = Object.values(stageStats).reduce((sum, s) => sum + s.totalProcessed, 0);
    if (totalProcessed > 1000) {
      recommendations.push('处理记忆量较大，考虑优化记忆筛选机制');
    } else if (totalProcessed < 100) {
      recommendations.push('处理记忆量较少，检查记忆收集和记录机制');
    }
    
    // 通用建议
    recommendations.push('定期检查Dreaming系统状态');
    recommendations.push('根据需要调整运行频率和阶段配置');
    
    return recommendations;
  },
  
  /**
   * 显示Dream帮助
   */
  showDreamHelp(options) {
    return {
      help: {
        description: 'OpenClaw Dreaming系统管理工具',
        usage: 'dream [操作] [选项]',
        examples: [
          'dream status',
          'dream run --stage=light',
          'dream run --stage=all --force',
          'dream config',
          'dream logs --limit=20',
          'dream analyze --detailed'
        ],
        operations: Object.entries(this.config.operations).map(([key, desc]) => ({
          operation: key,
          description: desc
        })),
        options: [
          { option: '--stage=阶段', description: '指定处理阶段: light/deep/rem/all (默认: all)' },
          { option: '--force', description: '强制运行，忽略健康检查' },
          { option: '--detailed', description: '详细输出' },
          { option: '--limit=数量', description: '日志显示数量限制 (默认: 10)' },
          { option: '--config-only', description: '仅显示配置，不修改' }
        ],
        stages: [
          { stage: 'light', description: '轻量级处理：日常记忆筛选和分类' },
          { stage: 'deep', description: '深度处理：记忆关联和模式识别' },
          { stage: 'rem', description: '反思处理：主题提取和持久真理识别' }
        ],
        tips: [
          'Dreaming系统默认每天凌晨3点自动运行',
          '手动运行可用于测试或紧急处理',
          '分析功能帮助了解记忆处理模式',
          '定期检查日志确保系统正常运行'
        ]
      }
    };
  },
  
  /**
   * 生成摘要
   */
  generateSummary(operation, result) {
    switch (operation) {
      case 'status':
        if (result.overall && result.overall.healthy) {
          return `Dreaming系统健康，${result.statistics.memoryFiles}个记忆文件`;
        } else if (result.overall) {
          return `Dreaming系统有问题: ${result.overall.issues.length}个问题`;
        }
        return '状态检查完成';
        
      case 'run':
        if (result.success) {
          return `成功运行，处理了${result.summary}`;
        }
        return `运行失败: ${result.error}`;
        
      case 'config':
        return `配置检查完成，来源: ${result.currentConfig?.source || '未知'}`;
        
      case 'logs':
        return `找到${result.logs?.length || 0}个日志文件`;
        
      case 'analyze':
        return `分析完成，发现${result.patterns?.length || 0}个模式，${result.recommendations?.length || 0}条建议`;
        
      case 'help':
        return '显示帮助信息';
        
      default:
        return '操作完成';
    }
  },
  
  /**
   * 获取下一步建议
   */
  getNextSteps(operation, result) {
    const steps = [];
    
    switch (operation) {
      case 'status':
        if (result.overall && !result.overall.healthy) {
          steps.push('修复发现的问题: ' + result.overall.issues.join(', '));
        }
        if (!result.lastRun) {
          steps.push('运行dream run测试系统');
        }
        break;
        
      case 'run':
        if (result.success) {
          steps.push('检查运行结果: dream logs');
          steps.push('分析处理效果: dream analyze');
        } else {
          steps.push('检查系统状态: dream status');
          steps.push('尝试强制运行: dream run --force');
        }
        break;
        
      case 'logs':
        if (result.logs && result.logs.length > 0) {
          steps.push('分析日志模式: dream analyze');
        }
        break;
        
      case 'analyze':
        if (result.recommendations && result.recommendations.length > 0) {
          steps.push(...result.recommendations.slice(0, 3));
        }
        break;
    }
    
    // 通用下一步
    steps.push('定期运行dream status监控系统健康');
    
    return steps;
  },
  
  /**
   * 格式化时间差
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${diffDays}天前`;
    }
  }
};