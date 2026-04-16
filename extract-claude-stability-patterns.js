// 提取Claude代码中的稳定性模式
const fs = require('fs');
const path = require('path');

class ClaudeStabilityPatternExtractor {
  constructor() {
    this.patterns = {
      errorHandling: [],
      configManagement: [],
      resourceManagement: [],
      fallbackStrategies: []
    };
  }

  async extractFromClaudeSkills() {
    const skillsDir = '/home/boz/.openclaw/workspace/skills-dev/skills/claude';
    
    if (!fs.existsSync(skillsDir)) {
      console.log('❌ Claude技能目录不存在');
      return;
    }

    const files = fs.readdirSync(skillsDir)
      .filter(f => f.endsWith('.js'))
      .map(f => path.join(skillsDir, f));

    console.log(`🔍 分析 ${files.length} 个Claude技能文件...`);

    for (const file of files) {
      await this.analyzeFile(file);
    }

    this.reportPatterns();
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    // 提取错误处理模式
    this.extractErrorHandling(content, filename);
    
    // 提取配置管理
    this.extractConfigManagement(content, filename);
    
    // 提取资源管理
    this.extractResourceManagement(content, filename);
    
    // 提取降级策略
    this.extractFallbackStrategies(content, filename);
  }

  extractErrorHandling(content, filename) {
    // 查找try-catch模式
    const tryCatchRegex = /try\s*{[\s\S]*?}\s*catch\s*\([^)]+\)\s*{[\s\S]*?}/g;
    const matches = content.match(tryCatchRegex);
    
    if (matches) {
      matches.forEach(match => {
        this.patterns.errorHandling.push({
          file: filename,
          pattern: 'try-catch',
          example: match.substring(0, 100) + '...'
        });
      });
    }

    // 查找错误日志
    const errorLogRegex = /console\.(error|warn)\([^)]*error[^)]*\)/gi;
    const errorLogs = content.match(errorLogRegex);
    
    if (errorLogs) {
      errorLogs.forEach(log => {
        this.patterns.errorHandling.push({
          file: filename,
          pattern: 'error-logging',
          example: log
        });
      });
    }
  }

  extractConfigManagement(content, filename) {
    // 查找配置验证
    const configRegex = /config|validate|default|fallback/gi;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (configRegex.test(line)) {
        this.patterns.configManagement.push({
          file: filename,
          line: index + 1,
          pattern: line.trim()
        });
      }
    });
  }

  extractResourceManagement(content, filename) {
    // 查找资源限制
    const resourceRegex = /limit|max|slice\(0,\s*\d+\)|timeout/gi;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (resourceRegex.test(line)) {
        this.patterns.resourceManagement.push({
          file: filename,
          line: index + 1,
          pattern: line.trim()
        });
      }
    });
  }

  extractFallbackStrategies(content, filename) {
    // 查找降级逻辑
    const fallbackRegex = /fallback|default|alternative|backup/gi;
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (fallbackRegex.test(line) && !line.includes('//')) {
        this.patterns.fallbackStrategies.push({
          file: filename,
          line: index + 1,
          pattern: line.trim()
        });
      }
    });
  }

  reportPatterns() {
    console.log('\n📊 Claude稳定性模式分析报告');
    console.log('='.repeat(50));

    console.log('\n1. 错误处理模式:');
    console.log(`   找到 ${this.patterns.errorHandling.length} 个模式`);
    this.patterns.errorHandling.slice(0, 3).forEach(p => {
      console.log(`   • ${p.file}: ${p.pattern}`);
    });

    console.log('\n2. 配置管理模式:');
    console.log(`   找到 ${this.patterns.configManagement.length} 个模式`);
    this.patterns.configManagement.slice(0, 3).forEach(p => {
      console.log(`   • ${p.file} L${p.line}: ${p.pattern}`);
    });

    console.log('\n3. 资源管理模式:');
    console.log(`   找到 ${this.patterns.resourceManagement.length} 个模式`);
    this.patterns.resourceManagement.slice(0, 3).forEach(p => {
      console.log(`   • ${p.file} L${p.line}: ${p.pattern}`);
    });

    console.log('\n4. 降级策略模式:');
    console.log(`   找到 ${this.patterns.fallbackStrategies.length} 个模式`);
    this.patterns.fallbackStrategies.slice(0, 3).forEach(p => {
      console.log(`   • ${p.file} L${p.line}: ${p.pattern}`);
    });

    // 保存分析结果
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: 13,
      patterns: this.patterns
    };

    fs.writeFileSync(
      '/home/boz/.openclaw/workspace/claude-stability-patterns.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ 分析完成！结果已保存到 claude-stability-patterns.json');
  }
}

// 执行分析
const extractor = new ClaudeStabilityPatternExtractor();
extractor.extractFromClaudeSkills().catch(console.error);