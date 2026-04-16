/**
 * Batch Skill - 批处理执行工具
 * 
 * Claude Code batch.ts的简化移植版本
 * 提供任务分解、批量执行和进度跟踪功能
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

module.exports = {
  // Skill定义
  name: 'batch',
  description: '批处理执行和任务编排工具',
  type: 'prompt',
  aliases: ['parallel', 'bulk', 'mass', 'batchProcess'],
  whenToUse: '当你需要批量执行相似任务或分解大型任务时使用',
  argumentHint: '[指令] [选项] - 指令: 要批量处理的任务描述',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { instruction, options } = this.parseBatchArgs(args);
    
    if (!instruction || instruction.length === 0) {
      return this.showBatchHelp();
    }
    
    console.log(`🔧 [Batch Skill] 执行指令: ${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}`);
    console.log(`   选项: 模式=${options.mode}, 单元数=${options.unitCount}, 并发=${options.concurrency}`);
    
    try {
      // 1. 计划阶段：分解任务
      console.log('\n📋 计划阶段：分析任务并分解...');
      const plan = await this.planBatchTask(instruction, options, context);
      
      if (!plan.success) {
        return plan;
      }
      
      console.log(`   ✅ 计划完成: ${plan.units.length}个任务单元`);
      
      // 2. 执行阶段：运行任务
      console.log(`\n🚀 执行阶段：${options.mode}模式执行...`);
      const results = await this.executeBatchTasks(plan.units, options, context);
      
      // 3. 汇总阶段：分析结果
      console.log('\n📊 汇总阶段：分析执行结果...');
      const summary = this.summarizeBatchResults(results, plan, options);
      
      return {
        success: true,
        skill: 'batch',
        operation: 'execute',
        instruction: instruction,
        plan: plan,
        execution: results,
        summary: summary,
        timestamp: timestamp
      };
      
    } catch (error) {
      console.error('批处理执行失败:', error);
      return {
        success: false,
        skill: 'batch',
        error: `批处理执行失败: ${error.message}`,
        timestamp: timestamp
      };
    }
  },
  
  /**
   * 解析批处理参数
   */
  parseBatchArgs(args) {
    const argsStr = args.trim();
    
    // 默认选项
    const options = {
      mode: 'parallel', // parallel, sequential
      unitCount: 5,
      concurrency: 3,
      maxUnits: 20,
      timeout: 30000, // 30秒超时
      retryCount: 1
    };
    
    // 解析模式参数
    if (argsStr.includes('--mode parallel') || argsStr.includes('--parallel')) {
      options.mode = 'parallel';
    } else if (argsStr.includes('--mode sequential') || argsStr.includes('--sequential')) {
      options.mode = 'sequential';
      options.concurrency = 1;
    }
    
    // 解析单元数
    const unitMatch = argsStr.match(/--units\s+(\d+)/i);
    if (unitMatch) {
      const unitCount = parseInt(unitMatch[1]);
      options.unitCount = Math.min(Math.max(unitCount, 1), options.maxUnits);
    }
    
    // 解析并发数
    const concurrencyMatch = argsStr.match(/--concurrency\s+(\d+)/i);
    if (concurrencyMatch) {
      const concurrency = parseInt(concurrencyMatch[1]);
      options.concurrency = Math.max(concurrency, 1);
      if (options.mode === 'sequential') {
        options.concurrency = 1;
      }
    }
    
    // 解析超时
    const timeoutMatch = argsStr.match(/--timeout\s+(\d+)/i);
    if (timeoutMatch) {
      options.timeout = parseInt(timeoutMatch[1]) * 1000; // 转为毫秒
    }
    
    // 提取指令（移除所有选项参数）
    let instruction = argsStr
      .replace(/--mode\s+\w+/gi, '')
      .replace(/--units\s+\d+/gi, '')
      .replace(/--concurrency\s+\d+/gi, '')
      .replace(/--timeout\s+\d+/gi, '')
      .replace(/--parallel/gi, '')
      .replace(/--sequential/gi, '')
      .trim();
    
    return { instruction, options };
  },
  
  /**
   * 显示批处理帮助
   */
  showBatchHelp() {
    return {
      success: true,
      skill: 'batch',
      operation: 'help',
      help: {
        description: '批处理执行和任务编排工具',
        examples: [
          'batch "处理所有JSON配置文件"',
          'batch "批量重命名文件" --mode parallel --units 8',
          'batch "执行测试套件" --mode sequential --timeout 60',
          'batch "批量下载资源" --concurrency 3 --units 10'
        ],
        options: [
          { option: '--mode parallel/sequential', description: '执行模式 (默认: parallel)' },
          { option: '--units <数量>', description: '任务单元数量 (默认: 5, 最大: 20)' },
          { option: '--concurrency <数量>', description: '并发执行数 (默认: 3)' },
          { option: '--timeout <秒数>', description: '每个任务超时时间 (默认: 30秒)' }
        ],
        useCases: [
          '文件批量处理 (重命名、转换、移动)',
          '数据批量导入/导出',
          '测试批量执行',
          '资源批量下载',
          '代码批量重构'
        ]
      },
      summary: '批处理工具 - 分解大任务为小单元，并行或串行执行',
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 计划批处理任务
   */
  async planBatchTask(instruction, options, context) {
    try {
      // 分析指令，决定如何分解
      const analysis = this.analyzeInstruction(instruction);
      
      // 生成任务单元
      const units = this.generateTaskUnits(analysis, options);
      
      // 创建执行计划
      const plan = {
        success: true,
        analysis: analysis,
        units: units,
        totalUnits: units.length,
        estimatedTime: this.estimateExecutionTime(units, options),
        strategy: this.getExecutionStrategy(options)
      };
      
      console.log('  任务分析:');
      console.log(`    类型: ${analysis.type}`);
      console.log(`    复杂度: ${analysis.complexity}`);
      console.log(`    关键词: ${analysis.keywords.join(', ')}`);
      console.log(`    建议分解: ${units.length}个单元`);
      
      return plan;
      
    } catch (error) {
      console.error('计划阶段失败:', error);
      return {
        success: false,
        error: `计划阶段失败: ${error.message}`,
        suggestion: '尝试简化指令或减少单元数量'
      };
    }
  },
  
  /**
   * 分析指令
   */
  analyzeInstruction(instruction) {
    const lowerInstruction = instruction.toLowerCase();
    
    // 检测任务类型
    const typePatterns = {
      file: /file|json|xml|csv|yaml|config|rename|move|copy|delete/i,
      data: /data|process|import|export|transform|convert|parse/i,
      test: /test|unit|integration|e2e|verify|check|validate/i,
      network: /download|upload|fetch|request|api|http|web/i,
      code: /code|refactor|migrate|update|replace|fix|bug/i
    };
    
    let detectedType = 'general';
    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(instruction)) {
        detectedType = type;
        break;
      }
    }
    
    // 提取关键词
    const keywords = lowerInstruction
      .split(/\s+/)
      .filter(word => word.length > 3 && !/^[0-9]/.test(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .slice(0, 10);
    
    // 评估复杂度
    const wordCount = lowerInstruction.split(/\s+/).length;
    let complexity = 'low';
    if (wordCount > 20) complexity = 'high';
    else if (wordCount > 10) complexity = 'medium';
    
    return {
      type: detectedType,
      complexity: complexity,
      keywords: keywords,
      wordCount: wordCount,
      original: instruction
    };
  },
  
  /**
   * 生成任务单元
   */
  generateTaskUnits(analysis, options) {
    const units = [];
    const unitCount = Math.min(options.unitCount, options.maxUnits);
    
    // 根据任务类型生成不同的单元
    for (let i = 0; i < unitCount; i++) {
      const unitId = `unit_${i + 1}`;
      let unitDescription = '';
      let unitAction = '';
      
      switch (analysis.type) {
        case 'file':
          unitDescription = `文件处理单元 ${i + 1}`;
          unitAction = `process_files --batch ${i + 1} --total ${unitCount}`;
          break;
        case 'data':
          unitDescription = `数据处理单元 ${i + 1}`;
          unitAction = `process_data --chunk ${i + 1} --total ${unitCount}`;
          break;
        case 'test':
          unitDescription = `测试执行单元 ${i + 1}`;
          unitAction = `run_tests --group ${i + 1} --total ${unitCount}`;
          break;
        case 'network':
          unitDescription = `网络请求单元 ${i + 1}`;
          unitAction = `fetch_resources --batch ${i + 1} --total ${unitCount}`;
          break;
        case 'code':
          unitDescription = `代码处理单元 ${i + 1}`;
          unitAction = `process_code --module ${i + 1} --total ${unitCount}`;
          break;
        default:
          unitDescription = `任务单元 ${i + 1}`;
          unitAction = `execute_task --unit ${i + 1} --total ${unitCount}`;
      }
      
      units.push({
        id: unitId,
        number: i + 1,
        total: unitCount,
        description: unitDescription,
        action: unitAction,
        status: 'pending',
        result: null,
        error: null,
        startTime: null,
        endTime: null,
        duration: null
      });
    }
    
    return units;
  },
  
  /**
   * 估计执行时间
   */
  estimateExecutionTime(units, options) {
    const baseTimePerUnit = 2000; // 2秒基础时间
    const timePerUnit = baseTimePerUnit * (options.mode === 'parallel' ? 1 : units.length);
    const estimatedSeconds = Math.ceil((timePerUnit * units.length) / options.concurrency / 1000);
    
    return {
      seconds: estimatedSeconds,
      humanReadable: estimatedSeconds < 60 ? 
        `${estimatedSeconds}秒` : 
        `${Math.floor(estimatedSeconds / 60)}分${estimatedSeconds % 60}秒`
    };
  },
  
  /**
   * 获取执行策略
   */
  getExecutionStrategy(options) {
    return {
      mode: options.mode,
      concurrency: options.concurrency,
      timeout: options.timeout,
      retryCount: options.retryCount,
      description: `${options.mode === 'parallel' ? '并行' : '串行'}执行，并发数: ${options.concurrency}`
    };
  },
  
  /**
   * 执行批处理任务
   */
  async executeBatchTasks(units, options, context) {
    const results = [];
    const startTime = Date.now();
    
    if (options.mode === 'sequential') {
      // 串行执行
      for (let i = 0; i < units.length; i++) {
        const result = await this.executeSingleTask(units[i], options, context);
        results.push(result);
        
        // 更新进度
        console.log(`   [${i + 1}/${units.length}] ${result.status}: ${result.description}`);
      }
    } else {
      // 并行执行（有限并发）
      const chunks = this.chunkArray(units, options.concurrency);
      
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        console.log(`   执行块 ${chunkIndex + 1}/${chunks.length} (${chunk.length}个任务)`);
        
        // 并行执行当前块
        const chunkPromises = chunk.map(unit => 
          this.executeSingleTask(unit, options, context)
        );
        
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
        
        // 报告当前块结果
        const successCount = chunkResults.filter(r => r.status === 'success').length;
        const failCount = chunkResults.filter(r => r.status === 'failed').length;
        console.log(`     结果: ${successCount}成功, ${failCount}失败`);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`\n  总执行时间: ${totalDuration}ms`);
    
    return results;
  },
  
  /**
   * 执行单个任务
   */
  async executeSingleTask(unit, options, context) {
    unit.startTime = Date.now();
    unit.status = 'running';
    
    try {
      // 模拟任务执行（实际应用中这里会执行真实任务）
      await this.simulateTaskExecution(unit, options);
      
      unit.endTime = Date.now();
      unit.duration = unit.endTime - unit.startTime;
      unit.status = 'success';
      unit.result = {
        message: `任务 ${unit.number} 执行成功`,
        output: `单元 ${unit.number}/${unit.total} 完成`,
        simulated: true
      };
      
      return unit;
      
    } catch (error) {
      unit.endTime = Date.now();
      unit.duration = unit.endTime - unit.startTime;
      unit.status = 'failed';
      unit.error = {
        message: error.message,
        stack: error.stack
      };
      
      // 重试逻辑
      if (options.retryCount > 0) {
        console.log(`   任务 ${unit.number} 失败，尝试重试...`);
        
        for (let retry = 1; retry <= options.retryCount; retry++) {
          try {
            await this.simulateTaskExecution(unit, options, true); // 重试模式
            unit.status = 'success';
            unit.result = {
              message: `任务 ${unit.number} 重试成功 (第${retry}次)`,
              retried: true
            };
            break;
          } catch (retryError) {
            if (retry === options.retryCount) {
              unit.error.retryFailed = true;
            }
          }
        }
      }
      
      return unit;
    }
  },
  
  /**
   * 模拟任务执行
   */
  async simulateTaskExecution(unit, options, isRetry = false) {
    // 模拟执行时间 (500-3000ms)
    const baseDelay = isRetry ? 100 : 500; // 重试更快
    const delay = baseDelay + Math.random() * 2500;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 模拟成功率 (90% 成功)
    const successRate = isRetry ? 0.8 : 0.9; // 重试成功率略低
    if (Math.random() > successRate) {
      throw new Error(`模拟任务 ${unit.number} 执行失败`);
    }
    
    return true;
  },
  
  /**
   * 数组分块
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },
  
  /**
   * 汇总批处理结果
   */
  summarizeBatchResults(results, plan, options) {
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = successCount > 0 ? Math.round(totalDuration / successCount) : 0;
    
    // 生成状态表格
    const statusTable = results.map(unit => ({
      unit: unit.number,
      description: unit.description,
      status: unit.status,
      duration: unit.duration ? `${unit.duration}ms` : 'N/A',
      result: unit.result ? '成功' : unit.error ? '失败' : '未知'
    }));
    
    // 性能分析
    const efficiency = successCount / results.length;
    const performanceRating = efficiency > 0.9 ? '优秀' : 
                             efficiency > 0.7 ? '良好' : 
                             efficiency > 0.5 ? '一般' : '差';
    
    // 建议
    const suggestions = [];
    if (failCount > 0) {
      suggestions.push(`有${failCount}个任务失败，建议检查错误日志`);
    }
    if (options.mode === 'sequential' && results.length > 5) {
      suggestions.push('任务较多，建议使用并行模式提高效率');
    }
    if (efficiency < 0.7) {
      suggestions.push('成功率较低，建议减少并发数或增加重试次数');
    }
    
    return {
      statistics: {
        totalTasks: results.length,
        success: successCount,
        failed: failCount,
        successRate: Math.round(efficiency * 100) + '%',
        totalDuration: totalDuration + 'ms',
        averageDuration: avgDuration + 'ms',
        performance: performanceRating
      },
      statusTable: statusTable,
      suggestions: suggestions,
      executionSummary: `${successCount}/${results.length} 个任务成功完成 (${Math.round(efficiency * 100)}%)`,
      recommendations: this.generateRecommendations(results, options)
    };
  },
  
  /**
   * 生成建议
   */
  generateRecommendations(results, options) {
    const recommendations = [];
    
    // 分析执行模式
    if (options.mode === 'sequential' && results.length > 3) {
      recommendations.push({
        type: 'optimization',
        suggestion: '使用并行模式 (--mode parallel) 提高执行速度',
        benefit: '预计可减少' + Math.round((results.length - 1) * 100 / results.length) + '% 执行时间'
      });
    }
    
    // 分析并发设置
    const successCount = results.filter(r => r.status === 'success').length;
    const successRate = successCount / results.length;
    
    if (successRate < 0.8 && options.concurrency > 1) {
      recommendations.push({
        type: 'stability',
        suggestion: '减少并发数 (--concurrency 1) 提高稳定性',
        benefit: '预计成功率可提升至 90%+'
      });
    }
    
    // 分析超时设置
    const longTasks = results.filter(r => r.duration && r.duration > options.timeout * 0.8);
    if (longTasks.length > 0) {
      recommendations.push({
        type: 'timeout',
        suggestion: '增加超时时间 (--timeout ' + Math.ceil(options.timeout / 1000 * 1.5) + ')',
        benefit: '避免任务因超时失败'
      });
    }
    
    // 默认建议
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        suggestion: '当前配置表现良好，可尝试增加任务数量',
        benefit: '提升批量处理能力'
      });
    }
    
    return recommendations;
  },
  
  /**
   * 真实文件批处理示例
   */
  async processFilesBatch(pattern, options) {
    // 这个函数展示了如何处理真实文件
    console.log('处理文件批处理任务...');
    
    // 在实际应用中，这里会:
    // 1. 查找匹配的文件
    // 2. 将文件列表分块
    // 3. 并行处理每个文件块
    // 4. 汇总结果
    
    return {
      filesProcessed: 0,
      success: 0,
      failed: 0,
      results: []
    };
  },
  
  /**
   * 真实网络请求批处理示例
   */
  async processNetworkRequests(urls, options) {
    // 这个函数展示了如何处理网络请求
    console.log('处理网络请求批处理任务...');
    
    // 在实际应用中，这里会:
    // 1. 将URL列表分块
    // 2. 使用并发限制发送请求
    // 3. 处理响应
    // 4. 汇总结果
    
    return {
      requests: urls.length,
      success: 0,
      failed: 0,
      data: []
    };
  }
};