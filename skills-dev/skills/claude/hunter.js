/**
 * Hunter Skill - 代码审查和安全检查工具
 * 
 * Claude Code hunter技能的自适应移植版本
 * 用于代码审查、安全检查和质量分析
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

module.exports = {
  // Skill定义
  name: 'hunter',
  description: '代码审查和安全检查工具',
  type: 'prompt',
  aliases: ['review', 'inspect', 'audit', 'security'],
  whenToUse: '当你需要审查代码质量、检查安全问题、或分析项目结构时使用',
  argumentHint: '[目标] [检查类型] - 类型: code/security/quality/dependencies/all',
  
  // 允许的工具
  allowedTools: [], // 此Skill使用child_process执行检查命令
  
  // 配置
  config: {
    // 检查类型
    checkTypes: {
      code: '代码质量检查',
      security: '安全检查',
      quality: '代码质量分析',
      dependencies: '依赖项检查',
      all: '完整审查'
    },
    
    // 安全检查规则
    securityRules: {
      hardcodedSecrets: true,
      sensitiveFiles: true,
      permissionIssues: true,
      dependencyVulnerabilities: true,
      insecurePatterns: true
    },
    
    // 代码质量规则
    qualityRules: {
      complexity: true,
      duplication: true,
      style: true,
      documentation: true,
      testCoverage: true
    },
    
    // 文件扩展名映射
    fileExtensions: {
      javascript: ['.js', '.jsx', '.ts', '.tsx'],
      python: ['.py'],
      html: ['.html', '.htm'],
      css: ['.css', '.scss', '.less'],
      json: ['.json'],
      yaml: ['.yaml', '.yml'],
      markdown: ['.md', '.markdown']
    },
    
    // 敏感文件模式
    sensitiveFiles: [
      '*.env*',
      '.env*',
      '*.pem',
      '*.key',
      '*.crt',
      '*.pfx',
      'config/*',
      'secrets/*',
      'credentials*'
    ],
    
    // 敏感字符串模式
    sensitivePatterns: [
      'password\\s*=\\s*["\']',
      'secret\\s*=\\s*["\']',
      'token\\s*=\\s*["\']',
      'key\\s*=\\s*["\']',
      'api[_-]?key\\s*=\\s*["\']',
      'aws[_-]?access[_-]?key',
      'aws[_-]?secret[_-]?key',
      'private[_-]?key',
      'begin[\\s\\S]*private[\\s\\S]*key[\\s\\S]*end'
    ]
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { target, checkType, options } = this.parseHunterArgs(args);
    
    console.log(`🔍 [Hunter Skill] 审查: 目标=${target || '当前目录'}, 类型=${checkType}`);
    
    // 确定审查目标
    const reviewTarget = this.determineReviewTarget(target, context);
    
    // 执行审查
    const reviewResults = await this.performReview(reviewTarget, checkType, options, context);
    
    // 生成报告
    const report = this.generateReviewReport(reviewResults, checkType, reviewTarget);
    
    // 提供修复建议
    const recommendations = this.generateRecommendations(reviewResults);
    
    console.log(`  审查完成: ${reviewResults.summary.issuesFound}个问题发现`);
    
    return {
      success: true,
      skill: 'hunter',
      operation: 'review',
      target: reviewTarget,
      checkType: checkType,
      results: reviewResults,
      report: report,
      recommendations: recommendations,
      summary: `发现${reviewResults.summary.issuesFound}个问题，${reviewResults.summary.filesScanned}个文件扫描`,
      severity: reviewResults.summary.critical > 0 ? 'critical' : 
                reviewResults.summary.high > 0 ? 'high' : 
                reviewResults.summary.medium > 0 ? 'medium' : 'low',
      timestamp: timestamp,
      nextSteps: this.getNextSteps(reviewResults, recommendations)
    };
  },
  
  /**
   * 解析Hunter参数
   */
  parseHunterArgs(args) {
    const argsStr = (args || '').trim();
    const parts = argsStr.split(/\s+/);
    
    // 默认值
    let target = null; // 审查目标（文件/目录）
    let checkType = 'all'; // 默认完整审查
    const options = {
      detailed: false,
      fix: false,
      recursive: true,
      excludePatterns: [],
      severity: 'medium' // 最低严重级别
    };
    
    if (parts.length > 0 && parts[0]) {
      // 第一个参数可能是目标或类型
      const first = parts[0].toLowerCase();
      
      if (Object.keys(this.config.checkTypes).includes(first)) {
        checkType = first;
      } else {
        // 可能是目标路径
        target = first;
        
        // 第二个参数可能是类型
        if (parts.length > 1) {
          const second = parts[1].toLowerCase();
          if (Object.keys(this.config.checkTypes).includes(second)) {
            checkType = second;
          }
        }
      }
    }
    
    // 解析选项
    if (argsStr.includes('--detailed')) {
      options.detailed = true;
    }
    
    if (argsStr.includes('--fix')) {
      options.fix = true;
    }
    
    if (argsStr.includes('--no-recursive')) {
      options.recursive = false;
    }
    
    if (argsStr.includes('--severity=')) {
      const match = argsStr.match(/--severity=(\w+)/);
      if (match) {
        options.severity = match[1];
      }
    }
    
    // 排除模式
    const excludeMatches = argsStr.match(/--exclude=(\S+)/g);
    if (excludeMatches) {
      options.excludePatterns = excludeMatches.map(m => m.replace('--exclude=', ''));
    }
    
    // 检查类型特定选项
    if (checkType === 'security') {
      options.detailed = true; // 安全检查总是详细
    }
    
    return { target, checkType, options };
  },
  
  /**
   * 确定审查目标
   */
  determineReviewTarget(target, context) {
    if (!target) {
      // 默认为当前工作目录
      return {
        type: 'directory',
        path: process.cwd(),
        name: path.basename(process.cwd()),
        exists: true
      };
    }
    
    // 解析目标路径
    const targetPath = path.isAbsolute(target) ? target : path.join(process.cwd(), target);
    
    if (!fs.existsSync(targetPath)) {
      return {
        type: 'not_found',
        path: targetPath,
        name: target,
        exists: false,
        error: '目标不存在'
      };
    }
    
    const stats = fs.statSync(targetPath);
    
    return {
      type: stats.isDirectory() ? 'directory' : 'file',
      path: targetPath,
      name: path.basename(targetPath),
      exists: true,
      size: stats.size,
      isDirectory: stats.isDirectory()
    };
  },
  
  /**
   * 执行审查
   */
  async performReview(target, checkType, options, context) {
    const results = {
      timestamp: new Date().toISOString(),
      target: target,
      checkType: checkType,
      options: options,
      checks: [],
      issues: [],
      summary: {
        filesScanned: 0,
        issuesFound: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
    
    // 验证目标
    if (!target.exists) {
      results.error = `目标不存在: ${target.path}`;
      return results;
    }
    
    // 根据检查类型执行检查
    switch (checkType) {
      case 'code':
        await this.performCodeReview(target, options, results);
        break;
      case 'security':
        await this.performSecurityReview(target, options, results);
        break;
      case 'quality':
        await this.performQualityReview(target, options, results);
        break;
      case 'dependencies':
        await this.performDependencyReview(target, options, results);
        break;
      case 'all':
      default:
        // 执行所有检查
        await this.performCodeReview(target, options, results);
        await this.performSecurityReview(target, options, results);
        await this.performQualityReview(target, options, results);
        await this.performDependencyReview(target, options, results);
        break;
    }
    
    // 更新统计信息
    this.updateSummaryStatistics(results);
    
    // 如果启用了修复模式，尝试自动修复
    if (options.fix && results.issues.length > 0) {
      const fixes = await this.attemptAutoFixes(results.issues, target);
      results.fixes = fixes;
    }
    
    return results;
  },
  
  /**
   * 执行代码审查
   */
  async performCodeReview(target, options, results) {
    const checkName = '代码审查';
    console.log(`  🧪 执行${checkName}...`);
    
    try {
      // 收集文件
      const files = this.collectFiles(target, {
        recursive: options.recursive,
        excludePatterns: options.excludePatterns,
        extensions: Object.values(this.config.fileExtensions).flat()
      });
      
      results.summary.filesScanned += files.length;
      
      // 检查常见代码问题
      const codeIssues = await this.checkCodeIssues(files, target);
      results.issues.push(...codeIssues);
      
      // 记录检查结果
      results.checks.push({
        name: checkName,
        status: 'completed',
        filesScanned: files.length,
        issuesFound: codeIssues.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      results.checks.push({
        name: checkName,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * 检查代码问题
   */
  async checkCodeIssues(files, target) {
    const issues = [];
    
    for (const file of files.slice(0, 50)) { // 限制文件数量
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        
        // 检查大文件
        if (content.length > 10000) {
          issues.push({
            file: file.relative,
            line: 1,
            column: 1,
            rule: 'file-too-large',
            message: '文件过大，可能难以维护',
            severity: 'medium',
            suggestion: '考虑拆分文件'
          });
        }
        
        // 检查行长度
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.length > 120) {
            issues.push({
              file: file.relative,
              line: index + 1,
              column: 121,
              rule: 'line-too-long',
              message: `行过长 (${line.length}字符)`,
              severity: 'low',
              suggestion: '考虑换行或重构'
            });
          }
        });
        
        // 检查TODO/FIXME注释
        const todoRegex = /(TODO|FIXME|XXX|HACK|BUG)/i;
        lines.forEach((line, index) => {
          if (todoRegex.test(line)) {
            issues.push({
              file: file.relative,
              line: index + 1,
              column: line.indexOf('TODO') > -1 ? line.indexOf('TODO') + 1 : 
                     line.indexOf('FIXME') > -1 ? line.indexOf('FIXME') + 1 : 1,
              rule: 'todo-comment',
              message: `发现${line.match(todoRegex)[0]}注释`,
              severity: 'low',
              suggestion: '处理或移除TODO/FIXME注释'
            });
          }
        });
        
        // 语言特定检查
        if (file.path.endsWith('.js') || file.path.endsWith('.ts')) {
          // JavaScript/TypeScript特定检查
          const jsIssues = this.checkJavaScriptIssues(content, file);
          issues.push(...jsIssues);
        } else if (file.path.endsWith('.py')) {
          // Python特定检查
          const pyIssues = this.checkPythonIssues(content, file);
          issues.push(...pyIssues);
        }
        
      } catch (error) {
        console.warn(`读取文件失败: ${file.path}`, error.message);
      }
    }
    
    return issues;
  },
  
  /**
   * 检查JavaScript问题
   */
  checkJavaScriptIssues(content, file) {
    const issues = [];
    
    // 检查console.log
    const consoleRegex = /console\.(log|warn|error|info|debug)\(/g;
    let match;
    while ((match = consoleRegex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      issues.push({
        file: file.relative,
        line,
        column,
        rule: 'console-statement',
        message: `发现${match[0]}语句`,
        severity: 'low',
        suggestion: '生产代码中移除或使用日志库'
      });
    }
    
    // 检查eval
    if (content.includes('eval(')) {
      issues.push({
        file: file.relative,
        line: 1,
        column: 1,
        rule: 'eval-usage',
        message: '发现eval使用',
        severity: 'high',
        suggestion: '避免使用eval，考虑安全替代方案'
      });
    }
    
    // 检查未处理的promise
    const promiseRegex = /\.then\([^)]*\)(?!\s*\.catch)/g;
    let promiseMatch;
    while ((promiseMatch = promiseRegex.exec(content)) !== null) {
      const lines = content.substring(0, promiseMatch.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      issues.push({
        file: file.relative,
        line,
        column,
        rule: 'unhandled-promise',
        message: 'Promise缺少.catch处理',
        severity: 'medium',
        suggestion: '添加错误处理.catch()'
      });
    }
    
    return issues;
  },
  
  /**
   * 检查Python问题
   */
  checkPythonIssues(content, file) {
    const issues = [];
    
    // 检查print语句
    const printRegex = /print\(/g;
    let match;
    while ((match = printRegex.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      issues.push({
        file: file.relative,
        line,
        column,
        rule: 'print-statement',
        message: '发现print语句',
        severity: 'low',
        suggestion: '生产代码中使用日志库'
      });
    }
    
    // 检查eval/exec
    if (content.includes('eval(') || content.includes('exec(')) {
      issues.push({
        file: file.relative,
        line: 1,
        column: 1,
        rule: 'eval-exec-usage',
        message: '发现eval/exec使用',
        severity: 'high',
        suggestion: '避免使用eval/exec'
      });
    }
    
    return issues;
  },
  
  /**
   * 执行安全检查
   */
  async performSecurityReview(target, options, results) {
    const checkName = '安全检查';
    console.log(`  🔒 执行${checkName}...`);
    
    try {
      // 收集所有文件（包括隐藏文件）
      const files = this.collectFiles(target, {
        recursive: options.recursive,
        excludePatterns: options.excludePatterns,
        allFiles: true // 包括所有文件
      });
      
      results.summary.filesScanned += files.length;
      
      // 检查安全问题
      const securityIssues = await this.checkSecurityIssues(files, target);
      results.issues.push(...securityIssues);
      
      // 记录检查结果
      results.checks.push({
        name: checkName,
        status: 'completed',
        filesScanned: files.length,
        issuesFound: securityIssues.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      results.checks.push({
        name: checkName,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * 检查安全问题
   */
  async checkSecurityIssues(files, target) {
    const issues = [];
    
    // 检查敏感文件
    for (const file of files) {
      // 检查文件名是否匹配敏感模式
      const filename = path.basename(file.path);
      const filepath = file.relative;
      
      // 检查.env文件
      if (filename.startsWith('.env') || filename.includes('secret') || filename.includes('password')) {
        issues.push({
          file: filepath,
          line: 1,
          column: 1,
          rule: 'sensitive-file',
          message: `敏感文件: ${filename}`,
          severity: 'high',
          suggestion: '确保敏感文件不被提交到版本控制，使用环境变量'
        });
      }
      
      // 检查密钥文件
      if (filename.endsWith('.pem') || filename.endsWith('.key') || filename.endsWith('.crt')) {
        issues.push({
          file: filepath,
          line: 1,
          column: 1,
          rule: 'key-file',
          message: `密钥文件: ${filename}`,
          severity: 'critical',
          suggestion: '密钥文件不应存储在代码仓库中'
        });
      }
    }
    
    // 检查文件内容中的敏感信息
    for (const file of files.slice(0, 30)) { // 限制文件数量
      if (!file.path.endsWith('.js') && !file.path.endsWith('.ts') && 
          !file.path.endsWith('.py') && !file.path.endsWith('.json') &&
          !file.path.endsWith('.yml') && !file.path.endsWith('.yaml')) {
        continue;
      }
      
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        
        // 检查硬编码的敏感信息
        for (const pattern of this.config.sensitivePatterns) {
          const regex = new RegExp(pattern, 'gi');
          let match;
          while ((match = regex.exec(content)) !== null) {
            const lines = content.substring(0, match.index).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            
            issues.push({
              file: file.relative,
              line,
              column,
              rule: 'hardcoded-secret',
              message: `可能发现硬编码的敏感信息: ${match[0].substring(0, 50)}`,
              severity: 'critical',
              suggestion: '使用环境变量或密钥管理系统'
            });
          }
        }
        
      } catch (error) {
        console.warn(`安全检查读取文件失败: ${file.path}`, error.message);
      }
    }
    
    // 检查目录权限（简化版本）
    if (target.type === 'directory') {
      try {
        // 检查是否有可执行权限的配置文件
        const configFiles = files.filter(f => 
          f.path.includes('config') && 
          !f.path.endsWith('.json') && 
          !f.path.endsWith('.yml') &&
          !f.path.endsWith('.yaml')
        );
        
        for (const file of configFiles.slice(0, 5)) {
          try {
            fs.accessSync(file.path, fs.constants.X_OK);
            issues.push({
              file: file.relative,
              line: 1,
              column: 1,
              rule: 'executable-config',
              message: '配置文件有执行权限',
              severity: 'medium',
              suggestion: '移除不必要的执行权限: chmod -x'
            });
          } catch (e) {
            // 没有执行权限，正常
          }
        }
      } catch (error) {
        console.warn('权限检查失败:', error.message);
      }
    }
    
    return issues;
  },
  
  /**
   * 执行质量审查
   */
  async performQualityReview(target, options, results) {
    const checkName = '质量审查';
    console.log(`  📊 执行${checkName}...`);
    
    try {
      // 收集代码文件
      const files = this.collectFiles(target, {
        recursive: options.recursive,
        excludePatterns: options.excludePatterns,
        extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs']
      });
      
      results.summary.filesScanned += files.length;
      
      // 检查质量指标
      const qualityIssues = await this.checkQualityIssues(files, target);
      results.issues.push(...qualityIssues);
      
      // 记录检查结果
      results.checks.push({
        name: checkName,
        status: 'completed',
        filesScanned: files.length,
        issuesFound: qualityIssues.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      results.checks.push({
        name: checkName,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * 检查质量问题
   */
  async checkQualityIssues(files, target) {
    const issues = [];
    
    // 简化版本：检查基本质量指标
    
    // 1. 检查是否有测试文件
    const testFiles = files.filter(f => 
      f.path.includes('test') || 
      f.path.includes('spec') || 
      f.path.endsWith('Test.js') || 
      f.path.endsWith('test.js') ||
      f.path.endsWith('_test.py')
    );
    
    if (testFiles.length === 0 && files.length > 5) {
      issues.push({
        file: target.name,
        line: 1,
        column: 1,
        rule: 'no-tests',
        message: '未发现测试文件',
        severity: 'medium',
        suggestion: '添加单元测试和集成测试'
      });
    }
    
    // 2. 检查README文档
    const hasReadme = files.some(f => 
      f.path.toLowerCase().endsWith('readme.md') || 
      f.path.toLowerCase().endsWith('readme')
    );
    
    if (!hasReadme) {
      issues.push({
        file: target.name,
        line: 1,
        column: 1,
        rule: 'no-readme',
        message: '缺少README文档',
        severity: 'medium',
        suggestion: '添加README.md文件描述项目'
      });
    }
    
    // 3. 检查大函数（简化）
    for (const file of files.slice(0, 10)) {
      if (file.path.endsWith('.js') || file.path.endsWith('.py')) {
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          const lines = content.split('\n');
          
          // 检查文件行数
          if (lines.length > 500) {
            issues.push({
              file: file.relative,
              line: 1,
              column: 1,
              rule: 'large-file',
              message: `文件过大 (${lines.length}行)`,
              severity: 'low',
              suggestion: '考虑拆分文件'
            });
          }
          
        } catch (error) {
          console.warn(`质量检查读取文件失败: ${file.path}`, error.message);
        }
      }
    }
    
    return issues;
  },
  
  /**
   * 执行依赖项审查
   */
  async performDependencyReview(target, options, results) {
    const checkName = '依赖项审查';
    console.log(`  📦 执行${checkName}...`);
    
    try {
      // 查找包管理文件
      const packageFiles = this.findPackageFiles(target);
      
      if (packageFiles.length === 0) {
        results.checks.push({
          name: checkName,
          status: 'skipped',
          message: '未找到包管理文件',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      results.summary.filesScanned += packageFiles.length;
      
      // 检查依赖项
      const dependencyIssues = await this.checkDependencyIssues(packageFiles, target);
      results.issues.push(...dependencyIssues);
      
      // 记录检查结果
      results.checks.push({
        name: checkName,
        status: 'completed',
        filesScanned: packageFiles.length,
        issuesFound: dependencyIssues.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      results.checks.push({
        name: checkName,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * 查找包管理文件
   */
  findPackageFiles(target) {
    const packageFiles = [];
    
    if (target.type === 'file') {
      // 单个文件目标
      const filename = path.basename(target.path).toLowerCase();
      if (filename === 'package.json' || filename === 'requirements.txt' || 
          filename === 'pyproject.toml' || filename === 'cargo.toml' ||
          filename === 'go.mod') {
        packageFiles.push({
          path: target.path,
          relative: target.name,
          type: this.getPackageFileType(filename)
        });
      }
    } else {
      // 目录目标
      const commonPackageFiles = [
        'package.json',
        'requirements.txt',
        'pyproject.toml',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'build.gradle',
        'build.gradle.kts'
      ];
      
      for (const pkgFile of commonPackageFiles) {
        const filePath = path.join(target.path, pkgFile);
        if (fs.existsSync(filePath)) {
          packageFiles.push({
            path: filePath,
            relative: pkgFile,
            type: this.getPackageFileType(pkgFile)
          });
        }
      }
    }
    
    return packageFiles;
  },
  
  /**
   * 获取包文件类型
   */
  getPackageFileType(filename) {
    if (filename === 'package.json') return 'npm';
    if (filename === 'requirements.txt' || filename === 'pyproject.toml') return 'python';
    if (filename === 'Cargo.toml') return 'rust';
    if (filename === 'go.mod') return 'go';
    if (filename === 'pom.xml' || filename === 'build.gradle' || filename === 'build.gradle.kts') return 'java';
    return 'unknown';
  },
  
  /**
   * 检查依赖项问题
   */
  async checkDependencyIssues(packageFiles, target) {
    const issues = [];
    
    for (const pkgFile of packageFiles) {
      try {
        const content = fs.readFileSync(pkgFile.path, 'utf8');
        
        if (pkgFile.type === 'npm') {
          // 检查package.json
          const packageJson = JSON.parse(content);
          
          // 检查依赖版本
          const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };
          
          for (const [dep, version] of Object.entries(deps)) {
            // 检查通配符版本
            if (version === '*' || version === 'latest') {
              issues.push({
                file: pkgFile.relative,
                line: 1, // 简化版本
                column: 1,
                rule: 'wildcard-version',
                message: `依赖 ${dep} 使用通配符版本: ${version}`,
                severity: 'medium',
                suggestion: '指定确切版本以确保一致性'
              });
            }
            
            // 检查过时的大型依赖（简化）
            const largeDeps = ['lodash', 'moment', 'axios', 'express', 'react', 'vue'];
            if (largeDeps.includes(dep)) {
              issues.push({
                file: pkgFile.relative,
                line: 1,
                column: 1,
                rule: 'large-dependency',
                message: `使用大型依赖: ${dep}`,
                severity: 'low',
                suggestion: '考虑是否真的需要此依赖，或寻找轻量替代'
              });
            }
          }
          
        } else if (pkgFile.type === 'python') {
          // 检查requirements.txt或pyproject.toml
          // 简化版本：只检查基本问题
          if (content.includes('==') && content.split('\n').length > 50) {
            issues.push({
              file: pkgFile.relative,
              line: 1,
              column: 1,
              rule: 'many-dependencies',
              message: '依赖项较多',
              severity: 'low',
              suggestion: '定期审查和清理未使用的依赖'
            });
          }
        }
        
      } catch (error) {
        console.warn(`依赖检查读取文件失败: ${pkgFile.path}`, error.message);
      }
    }
    
    return issues;
  },
  
  /**
   * 收集文件
   */
  collectFiles(target, options) {
    const files = [];
    
    if (target.type === 'file') {
      // 单个文件
      files.push({
        path: target.path,
        relative: target.name,
        name: target.name,
        isFile: true
      });
      return files;
    }
    
    // 目录
    const collectRecursive = (dir, baseDir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(baseDir, fullPath);
          
          // 检查排除模式
          if (options.excludePatterns.some(pattern => 
            relativePath.includes(pattern) || item.includes(pattern)
          )) {
            continue;
          }
          
          try {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              if (options.recursive) {
                collectRecursive(fullPath, baseDir);
              }
            } else if (stats.isFile()) {
              // 检查文件扩展名
              if (options.allFiles || !options.extensions || 
                  options.extensions.some(ext => fullPath.endsWith(ext))) {
                files.push({
                  path: fullPath,
                  relative: relativePath,
                  name: item,
                  size: stats.size,
                  isFile: true
                });
              }
            }
          } catch (error) {
            console.warn(`访问文件失败: ${fullPath}`, error.message);
          }
        }
      } catch (error) {
        console.warn(`读取目录失败: ${dir}`, error.message);
      }
    };
    
    collectRecursive(target.path, target.path);
    return files;
  },
  
  /**
   * 更新统计信息
   */
  updateSummaryStatistics(results) {
    const summary = results.summary;
    
    // 统计问题严重性
    for (const issue of results.issues) {
      summary.issuesFound++;
      
      switch (issue.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }
    }
    
    // 去重相似问题
    results.issues = this.deduplicateIssues(results.issues);
  },
  
  /**
   * 去重问题
   */
  deduplicateIssues(issues) {
    const seen = new Set();
    const uniqueIssues = [];
    
    for (const issue of issues) {
      const key = `${issue.file}-${issue.rule}-${issue.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueIssues.push(issue);
      }
    }
    
    return uniqueIssues;
  },
  
  /**
   * 生成审查报告
   */
  generateReviewReport(results, checkType, target) {
    const report = {
      title: `Hunter审查报告 - ${checkType}`,
      timestamp: results.timestamp,
      target: target,
      checkType: checkType,
      summary: results.summary,
      checks: results.checks,
      issuesBySeverity: {
        critical: results.issues.filter(i => i.severity === 'critical'),
        high: results.issues.filter(i => i.severity === 'high'),
        medium: results.issues.filter(i => i.severity === 'medium'),
        low: results.issues.filter(i => i.severity === 'low')
      },
      issuesByType: {},
      overallSeverity: results.summary.critical > 0 ? 'critical' : 
                      results.summary.high > 0 ? 'high' : 
                      results.summary.medium > 0 ? 'medium' : 'low'
    };
    
    // 按问题类型分组
    for (const issue of results.issues) {
      if (!report.issuesByType[issue.rule]) {
        report.issuesByType[issue.rule] = [];
      }
      report.issuesByType[issue.rule].push(issue);
    }
    
    return report;
  },
  
  /**
   * 生成建议
   */
  generateRecommendations(results) {
    const recommendations = [];
    const summary = results.summary;
    
    // 根据问题严重性生成建议
    if (summary.critical > 0) {
      recommendations.push('立即处理严重安全问题');
      recommendations.push('审查所有硬编码的敏感信息');
    }
    
    if (summary.high > 0) {
      recommendations.push('优先处理高优先级问题');
      recommendations.push('检查所有依赖项的安全性');
    }
    
    if (summary.medium > 0) {
      recommendations.push('安排时间处理中优先级问题');
      recommendations.push('考虑添加自动化测试');
    }
    
    if (summary.low > 0) {
      recommendations.push('在时间允许时处理低优先级问题');
      recommendations.push('考虑代码重构和优化');
    }
    
    // 通用建议
    if (summary.issuesFound > 0) {
      recommendations.push('建立定期代码审查流程');
      recommendations.push('考虑使用自动化代码质量工具');
    } else {
      recommendations.push('代码质量良好，继续保持');
      recommendations.push('定期运行审查确保质量');
    }
    
    return recommendations;
  },
  
  /**
   * 获取下一步建议
   */
  getNextSteps(results, recommendations) {
    const steps = [];
    
    if (results.summary.critical > 0) {
      steps.push('立即修复所有严重安全问题');
    }
    
    if (results.summary.high > 0) {
      steps.push('本周内修复高优先级问题');
    }
    
    if (results.fixes && results.fixes.length > 0) {
      steps.push('验证自动修复的结果');
    }
    
    // 添加具体建议
    if (recommendations.length > 0) {
      steps.push(...recommendations.slice(0, 3));
    }
    
    // 通用步骤
    steps.push('运行详细审查: hunter --detailed');
    steps.push('定期运行审查确保代码质量');
    
    return steps;
  },
  
  /**
   * 尝试自动修复
   */
  async attemptAutoFixes(issues, target) {
    const fixes = [];
    
    // 简化版本：只处理简单问题
    for (const issue of issues.slice(0, 10)) { // 限制修复数量
      if (issue.rule === 'todo-comment' && target.type === 'directory') {
        // 理论上可以删除TODO注释，但这里只记录
        fixes.push({
          issue: issue.rule,
          file: issue.file,
          status: 'identified',
          action: '移除TODO/FIXME注释',
          note: '需要人工确认'
        });
      } else if (issue.rule === 'console-statement' && target.type === 'directory') {
        fixes.push({
          issue: issue.rule,
          file: issue.file,
          status: 'identified', 
          action: '替换console.log为日志库',
          note: '需要人工实现'
        });
      }
    }
    
    return fixes;
  }
};