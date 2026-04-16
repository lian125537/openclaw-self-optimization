/**
 * VCP Coordinator - 主入口文件
 * 基于 VCP 设计哲学的 Coordinator 系统
 */

const VariableEngine = require('./core/VariableEngine');
const SemanticTagSystem = require('./core/SemanticTagSystem-simple');
const ContextManager = require('./utils/ContextManager');
const path = require('path');

// Hooks系统集成
let HooksManager;
try {
  const hooksModule = require('../../hooks-prototype/cjs-adapter.cjs');
  HooksManager = hooksModule.HooksManager;
  console.log('✅ Hooks系统已加载');
} catch (error) {
  console.warn('⚠️  Hooks系统加载失败:', error.message);
  HooksManager = null;
}

class VCPCoordinator {
  constructor(options = {}) {
    console.log('🚀 启动 VCP Coordinator...');
    console.log('📅', new Date().toLocaleString());
    
    // 配置
    this.config = {
      debug: options.debug || false,
      logLevel: options.logLevel || 'info',
      dataDir: options.dataDir || './data',
      contextMaxTokens: options.contextMaxTokens || 120000,
      ...options
    };
    
    // 核心组件
    this.variableEngine = new VariableEngine();
    this.semanticTags = new SemanticTagSystem();
    this.contextManager = new ContextManager({
      maxTokens: this.config.contextMaxTokens,
      archiveDir: path.join(this.config.dataDir, 'context_archive'),
      debug: this.config.debug
    });
    this.agents = new Map();
    this.plugins = new Map();
    this.memory = null; // 待实现
    
    // 事件系统
    this.listeners = new Map();
    
    // Hooks系统
    if (HooksManager) {
      this.hooksManager = new HooksManager({
        enableLogging: this.config.debug,
        autoLoadConfig: false
      });
      
      // 自动集成Hooks
      HooksManager.integrateWithCoordinator(this, this.hooksManager);
      console.log('✅ Hooks系统已集成');
    } else {
      this.hooksManager = null;
      console.log('⚠️  Hooks系统未启用');
    }
    
    // 状态
    this.state = {
      startedAt: new Date(),
      isRunning: false,
      stats: {
        tasksProcessed: 0,
        agentsCreated: 0,
        errors: 0
      }
    };
    
    // 初始化
    this.initialize();
  }
  
  /**
   * 事件系统方法
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }
  
  emit(event, ...args) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(...args));
    return this;
  }
  
  /**
   * 触发Hook事件（如果Hooks系统启用）
   */
  triggerHook(event, toolName = '', toolInput = {}, extraContext = {}) {
    if (this.hooksManager) {
      return this.hooksManager.trigger(event, toolName, toolInput, extraContext);
    }
    return Promise.resolve({ triggered: false, event });
  }

  /**
   * 初始化系统
   */
  initialize() {
    console.log('🔧 初始化 VCP Coordinator...');
    
    // 1. 初始化变量引擎
    this.initializeVariableEngine();
    
    // 2. 初始化语义标签系统
    this.initializeSemanticTagSystem();
    
    // 3. 初始化上下文管理器
    this.initializeContextManager();
    
    // 4. 注册标准变量
    this.registerStandardVariables();
    
    // 5. 注册标准组
    this.registerStandardGroups();
    
    // 6. 加载配置
    this.loadConfiguration();
    
    console.log('✅ VCP Coordinator 初始化完成');
    this.logStats();
  }
  
  /**
   * 初始化变量引擎
   */
  initializeVariableEngine() {
    // 监听变量引擎事件
    this.variableEngine.on('variableRegistered', (variable) => {
      if (this.config.debug) {
        console.log(`📝 变量注册: ${variable.name}`);
      }
    });
    
    this.variableEngine.on('groupRegistered', (group) => {
      if (this.config.debug) {
        console.log(`📁 组注册: ${group.name}::${group.type}`);
      }
    });
    
    this.variableEngine.on('templateParsed', (data) => {
      if (this.config.debug) {
        console.log(`🔍 模板解析: ${data.duration}ms`);
      }
    });
    
    console.log('✅ 变量引擎初始化完成');
  }
  
  /**
   * 初始化语义标签系统
   */
  initializeSemanticTagSystem() {
    console.log('🔖 初始化语义标签系统...');
    
    // 索引一些示例资源
    this.indexExampleResources();
    
    console.log('✅ 语义标签系统初始化完成');
  }
  
  /**
   * 索引示例资源
   */
  indexExampleResources() {
    const examples = [
      {
        id: 'example_vcp_intro',
        content: 'VCP (Variable & Command Protocol) 是一个先进的AI系统设计范式，强调语义整合和连续时间感知。',
        tags: ['vcp', 'ai', 'system', 'semantic'],
        metadata: { type: 'knowledge', source: 'vcp-docs' }
      },
      {
        id: 'example_java_fix',
        content: '修复Java空指针异常的步骤：1. 检查对象是否为null 2. 添加空值检查 3. 使用Optional类',
        tags: ['programming', 'java', 'bug', 'tutorial'],
        metadata: { type: 'tutorial', difficulty: 'beginner' }
      },
      {
        id: 'example_ai_research',
        content: 'AI研究的最新进展包括多模态模型、强化学习和神经符号AI。',
        tags: ['ai', 'research', 'machine-learning', 'advanced'],
        metadata: { type: 'research', field: 'ai' }
      },
      {
        id: 'example_system_design',
        content: '系统设计原则：高可用性、可扩展性、容错性和安全性。',
        tags: ['system', 'design', 'architecture', 'best-practices'],
        metadata: { type: 'guide', audience: 'engineers' }
      },
      {
        id: 'example_coordinator',
        content: 'Coordinator模式实现思考与执行的分离，提高AI助手的决策能力。',
        tags: ['coordinator', 'ai', 'architecture', 'vcp'],
        metadata: { type: 'design', project: 'vcp-coordinator' }
      }
    ];
    
    examples.forEach(example => {
      this.semanticTags.indexResource(
        example.id,
        example.content,
        example.tags,
        example.metadata
      );
    });
    
    console.log(`📚 索引了 ${examples.length} 个示例资源`);
  }
  
  /**
   * 初始化上下文管理器
   */
  initializeContextManager() {
    console.log('📚 初始化上下文管理器...');
    
    // 监听上下文管理器事件
    this.contextManager.on = (event, handler) => {
      // 简化的事件处理
      if (this.config.debug) {
        console.log(`📡 上下文事件: ${event}`);
      }
    };
    
    // 初始上下文状态
    this.updateContextUsage(0);
    
    console.log('✅ 上下文管理器初始化完成');
  }
  
  /**
   * 更新上下文使用情况
   */
  updateContextUsage(tokens) {
    const usageRatio = this.contextManager.updateTokenCount(tokens);
    
    // 检查是否需要自动管理
    if (usageRatio >= 0.7) {
      this.contextManager.applyAutoManagement();
    }
    
    return usageRatio;
  }
  
  /**
   * 获取上下文状态
   */
  getContextStatus() {
    return this.contextManager.getStatusReport();
  }
  
  /**
   * 重置上下文
   */
  resetContext(reason = 'manual') {
    return this.contextManager.resetContext(reason);
  }
  
  /**
   * 注册标准变量
   */
  registerStandardVariables() {
    console.log('📝 注册标准变量...');
    
    // 系统变量
    this.variableEngine.registerVariable('SystemName', 'VCP Coordinator');
    this.variableEngine.registerVariable('SystemVersion', '0.1.0');
    this.variableEngine.registerVariable('SystemAuthor', 'Steve Jobs 🍎');
    
    // 时间变量
    this.variableEngine.registerVariable('CurrentTime', () => new Date().toLocaleTimeString());
    this.variableEngine.registerVariable('CurrentDate', () => new Date().toLocaleDateString());
    this.variableEngine.registerVariable('CurrentDateTime', () => new Date().toISOString());
    this.variableEngine.registerVariable('Timestamp', () => Date.now());
    
    // 用户变量
    this.variableEngine.registerVariable('UserName', 'Bo');
    this.variableEngine.registerVariable('UserRole', '开发者');
    this.variableEngine.registerVariable('UserTimezone', 'Asia/Shanghai');
    
    // 环境变量
    this.variableEngine.registerVariable('NodeVersion', process.version);
    this.variableEngine.registerVariable('Platform', process.platform);
    this.variableEngine.registerVariable('Architecture', process.arch);
    
    console.log(`✅ 注册了 ${this.variableEngine.variables.size} 个标准变量`);
  }
  
  /**
   * 注册标准组
   */
  registerStandardGroups() {
    console.log('📁 注册标准组...');
    
    // 系统日记本
    this.variableEngine.registerGroup(
      '系统日记本',
      'Time::Group::TagMemo0.65',
      '系统运行日志和状态记录',
      ['system', 'log', 'status']
    );
    
    // 技术知识库
    this.variableEngine.registerGroup(
      '技术知识库',
      'Group::TagMemo0.5',
      '编程、AI、系统设计等技术知识',
      ['technical', 'knowledge', 'reference']
    );
    
    // 项目记录
    this.variableEngine.registerGroup(
      '项目记录',
      'Time::Group::Rerank::TagMemo0.55',
      '所有项目进展、问题和解决方案',
      ['projects', 'work', 'progress']
    );
    
    // 个人记忆
    this.variableEngine.registerGroup(
      'Steve的记忆',
      'Time::Group::TagMemo0.7',
      'Steve的个人记忆、思考和经验',
      ['personal', 'memory', 'steve']
    );
    
    // VCP 开发文档
    this.variableEngine.registerGroup(
      'VCP开发文档',
      'Group::TagMemo0.6',
      'VCP系统设计和实现文档',
      ['vcp', 'development', 'documentation']
    );
    
    console.log(`✅ 注册了 ${this.variableEngine.groups.size} 个标准组`);
  }
  
  /**
   * 加载配置
   */
  loadConfiguration() {
    // 这里可以加载外部配置文件
    // 暂时使用内置配置
    
    const config = {
      agents: {
        enabled: true,
        maxAgents: 10,
        defaultTemplate: 'standard'
      },
      memory: {
        enabled: true,
        persistence: true,
        maxEntries: 10000
      },
      plugins: {
        enabled: true,
        autoLoad: true,
        directory: './plugins'
      }
    };
    
    this.variableEngine.registerVariable('Config', config, { type: 'system' });
    
    if (this.config.debug) {
      console.log('⚙️  配置加载完成:', config);
    }
  }
  
  /**
   * 处理任务
   */
  async processTask(taskDescription, options = {}) {
    if (!this.state.isRunning) {
      throw new Error('Coordinator 未运行');
    }
    
    // 确保options有值
    options = options || {};
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`📋 处理任务 [${taskId}]: ${taskDescription.substring(0, 50)}...`);
    
    // 创建任务对象
    const task = { id: taskId, description: taskDescription, options, startTime };
    
    try {
      // 触发任务开始事件
      this.emit('taskStart', task);
      
      // 1. 记录任务
      this.state.stats.tasksProcessed++;
      
      // 2. 更新上下文使用（估算token数）
      const estimatedTokens = taskDescription.length * 1.3; // 简单估算
      this.updateContextUsage(estimatedTokens);
      
      // 3. 索引任务到语义系统
      this.indexTaskToSemanticSystem(taskId, taskDescription, options);
      
      // 4. 搜索相关资源
      const relatedResources = this.searchRelatedResources(taskDescription);
      
      // 5. 生成 VCP 模板
      const vcpTemplate = this.generateVPCTemplate(taskDescription, options, relatedResources);
      
      // 6. 解析模板
      const parsedTemplate = this.variableEngine.parseTemplate(vcpTemplate, {
        debug: this.config.debug
      });
      
      // 7. 分析任务
      const analysis = await this.analyzeTask(taskDescription, parsedTemplate, relatedResources);
      
      // 8. 生成响应
      const response = {
        taskId,
        original: taskDescription,
        vcpTemplate: parsedTemplate,
        analysis,
        relatedResources,
        contextStatus: this.getContextStatus(),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      if (this.config.debug) {
        console.log(`✅ 任务处理完成 [${taskId}]: ${response.duration}ms`);
        console.log(`   相关资源: ${relatedResources.length}个`);
        console.log(`   上下文使用: ${response.contextStatus.tokens.percentage}`);
      }
      
      // 触发任务完成事件
      this.emit('taskComplete', task, response);
      
      return response;
      
    } catch (error) {
      this.state.stats.errors++;
      console.error(`❌ 任务处理失败 [${taskId}]:`, error.message);
      
      // 触发任务失败事件
      this.emit('taskFailed', task, error);
      
      throw error;
    }
  }
  
  /**
   * 索引任务到语义系统
   */
  indexTaskToSemanticSystem(taskId, taskDescription, options) {
    const tags = this.extractTags(taskDescription);
    
    this.semanticTags.indexResource(
      taskId,
      taskDescription,
      tags,
      {
        type: 'task',
        priority: options.priority || 'normal',
        timestamp: new Date().toISOString()
      }
    );
    
    if (this.config.debug) {
      console.log(`🏷️  任务索引: ${tags.length}个标签`);
    }
  }
  
  /**
   * 搜索相关资源
   */
  searchRelatedResources(taskDescription, limit = 5) {
    const searchResults = this.semanticTags.search(taskDescription, {
      limit,
      minScore: 0.3
    });
    
    // 过滤掉任务本身
    return searchResults.filter(result => !result.id.startsWith('task_'));
  }
  
  /**
   * 生成 VCP 模板
   */
  generateVPCTemplate(taskDescription, options, relatedResources = []) {
    // 构建相关资源部分
    let relatedResourcesSection = '';
    if (relatedResources.length > 0) {
      relatedResourcesSection = '————相关资源（语义搜索）————\n';
      relatedResources.forEach((resource, index) => {
        relatedResourcesSection += `${index + 1}. [${resource.score.toFixed(2)}] ${resource.content}\n`;
        relatedResourcesSection += `   标签: ${resource.tags.join(', ')}\n\n`;
      });
    }
    
    return `
————任务分析————
任务ID: {{TaskId}}
任务描述: ${taskDescription}
优先级: ${options.priority || 'normal'}

————系统上下文————
系统: {{SystemName}} v{{SystemVersion}}
时间: {{CurrentDateTime}}
用户: {{UserName}} ({{UserRole}})

————语义上下文————
系统状态: [[系统日记本::Time::Group::TagMemo0.65::system]]
技术参考: [[技术知识库::Group::TagMemo0.5::technical]]
项目背景: 《《项目记录》》
个人记忆: 《《Steve的记忆》》

${relatedResourcesSection}
————处理指令————
请基于以上上下文分析并处理此任务。
考虑因素:
1. 任务复杂度和分解可能性
2. 所需技能和资源
3. 时间估计和优先级
4. 历史相似任务经验
5. 相关资源参考价值

生成详细的任务分析报告。
`;
  }
  
  /**
   * 分析任务
   */
  async analyzeTask(taskDescription, parsedTemplate, relatedResources = []) {
    // 这里可以集成 AI 分析
    // 暂时返回增强的分析
    
    const tags = this.extractTags(taskDescription);
    const complexity = this.estimateComplexity(taskDescription);
    
    // 基于相关资源计算资源相关性
    const resourceRelevance = this.calculateResourceRelevance(relatedResources);
    
    // 获取相关标签建议
    const relatedTags = this.getRelatedTags(tags);
    
    return {
      tags,
      complexity,
      estimatedDuration: complexity * 5, // 分钟
      needsDecomposition: complexity > 3,
      suggestedAgents: this.suggestAgents(tags),
      similarTasks: await this.findSimilarTasks(taskDescription),
      resourceRelevance,
      relatedTags,
      hasRelatedResources: relatedResources.length > 0,
      relatedResourcesCount: relatedResources.length,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 计算资源相关性
   */
  calculateResourceRelevance(relatedResources) {
    if (relatedResources.length === 0) {
      return {
        score: 0,
        level: 'none',
        description: '没有找到相关资源'
      };
    }
    
    // 计算平均分数
    const avgScore = relatedResources.reduce((sum, r) => sum + r.score, 0) / relatedResources.length;
    
    let level, description;
    if (avgScore >= 0.8) {
      level = 'high';
      description = '高度相关资源可用';
    } else if (avgScore >= 0.5) {
      level = 'medium';
      description = '中等相关资源可用';
    } else {
      level = 'low';
      description = '低相关资源可用';
    }
    
    return {
      score: avgScore,
      level,
      description,
      bestMatchScore: Math.max(...relatedResources.map(r => r.score))
    };
  }
  
  /**
   * 获取相关标签
   */
  getRelatedTags(tags) {
    const allRelated = new Set();
    
    tags.forEach(tag => {
      const related = this.semanticTags.getRelatedTags(tag, 3);
      related.forEach(r => allRelated.add(r.tag));
    });
    
    return Array.from(allRelated);
  }
  
  /**
   * 提取标签
   */
  extractTags(text) {
    const keywordMap = {
      programming: ['代码', '编程', 'bug', '错误', '修复', '开发', 'Java', 'Python', 'JavaScript'],
      ai: ['AI', '人工智能', '模型', '训练', '学习', '神经网络', 'LLM'],
      system: ['系统', '架构', '设计', '部署', '配置', '服务器', '数据库'],
      research: ['研究', '分析', '调查', '了解', '学习', '探索'],
      creative: ['创作', '写作', '设计', '艺术', '音乐', '创意'],
      urgent: ['紧急', '尽快', '马上', '立刻', '重要', '优先']
    };
    
    const tags = [];
    const textLower = text.toLowerCase();
    
    for (const [tag, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => textLower.includes(keyword.toLowerCase()))) {
        tags.push(tag);
      }
    }
    
    return tags;
  }
  
  /**
   * 估计复杂度
   */
  estimateComplexity(text) {
    const length = text.length;
    const wordCount = text.split(/\s+/).length;
    
    if (wordCount < 10) return 1; // 简单
    if (wordCount < 30) return 2; // 中等
    if (wordCount < 50) return 3; // 复杂
    if (wordCount < 100) return 4; // 很复杂
    return 5; // 非常复杂
  }
  
  /**
   * 建议 Agent
   */
  suggestAgents(tags) {
    const agentMapping = {
      programming: ['Nova', 'CodeMaster'],
      ai: ['Metis', 'AIExpert'],
      system: ['SysAdmin', 'Architect'],
      research: ['Researcher', 'Analyst'],
      creative: ['DreamNova', 'Creator'],
      urgent: ['QuickResponse', 'Emergency']
    };
    
    const agents = new Set();
    tags.forEach(tag => {
      if (agentMapping[tag]) {
        agentMapping[tag].forEach(agent => agents.add(agent));
      }
    });
    
    return Array.from(agents);
  }
  
  /**
   * 查找相似任务
   */
  async findSimilarTasks(taskDescription) {
    // 这里可以实现语义搜索
    // 暂时返回空数组
    return [];
  }
  
  /**
   * 启动 Coordinator
   */
  start() {
    if (this.state.isRunning) {
      console.warn('⚠️  Coordinator 已经在运行');
      return;
    }
    
    this.state.isRunning = true;
    this.state.startedAt = new Date();
    
    console.log('🚀 VCP Coordinator 已启动');
    console.log('⏰ 启动时间:', this.state.startedAt.toLocaleString());
    
    // 注册任务ID变量
    this.variableEngine.registerVariable('TaskId', () => 
      `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    
    return this;
  }
  
  /**
   * 停止 Coordinator
   */
  stop() {
    if (!this.state.isRunning) {
      console.warn('⚠️  Coordinator 未在运行');
      return;
    }
    
    this.state.isRunning = false;
    const uptime = Date.now() - this.state.startedAt;
    
    console.log('🛑 VCP Coordinator 已停止');
    console.log('⏱️  运行时间:', this.formatDuration(uptime));
    this.logStats();
    
    return this;
  }
  
  /**
   * 重启 Coordinator
   */
  restart() {
    console.log('🔄 重启 VCP Coordinator...');
    this.stop();
    this.start();
    return this;
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    const uptime = this.state.isRunning ? Date.now() - this.state.startedAt : 0;
    const engineStats = this.variableEngine.getStats();
    const semanticStats = this.semanticTags.getStats();
    const contextStatus = this.getContextStatus();
    
    return {
      isRunning: this.state.isRunning,
      startedAt: this.state.startedAt,
      uptime: this.formatDuration(uptime),
      stats: {
        ...this.state.stats,
        variables: engineStats.variablesCount,
        groups: engineStats.groupsCount,
        templatesParsed: engineStats.templatesParsed,
        semanticTags: semanticStats.tags,
        semanticResources: semanticStats.resources,
        semanticSearches: semanticStats.searches
      },
      context: contextStatus,
      config: this.config,
      memory: {
        enabled: this.memory !== null,
        size: this.memory ? this.memory.size : 0
      }
    };
  }
  
  /**
   * 日志统计
   */
  logStats() {
    const status = this.getStatus();
    const contextStatus = this.getContextStatus();
    
    console.log('\n📊 系统统计:');
    console.log('   运行状态:', status.isRunning ? '运行中' : '已停止');
    console.log('   运行时间:', status.uptime);
    console.log('   任务处理:', status.stats.tasksProcessed);
    console.log('   Agent数量:', status.stats.agentsCreated);
    console.log('   错误数量:', status.stats.errors);
    console.log('   变量数量:', status.stats.variables);
    console.log('   组数量:', status.stats.groups);
    console.log('   模板解析:', status.stats.templatesParsed);
    
    console.log('\n📚 上下文统计:');
    console.log('   Token使用:', contextStatus.tokens.percentage);
    console.log('   压缩次数:', contextStatus.operations.compressions);
    console.log('   快照数量:', contextStatus.operations.archives);
    
    if (contextStatus.warnings.length > 0) {
      console.log('\n⚠️  上下文警告:');
      contextStatus.warnings.forEach(warning => {
        console.log('   ', warning);
      });
    }
    
    if (contextStatus.recommendations.length > 0) {
      console.log('\n💡 上下文建议:');
      contextStatus.recommendations.forEach(rec => {
        console.log('   ', rec);
      });
    }
  }
  
  /**
   * 格式化持续时间
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }
  
  /**
   * 运行演示
   */
  async runDemo() {
    console.log('\n🎮 运行演示...');
    
    const demoTasks = [
      '修复Java程序中的空指针异常',
      '研究VCP系统的架构设计',
      '写一篇关于AI进化的文章',
      '配置OpenClaw Gateway服务',
      '分析项目失败的原因并提出解决方案'
    ];
    
    for (const task of demoTasks) {
      try {
        const result = await this.processTask(task, { priority: 'normal' });
        console.log(`\n✅ 演示任务完成: ${task.substring(0, 40)}...`);
        console.log(`   标签: ${result.analysis.tags.join(', ')}`);
        console.log(`   复杂度: ${result.analysis.complexity}/5`);
        console.log(`   建议Agent: ${result.analysis.suggestedAgents.join(', ')}`);
        console.log(`   耗时: ${result.duration}ms`);
      } catch (error) {
        console.error(`❌ 演示任务失败: ${error.message}`);
      }
      
      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 演示完成!');
    this.logStats();
  }
}

// 导出
module.exports = {
  VCPCoordinator,
  VariableEngine
};

// 如果直接运行
if (require.main === module) {
  console.log('🎯 VCP Coordinator - 独立运行模式');
  
  const coordinator = new VCPCoordinator({
    debug: true,
    logLevel: 'info'
  });
  
  coordinator.start();
  
  // 运行演示
  coordinator.runDemo().then(() => {
    coordinator.stop();
    process.exit(0);
  }).catch(error => {
    console.error('❌ 演示运行失败:', error);
    process.exit(1);
  });
}