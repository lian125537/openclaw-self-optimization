/**
 * OpenClaw Skills系统 - 主入口
 * 
 * Claude Code Skills适配层
 * 提供标准化工作流和Skill执行
 */

const fs = require('fs');
const path = require('path');

class OpenClawSkillsSystem {
  constructor(config = {}) {
    this.config = {
      skillsDir: config.skillsDir || path.join(__dirname, '..', 'skills'),
      debug: config.debug || false,
      enableClaudeCompatibility: true,
      ...config
    };
    
    this.skills = new Map();
    this.adapters = new Map();
    this.stats = {
      loadedSkills: 0,
      executedSkills: 0,
      errors: 0,
      startedAt: new Date().toISOString()
    };
    
    console.log(`🚀 OpenClaw Skills系统初始化`);
    console.log(`   技能目录: ${this.config.skillsDir}`);
    console.log(`   Claude兼容: ${this.config.enableClaudeCompatibility ? '启用' : '禁用'}`);
  }
  
  /**
   * 初始化系统
   */
  async initialize() {
    try {
      console.log('🔧 初始化Skills系统...');
      
      // 1. 确保目录存在
      this.ensureDirectories();
      
      // 2. 注册核心适配器
      this.registerCoreAdapters();
      
      // 3. 加载Skills
      await this.loadSkills();
      
      // 4. 验证系统状态
      await this.validateSystem();
      
      console.log(`✅ Skills系统初始化完成`);
      console.log(`   加载Skills: ${this.stats.loadedSkills}个`);
      console.log(`   可用适配器: ${this.adapters.size}个`);
      
      return {
        success: true,
        stats: this.stats,
        skills: Array.from(this.skills.keys())
      };
      
    } catch (error) {
      console.error('❌ Skills系统初始化失败:', error.message);
      console.error(error.stack);
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }
  
  /**
   * 确保目录存在
   */
  ensureDirectories() {
    const directories = [
      this.config.skillsDir,
      path.join(this.config.skillsDir, 'claude'),
      path.join(this.config.skillsDir, 'openclaw'),
      path.join(this.config.skillsDir, 'examples'),
      path.join(__dirname, '..', 'logs'),
      path.join(__dirname, '..', 'tests')
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
      }
    }
  }
  
  /**
   * 注册核心适配器
   */
  registerCoreAdapters() {
    // Claude Code适配器
    this.adapters.set('claude', {
      name: 'Claude Code适配器',
      version: '1.0.0',
      canConvert: (skill) => skill.type === 'prompt' || skill.type === 'shell',
      convert: this.convertClaudeSkill.bind(this)
    });
    
    // OpenClaw原生适配器
    this.adapters.set('openclaw', {
      name: 'OpenClaw原生适配器',
      version: '1.0.0',
      canConvert: (skill) => skill.format === 'openclaw',
      convert: this.convertOpenClawSkill.bind(this)
    });
    
    console.log(`📦 注册了${this.adapters.size}个适配器`);
  }
  
  /**
   * 加载Skills
   */
  async loadSkills() {
    console.log('📂 加载Skills...');
    
    // 1. 加载Claude格式Skills
    await this.loadClaudeSkills();
    
    // 2. 加载OpenClaw原生Skills
    await this.loadOpenClawSkills();
    
    // 3. 加载示例Skills
    await this.loadExampleSkills();
  }
  
  /**
   * 加载Claude格式Skills
   */
  async loadClaudeSkills() {
    const claudeDir = path.join(this.config.skillsDir, 'claude');
    
    if (!fs.existsSync(claudeDir)) {
      console.log(`⚠️  Claude Skills目录不存在: ${claudeDir}`);
      return;
    }
    
    try {
      const files = fs.readdirSync(claudeDir).filter(file => 
        file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json')
      );
      
      console.log(`  发现${files.length}个Claude格式文件`);
      
      for (const file of files) {
        try {
          const skill = await this.loadSkillFile(path.join(claudeDir, file));
          if (skill) {
            this.registerSkill(skill);
          }
        } catch (error) {
          console.error(`  加载Skill失败 ${file}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error(`加载Claude Skills失败:`, error.message);
    }
  }
  
  /**
   * 加载OpenClaw原生Skills
   */
  async loadOpenClawSkills() {
    const openclawDir = path.join(this.config.skillsDir, 'openclaw');
    
    if (!fs.existsSync(openclawDir)) {
      console.log(`⚠️  OpenClaw Skills目录不存在: ${openclawDir}`);
      return;
    }
    
    // 实现类似逻辑
  }
  
  /**
   * 加载示例Skills
   */
  async loadExampleSkills() {
    const examplesDir = path.join(this.config.skillsDir, 'examples');
    
    if (!fs.existsSync(examplesDir)) {
      console.log(`⚠️  示例Skills目录不存在: ${examplesDir}`);
      return;
    }
    
    // 实现类似逻辑
  }
  
  /**
   * 加载单个Skill文件
   */
  async loadSkillFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.js':
        return this.loadJavaScriptSkill(filePath);
      case '.ts':
        return this.loadTypeScriptSkill(filePath);
      case '.json':
        return this.loadJsonSkill(filePath);
      default:
        console.log(`⚠️  不支持的文件格式: ${ext} (${filePath})`);
        return null;
    }
  }
  
  /**
   * 加载JavaScript Skill
   */
  async loadJavaScriptSkill(filePath) {
    try {
      console.log(`  加载JS文件: ${path.basename(filePath)}`);
      console.log(`  完整路径: ${filePath}`);
      
      // 规范化路径
      const normalizedPath = path.resolve(filePath);
      console.log(`  规范化路径: ${normalizedPath}`);
      
      // 检查文件是否存在
      if (!fs.existsSync(normalizedPath)) {
        console.error(`  文件不存在: ${normalizedPath}`);
        return null;
      }
      
      // 清除缓存以确保重新加载
      delete require.cache[normalizedPath];
      
      const skillModule = require(normalizedPath);
      console.log(`  require成功`);
      
      // 检查是否为有效Skill
      let skill = null;
      
      if (skillModule && skillModule.skill) {
        // 格式1: module.exports = { skill: {...} }
        skill = skillModule.skill;
        console.log(`  使用格式1: module.exports.skill`);
      } else if (skillModule && skillModule.default) {
        // 格式2: module.exports = { default: {...} }
        skill = skillModule.default;
        console.log(`  使用格式2: module.exports.default`);
      } else if (skillModule && (skillModule.name || skillModule.execute)) {
        // 格式3: module.exports = skill对象本身
        skill = skillModule;
        console.log(`  使用格式3: module.exports本身`);
      }
      
      if (skill) {
        skill.source = 'javascript';
        skill.filePath = normalizedPath;
        console.log(`  找到Skill: ${skill.name || '未命名'}`);
        console.log(`  Skill类型: ${skill.type || '未指定'}`);
        return skill;
      }
      
      console.log(`  无效的Skill格式`);
      console.log(`  模块键: ${Object.keys(skillModule).join(', ')}`);
      return null;
    } catch (error) {
      console.error(`  加载JavaScript Skill失败:`, error.message);
      console.error(`  错误堆栈:`, error.stack);
      return null;
    }
  }
  
  /**
   * 加载TypeScript Skill (简化版)
   */
  async loadTypeScriptSkill(filePath) {
    console.log(`⚠️  TypeScript支持需要编译: ${filePath}`);
    // 在实际实现中，这里需要编译TypeScript
    return null;
  }
  
  /**
   * 加载JSON Skill
   */
  async loadJsonSkill(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const skill = JSON.parse(content);
      skill.source = 'json';
      skill.filePath = filePath;
      return skill;
    } catch (error) {
      console.error(`加载JSON Skill失败 ${filePath}:`, error.message);
      return null;
    }
  }
  
  /**
   * 注册Skill
   */
  registerSkill(skill) {
    if (!skill || !skill.name) {
      console.log(`⚠️  无效的Skill，跳过注册`);
      return false;
    }
    
    // 查找合适的适配器
    const adapter = this.findAdapter(skill);
    if (!adapter) {
      console.log(`⚠️  找不到适配器: ${skill.name}`);
      return false;
    }
    
    // 转换Skill
    const convertedSkill = adapter.convert(skill);
    if (!convertedSkill) {
      console.log(`⚠️  Skill转换失败: ${skill.name}`);
      return false;
    }
    
    // 注册到系统
    this.skills.set(convertedSkill.name, convertedSkill);
    this.stats.loadedSkills++;
    
    console.log(`✅ 注册Skill: ${convertedSkill.name} (${convertedSkill.type})`);
    
    if (skill.aliases && Array.isArray(skill.aliases)) {
      for (const alias of skill.aliases) {
        this.skills.set(alias, convertedSkill);
        console.log(`  别名: ${alias}`);
      }
    }
    
    return true;
  }
  
  /**
   * 查找适配器
   */
  findAdapter(skill) {
    for (const [name, adapter] of this.adapters) {
      if (adapter.canConvert(skill)) {
        return adapter;
      }
    }
    return null;
  }
  
  /**
   * 转换Claude Skill
   */
  convertClaudeSkill(claudeSkill) {
    console.log(`🔧 转换Claude Skill: ${claudeSkill.name}`);
    
    // 基础转换
    const openclawSkill = {
      name: claudeSkill.name,
      description: claudeSkill.description || '无描述',
      type: claudeSkill.type === 'shell' ? 'command' : 'prompt',
      source: 'claude',
      original: claudeSkill,
      
      // 元数据
      metadata: {
        aliases: claudeSkill.aliases || [],
        whenToUse: claudeSkill.whenToUse,
        argumentHint: claudeSkill.argumentHint,
        allowedTools: claudeSkill.allowedTools || [],
        model: claudeSkill.model,
        context: claudeSkill.context || 'inline'
      },
      
      // 执行函数
      execute: async (args, context) => {
        try {
          this.stats.executedSkills++;
          console.log(`🎯 执行Skill: ${claudeSkill.name}, 参数: ${args}`);
          
          // 调用原始的getPromptForCommand
          if (claudeSkill.getPromptForCommand) {
            const prompts = await claudeSkill.getPromptForCommand(args, context);
            return { success: true, prompts, skill: claudeSkill.name };
          }
          
          // 简单的回退实现
          return {
            success: true,
            message: `执行Skill: ${claudeSkill.name}`,
            args,
            timestamp: new Date().toISOString()
          };
          
        } catch (error) {
          this.stats.errors++;
          console.error(`❌ Skill执行失败 ${claudeSkill.name}:`, error.message);
          return {
            success: false,
            error: error.message,
            skill: claudeSkill.name
          };
        }
      }
    };
    
    return openclawSkill;
  }
  
  /**
   * 转换OpenClaw Skill
   */
  convertOpenClawSkill(skill) {
    // 直接使用，无需转换
    return skill;
  }
  
  /**
   * 验证系统状态
   */
  async validateSystem() {
    console.log('🔍 验证系统状态...');
    
    const validationResults = {
      skillsLoaded: this.skills.size > 0,
      adaptersRegistered: this.adapters.size > 0,
      directoriesExist: true
    };
    
    // 检查关键目录
    const requiredDirs = [
      this.config.skillsDir,
      path.join(this.config.skillsDir, 'claude'),
      path.join(this.config.skillsDir, 'openclaw')
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        validationResults.directoriesExist = false;
        console.log(`❌ 目录不存在: ${dir}`);
      }
    }
    
    const allValid = Object.values(validationResults).every(v => v === true);
    
    if (allValid) {
      console.log('✅ 系统验证通过');
    } else {
      console.log('⚠️  系统验证发现问题:', validationResults);
    }
    
    return validationResults;
  }
  
  /**
   * 执行Skill
   */
  async executeSkill(skillName, args = '', context = {}) {
    const skill = this.skills.get(skillName);
    
    if (!skill) {
      console.error(`❌ 未找到Skill: ${skillName}`);
      return {
        success: false,
        error: `Skill未找到: ${skillName}`,
        availableSkills: Array.from(this.skills.keys())
      };
    }
    
    console.log(`🚀 执行Skill: ${skillName}`);
    console.log(`   参数: ${args}`);
    console.log(`   类型: ${skill.type}`);
    
    try {
      const result = await skill.execute(args, context);
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Skill执行异常 ${skillName}:`, error.message);
      return {
        success: false,
        error: error.message,
        skill: skillName,
        stack: error.stack
      };
    }
  }
  
  /**
   * 获取Skill列表
   */
  getSkillList() {
    const skills = [];
    
    for (const [name, skill] of this.skills) {
      skills.push({
        name,
        description: skill.description,
        type: skill.type,
        source: skill.source,
        aliases: skill.metadata?.aliases || []
      });
    }
    
    return skills;
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      stats: this.stats,
      skills: this.getSkillList(),
      adapters: Array.from(this.adapters.values()).map(a => a.name),
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出
module.exports = {
  OpenClawSkillsSystem,
  
  // 工具函数
  utils: {
    createSkill: (definition) => definition,
    validateSkill: (skill) => {
      const required = ['name', 'description', 'execute'];
      return required.every(prop => skill[prop] !== undefined);
    }
  }
};

// 如果直接运行
if (require.main === module) {
  console.log('🚀 启动OpenClaw Skills系统开发模式\n');
  
  const system = new OpenClawSkillsSystem({
    debug: true,
    skillsDir: path.join(__dirname, '..', 'skills')
  });
  
  system.initialize().then(result => {
    if (result.success) {
      console.log('\n🎉 Skills系统启动成功!');
      console.log('\n📋 可用命令:');
      console.log('  系统状态: system.getSystemStatus()');
      console.log('  Skill列表: system.getSkillList()');
      console.log('  执行Skill: system.executeSkill(name, args)');
      console.log('\n💡 开发提示:');
      console.log('  1. 在 skills/claude/ 目录添加Claude格式Skills');
      console.log('  2. 在 skills/openclaw/ 目录添加原生Skills');
      console.log('  3. 参考 skills/examples/ 示例文件');
    } else {
      console.error('\n❌ Skills系统启动失败:', result.error);
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n❌ 启动异常:', error);
    process.exit(1);
  });
}