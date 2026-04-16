/**
 * Skillify Skill - 技能创建工具
 * 
 * Claude Code skillify.ts的简化移植版本
 * 用于创建和生成OpenClaw技能模板
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  // Skill定义
  name: 'skillify',
  description: '技能创建和模板生成工具',
  type: 'prompt',
  aliases: ['createskill', 'makeskill', 'skillcreator', 'templategen'],
  whenToUse: '当你需要创建新的OpenClaw技能或生成技能模板时使用',
  argumentHint: '[技能名] [类型] - 类型: basic/debug/monitor/config/utility/custom',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 技能模板
  skillTemplates: {
    // 基础技能模板
    basic: {
      name: '{{skillName}}',
      description: '{{skillDescription}}',
      type: 'prompt',
      aliases: ['{{alias1}}', '{{alias2}}'],
      whenToUse: '当你需要{{useCase}}时使用',
      execute: `async function(args, context) {
  const timestamp = new Date().toISOString();
  
  console.log(\`🎯 [{{skillName}} Skill] 执行: \${args}\`);
  
  // 解析参数
  const params = this.parseArgs(args);
  
  // 执行逻辑
  const result = await this.performAction(params, context);
  
  return {
    success: true,
    skill: '{{skillName}}',
    operation: 'execute',
    result: result,
    summary: '{{skillName}}执行完成',
    timestamp: timestamp
  };
}`,
      helperMethods: `/**
 * 解析参数
 */
parseArgs(args) {
  return {
    raw: args,
    tokens: args.split(/\\s+/).filter(t => t.length > 0)
  };
}

/**
 * 执行操作
 */
async performAction(params, context) {
  // 实现具体的技能逻辑
  return {
    message: '{{skillName}}执行成功',
    params: params
  };
}`
    },
    
    // 调试技能模板
    debug: {
      name: '{{skillName}}',
      description: '系统调试和诊断工具',
      type: 'prompt',
      aliases: ['{{skillName}}Diag', 'check{{skillName}}', 'test{{skillName}}'],
      whenToUse: '当你需要调试{{skillTarget}}或诊断{{skillTarget}}问题时使用',
      execute: `async function(args, context) {
  const timestamp = new Date().toISOString();
  
  console.log(\`🔧 [{{skillName}} Debug Skill] 开始调试\`);
  
  // 收集系统信息
  const systemInfo = this.collectSystemInfo();
  
  // 执行诊断检查
  const checks = await this.runDiagnosticChecks();
  
  // 生成报告
  const report = this.generateReport(systemInfo, checks);
  
  console.log(\`  调试完成: \${checks.passed}/\${checks.total}检查通过\`);
  
  return {
    success: true,
    skill: '{{skillName}}',
    operation: 'debug',
    systemInfo: systemInfo,
    checks: checks,
    report: report,
    summary: \`\${checks.passed}/\${checks.total}检查通过\`,
    recommendations: checks.failed > 0 ? this.getRecommendations(checks) : [],
    timestamp: timestamp
  };
}`,
      helperMethods: `/**
 * 收集系统信息
 */
collectSystemInfo() {
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    memory: process.memoryUsage(),
    env: Object.keys(process.env).filter(k => k.includes('OPENCLAW') || k.includes('NODE'))
  };
}

/**
 * 执行诊断检查
 */
async runDiagnosticChecks() {
  const checks = [
    { name: '文件系统访问', test: () => fs.existsSync(process.cwd()), required: true },
    { name: '技能目录', test: () => fs.existsSync(path.join(process.cwd(), 'skills')), required: false },
    { name: '配置访问', test: () => {
      try {
        require('./config.json');
        return true;
      } catch {
        return false;
      }
    }, required: false }
  ];
  
  const results = [];
  for (const check of checks) {
    try {
      const passed = await check.test();
      results.push({ name: check.name, passed, required: check.required });
    } catch (error) {
      results.push({ name: check.name, passed: false, error: error.message, required: check.required });
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = results.filter(r => !r.passed && r.required).length;
  
  return { results, passed, total, failed };
}

/**
 * 生成报告
 */
generateReport(systemInfo, checks) {
  return \`系统调试报告
时间: \${systemInfo.timestamp}
平台: \${systemInfo.platform} (\${systemInfo.arch})
Node版本: \${systemInfo.nodeVersion}

检查结果: \${checks.passed}/\${checks.total}通过
\${checks.results.map(r => \`  \${r.passed ? '✅' : '❌'} \${r.name}\`).join('\\n')}

\${checks.failed > 0 ? \`\\n⚠️ 有\${checks.failed}个必需检查失败\` : ''}\`;
}

/**
 * 获取建议
 */
getRecommendations(checks) {
  const recommendations = [];
  
  checks.results.forEach(check => {
    if (!check.passed && check.required) {
      if (check.name === '文件系统访问') {
        recommendations.push('检查当前目录权限和路径');
      } else if (check.name === '配置访问') {
        recommendations.push('创建或修复配置文件');
      }
    }
  });
  
  return recommendations;
}`
    },
    
    // 监控技能模板
    monitor: {
      name: '{{skillName}}',
      description: '系统监控和状态检查工具',
      type: 'prompt',
      aliases: ['monitor{{skillName}}', 'watch{{skillName}}', 'status{{skillName}}'],
      whenToUse: '当你需要监控{{skillTarget}}状态或检查{{skillTarget}}健康度时使用',
      execute: `async function(args, context) {
  const timestamp = new Date().toISOString();
  
  console.log(\`📊 [{{skillName}} Monitor Skill] 开始监控\`);
  
  // 解析监控参数
  const monitorConfig = this.parseMonitorConfig(args);
  
  // 收集监控数据
  const metrics = await this.collectMetrics(monitorConfig);
  
  // 分析数据
  const analysis = this.analyzeMetrics(metrics);
  
  // 生成警报和建议
  const alerts = this.generateAlerts(analysis);
  
  console.log(\`  监控完成: \${metrics.length}个指标, \${alerts.length}个警报\`);
  
  return {
    success: true,
    skill: '{{skillName}}',
    operation: 'monitor',
    config: monitorConfig,
    metrics: metrics,
    analysis: analysis,
    alerts: alerts,
    summary: \`监控完成: \${metrics.length}指标, \${alerts.length}警报\`,
    status: alerts.length === 0 ? 'healthy' : 'warning',
    timestamp: timestamp
  };
}`,
      helperMethods: `/**
 * 解析监控配置
 */
parseMonitorConfig(args) {
  const params = args.split(/\\s+/);
  const interval = parseInt(params.find(p => p.includes('interval'))?.replace('interval', '') || '60');
  const checks = params.filter(p => p.startsWith('check:')).map(p => p.replace('check:', ''));
  
  return {
    interval: interval, // 秒
    checks: checks.length > 0 ? checks : ['cpu', 'memory', 'disk', 'network'],
    duration: 300, // 默认5分钟
    threshold: 0.8 // 阈值
  };
}

/**
 * 收集指标
 */
async collectMetrics(config) {
  const metrics = [];
  const startTime = Date.now();
  
  for (const check of config.checks) {
    try {
      let metric;
      switch (check) {
        case 'cpu':
          metric = await this.getCpuUsage();
          break;
        case 'memory':
          metric = await this.getMemoryUsage();
          break;
        case 'disk':
          metric = await this.getDiskUsage();
          break;
        case 'network':
          metric = await this.getNetworkStats();
          break;
        default:
          metric = { name: check, value: 0, unit: 'unknown', status: 'unknown' };
      }
      
      metrics.push({
        ...metric,
        timestamp: new Date().toISOString(),
        check: check
      });
    } catch (error) {
      metrics.push({
        name: check,
        value: null,
        unit: 'error',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return metrics;
}

/**
 * 获取CPU使用率
 */
async getCpuUsage() {
  const os = require('os');
  const cpus = os.cpus();
  const total = cpus.reduce((sum, cpu) => {
    const totalTime = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    return sum + totalTime;
  }, 0);
  
  const idle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
  const usage = ((total - idle) / total) * 100;
  
  return {
    name: 'cpu_usage',
    value: Math.round(usage * 100) / 100,
    unit: 'percent',
    status: usage > 80 ? 'warning' : 'healthy'
  };
}

/**
 * 获取内存使用率
 */
async getMemoryUsage() {
  const os = require('os');
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usage = (used / total) * 100;
  
  return {
    name: 'memory_usage',
    value: Math.round(usage * 100) / 100,
    unit: 'percent',
    details: {
      total: this.formatBytes(total),
      used: this.formatBytes(used),
      free: this.formatBytes(free)
    },
    status: usage > 85 ? 'warning' : 'healthy'
  };
}

/**
 * 格式化字节
 */
formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return \`\${value.toFixed(2)} \${units[unitIndex]}\`;
}

/**
 * 分析指标
 */
analyzeMetrics(metrics) {
  const healthy = metrics.filter(m => m.status === 'healthy').length;
  const warning = metrics.filter(m => m.status === 'warning').length;
  const error = metrics.filter(m => m.status === 'error').length;
  
  return {
    total: metrics.length,
    healthy,
    warning,
    error,
    healthPercentage: (healthy / metrics.length) * 100
  };
}

/**
 * 生成警报
 */
generateAlerts(analysis) {
  const alerts = [];
  
  if (analysis.healthPercentage < 90) {
    alerts.push({
      level: 'warning',
      message: \`系统健康度较低: \${analysis.healthPercentage.toFixed(1)}%\`,
      suggestion: '检查资源使用情况'
    });
  }
  
  if (analysis.error > 0) {
    alerts.push({
      level: 'error',
      message: \`发现\${analysis.error}个错误指标\`,
      suggestion: '检查监控配置和权限'
    });
  }
  
  return alerts;
}`
    },
    
    // 配置技能模板
    config: {
      name: '{{skillName}}',
      description: '配置管理工具',
      type: 'prompt',
      aliases: ['config{{skillName}}', 'setup{{skillName}}', 'settings{{skillName}}'],
      whenToUse: '当你需要管理{{skillTarget}}配置或设置{{skillTarget}}参数时使用',
      execute: `async function(args, context) {
  const timestamp = new Date().toISOString();
  
  console.log(\`⚙️ [{{skillName}} Config Skill] 配置操作\`);
  
  // 解析配置操作
  const { operation, key, value, options } = this.parseConfigArgs(args);
  
  // 执行配置操作
  const result = await this.performConfigOperation(operation, key, value, options, context);
  
  console.log(\`  配置操作完成: \${operation} \${key || ''}\`);
  
  return {
    success: true,
    skill: '{{skillName}}',
    operation: operation,
    key: key,
    value: value,
    result: result,
    summary: \`配置\${operation}操作完成\`,
    nextSteps: this.getNextSteps(operation, result),
    timestamp: timestamp
  };
}`,
      helperMethods: `/**
 * 解析配置参数
 */
parseConfigArgs(args) {
  const parts = args.split(/\\s+/);
  const operation = parts[0] || 'get';
  let key = null;
  let value = null;
  const options = {};
  
  if (parts.length > 1) {
    if (operation === 'set' && parts.length >= 3) {
      key = parts[1];
      value = parts.slice(2).join(' ');
    } else if (['get', 'delete', 'list'].includes(operation)) {
      key = parts[1] || null;
    }
  }
  
  // 解析选项
  parts.forEach(part => {
    if (part.startsWith('--')) {
      const option = part.replace('--', '');
      if (option.includes('=')) {
        const [optName, optValue] = option.split('=');
        options[optName] = optValue;
      } else {
        options[option] = true;
      }
    }
  });
  
  return { operation, key, value, options };
}

/**
 * 执行配置操作
 */
async performConfigOperation(operation, key, value, options, context) {
  const config = this.loadConfig();
  
  switch (operation) {
    case 'get':
      return key ? this.getConfigValue(config, key) : config;
    case 'set':
      return this.setConfigValue(config, key, value, options);
    case 'delete':
      return this.deleteConfigValue(config, key);
    case 'list':
      return this.listConfigKeys(config);
    case 'validate':
      return this.validateConfig(config);
    case 'backup':
      return this.backupConfig(config, options);
    default:
      return { error: \`未知操作: \${operation}\` };
  }
}

/**
 * 加载配置
 */
loadConfig() {
  const configPath = this.getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      return { error: \`配置解析失败: \${error.message}\` };
    }
  }
  return {};
}

/**
 * 获取配置路径
 */
getConfigPath() {
  return path.join(process.cwd(), 'config.json');
}

/**
 * 获取下一步建议
 */
getNextSteps(operation, result) {
  const steps = [];
  
  switch (operation) {
    case 'set':
      steps.push('重启相关服务使配置生效');
      steps.push('验证配置是否正确应用');
      break;
    case 'delete':
      steps.push('检查依赖此配置的功能');
      steps.push('考虑是否需要备份');
      break;
    case 'validate':
      if (result.issues && result.issues.length > 0) {
        steps.push('根据验证结果修复问题');
      }
      break;
  }
  
  return steps;
}`
    }
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { skillName, templateType, options } = this.parseSkillifyArgs(args);
    
    console.log(`🛠️ [Skillify Skill] 创建技能: ${skillName}, 模板: ${templateType}`);
    
    if (!skillName) {
      // 显示帮助
      return this.showSkillifyHelp();
    }
    
    // 生成技能
    const result = await this.generateSkill(skillName, templateType, options, context);
    
    console.log(`  技能生成完成: ${result.files.length}个文件`);
    
    return {
      success: true,
      skill: 'skillify',
      operation: 'create',
      skillName: skillName,
      templateType: templateType,
      result: result,
      summary: `技能"${skillName}"创建完成`,
      nextSteps: [
        `编辑 ${result.mainFile} 实现具体逻辑`,
        `测试技能: ${skillName} [参数]`,
        `根据需要添加别名和文档`
      ],
      timestamp: timestamp
    };
  },
  
  /**
   * 解析Skillify参数
   */
  parseSkillifyArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let skillName = '';
    let templateType = 'basic';
    let options = {
      outputDir: 'skills',
      overwrite: false,
      dryRun: false,
      includeExamples: true
    };
    
    // 提取技能名称和类型
    const parts = argsStr.split(/\s+/);
    if (parts.length > 0 && parts[0]) {
      skillName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (parts.length > 1) {
        // 第二个参数可能是类型
        const typeCandidate = parts[1].toLowerCase();
        if (['basic', 'debug', 'monitor', 'config', 'utility', 'custom'].includes(typeCandidate)) {
          templateType = typeCandidate;
        }
      }
    }
    
    // 解析选项
    if (argsStr.includes('--output=')) {
      const match = argsStr.match(/--output=(\S+)/);
      if (match) {
        options.outputDir = match[1];
      }
    }
    
    if (argsStr.includes('--overwrite')) {
      options.overwrite = true;
    }
    
    if (argsStr.includes('--dry-run')) {
      options.dryRun = true;
    }
    
    if (argsStr.includes('--no-examples')) {
      options.includeExamples = false;
    }
    
    // 验证技能名称
    if (skillName && !/^[a-z][a-z0-9]*$/.test(skillName)) {
      skillName = skillName.replace(/[^a-z0-9]/g, '');
      console.log(`  清理技能名称: ${skillName}`);
    }
    
    return { skillName, templateType, options };
  },
  
  /**
   * 显示Skillify帮助
   */
  showSkillifyHelp() {
    return {
      success: true,
      skill: 'skillify',
      operation: 'help',
      help: {
        description: 'OpenClaw技能创建和模板生成工具',
        usage: 'skillify [技能名] [类型] [选项]',
        examples: [
          'skillify mytool',
          'skillify monitor-system debug',
          'skillify config-manager config --output=my-skills',
          'skillify health-check monitor --dry-run'
        ],
        templates: [
          { type: 'basic', description: '基础技能模板 (默认)' },
          { type: 'debug', description: '调试和诊断技能' },
          { type: 'monitor', description: '监控和状态检查技能' },
          { type: 'config', description: '配置管理技能' },
          { type: 'utility', description: '实用工具技能' },
          { type: 'custom', description: '自定义技能模板' }
        ],
        options: [
          { option: '--output=目录', description: '输出目录 (默认: skills)' },
          { option: '--overwrite', description: '覆盖已存在的文件' },
          { option: '--dry-run', description: '模拟运行，不实际创建文件' },
          { option: '--no-examples', description: '不包含示例代码' }
        ],
        tips: [
          '技能名只能包含小写字母和数字',
          '模板类型决定生成的代码结构',
          '生成后需要手动实现具体逻辑',
          '测试技能前确保代码正确'
        ]
      },
      summary: '技能创建工具 - 快速生成OpenClaw技能模板',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 生成技能
   */
  async generateSkill(skillName, templateType, options, context) {
    const files = [];
    const template = this.skillTemplates[templateType] || this.skillTemplates.basic;
    
    // 准备替换变量
    const replacements = {
      skillName: skillName,
      skillDescription: `${skillName}技能`,
      alias1: `${skillName}1`,
      alias2: `${skillName}2`,
      useCase: `使用${skillName}`,
      skillTarget: skillName.replace(/-/g, ' ')
    };
    
    // 生成主技能文件
    const mainFile = this.generateMainFile(skillName, template, replacements, options);
    files.push(mainFile);
    
    // 生成package.json (如果不存在)
    const packageFile = this.generatePackageFile(skillName, options);
    if (packageFile) {
      files.push(packageFile);
    }
    
    // 生成README.md
    const readmeFile = this.generateReadmeFile(skillName, templateType, replacements, options);
    files.push(readmeFile);
    
    // 生成测试文件
    const testFile = this.generateTestFile(skillName, templateType, replacements, options);
    files.push(testFile);
    
    // 实际创建文件
    const createdFiles = [];
    if (!options.dryRun) {
      for (const file of files) {
        try {
          // 确保目录存在
          const dir = path.dirname(file.path);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // 检查文件是否已存在
          if (fs.existsSync(file.path) && !options.overwrite) {
            console.log(`  文件已存在: ${file.path} (跳过)`);
            continue;
          }
          
          // 写入文件
          fs.writeFileSync(file.path, file.content);
          createdFiles.push(file.path);
          console.log(`  创建文件: ${file.path}`);
        } catch (error) {
          console.error(`  创建文件失败: ${file.path}`, error.message);
        }
      }
    }
    
    return {
      skillName,
      templateType,
      files: files,
      createdFiles: createdFiles,
      mainFile: mainFile.path,
      dryRun: options.dryRun,
      replacements
    };
  },
  
  /**
   * 生成主技能文件
   */
  generateMainFile(skillName, template, replacements, options) {
    // 应用替换
    let content = JSON.stringify(template, null, 2);
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    // 解析回对象并生成代码
    const templateObj = JSON.parse(content);
    
    const code = `/**
 * ${templateObj.description}
 * 
 * 由Skillify工具生成
 */

module.exports = {
  // Skill定义
  name: '${templateObj.name}',
  description: '${templateObj.description}',
  type: '${templateObj.type}',
  aliases: ${JSON.stringify(templateObj.aliases, null, 2)},
  whenToUse: '${templateObj.whenToUse}',
  
  // 执行函数
  execute: ${templateObj.execute},
  
  ${templateObj.helperMethods}
};`;
    
    const filePath = path.join(options.outputDir, skillName, `${skillName}.js`);
    
    return {
      path: filePath,
      content: code,
      type: 'main'
    };
  },
  
  /**
   * 生成package.json文件
   */
  generatePackageFile(skillName, options) {
    const packagePath = path.join(options.outputDir, skillName, 'package.json');
    const mainPath = path.join(options.outputDir, skillName);
    
    // 检查是否已存在
    if (!options.dryRun && fs.existsSync(packagePath) && !options.overwrite) {
      return null;
    }
    
    const content = {
      name: `openclaw-skill-${skillName}`,
      version: '1.0.0',
      description: `OpenClaw skill: ${skillName}`,
      main: `${skillName}.js`,
      scripts: {
        test: `node test-${skillName}.js`,
        start: `node ${skillName}.js`
      },
      keywords: ['openclaw', 'skill', skillName],
      author: 'Skillify Generator',
      license: 'MIT',
      dependencies: {}
    };
    
    return {
      path: packagePath,
      content: JSON.stringify(content, null, 2),
      type: 'package'
    };
  },
  
  /**
   * 生成README.md文件
   */
  generateReadmeFile(skillName, templateType, replacements, options) {
    const filePath = path.join(options.outputDir, skillName, 'README.md');
    
    const content = `# ${skillName} Skill

由Skillify工具生成的OpenClaw技能。

## 描述

${replacements.skillDescription}

## 安装

1. 将本目录复制到OpenClaw的skills目录
2. 重启OpenClaw或重新加载技能

## 使用

\`\`\`bash
${skillName} [参数]
\`\`\`

## 别名

- ${replacements.alias1}
- ${replacements.alias2}

## 模板类型

${templateType}

## 开发

编辑 \`${skillName}.js\` 文件实现具体功能。

## 测试

运行测试脚本：

\`\`\`bash
node test-${skillName}.js
\`\`\`

## 由Skillify生成

- 生成时间: ${new Date().toISOString()}
- 模板: ${templateType}
- 版本: 1.0.0
`;

    return {
      path: filePath,
      content: content,
      type: 'readme'
    };
  },
  
  /**
   * 生成测试文件
   */
  generateTestFile(skillName, templateType, replacements, options) {
    const filePath = path.join(options.outputDir, skillName, `test-${skillName}.js`);
    
    const content = `/**
 * ${skillName} Skill测试脚本
 */

const path = require('path');

console.log('🧪 测试${skillName}技能...');

async function runTest() {
  try {
    // 导入技能
    const skill = require('./${skillName}.js');
    
    console.log('1. ✅ 导入技能成功');
    
    // 测试执行
    const testContext = {
      sessionId: 'test-session',
      workspace: 'test'
    };
    
    console.log('2. 🚀 执行技能测试');
    
    const result = await skill.execute('test', testContext);
    
    if (result.success) {
      console.log('3. ✅ 技能执行成功');
      console.log(\`   操作: \${result.operation}\`);
      console.log(\`   摘要: \${result.summary}\`);
      
      // 显示详细信息
      if (result.result) {
        console.log(\`   结果: \${JSON.stringify(result.result, null, 2)}\`);
      }
    } else {
      console.log('3. ❌ 技能执行失败');
      console.log(\`   错误: \${result.error}\`);
    }
    
    console.log('\\n🎯 测试完成');
    
  } catch (error) {
    console.error('❌ 测试异常:', error);
    console.error('堆栈:', error.stack);
  }
}

// 运行测试
runTest();`;

    return {
      path: filePath,
      content: content,
      type: 'test'
    };
  }
};