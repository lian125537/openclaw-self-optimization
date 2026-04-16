/**
 * ContextManager - 上下文管理器
 * 自动化管理 AI 对话上下文，防止 token 溢出
 */

const fs = require('fs');
const path = require('path');

class ContextManager {
  constructor(options = {}) {
    this.config = {
      maxTokens: options.maxTokens || 120000, // 预留安全边界
      compressionThreshold: options.compressionThreshold || 0.8, // 80%时开始压缩
      archiveDir: options.archiveDir || './context_archive',
      snapshotInterval: options.snapshotInterval || 10000, // 每10k tokens快照
      debug: options.debug || false,
      ...options
    };
    
    // 状态跟踪
    this.state = {
      currentTokens: 0,
      lastSnapshotTokens: 0,
      compressionCount: 0,
      archiveCount: 0,
      startTime: new Date()
    };
    
    // 确保存档目录存在
    this.ensureArchiveDir();
    
    console.log('📚 ContextManager 初始化完成');
    console.log(`   最大token: ${this.config.maxTokens}`);
    console.log(`   压缩阈值: ${this.config.compressionThreshold * 100}%`);
  }
  
  /**
   * 确保存档目录存在
   */
  ensureArchiveDir() {
    if (!fs.existsSync(this.config.archiveDir)) {
      fs.mkdirSync(this.config.archiveDir, { recursive: true });
    }
  }
  
  /**
   * 更新 token 计数
   */
  updateTokenCount(tokens) {
    this.state.currentTokens = tokens;
    
    // 检查是否需要压缩
    const usageRatio = tokens / this.config.maxTokens;
    
    if (usageRatio >= this.config.compressionThreshold) {
      this.compressContext();
    }
    
    // 检查是否需要快照
    const tokenDiff = tokens - this.state.lastSnapshotTokens;
    if (tokenDiff >= this.config.snapshotInterval) {
      this.createSnapshot();
      this.state.lastSnapshotTokens = tokens;
    }
    
    if (this.config.debug) {
      console.log(`📊 Token使用: ${tokens}/${this.config.maxTokens} (${(usageRatio * 100).toFixed(1)}%)`);
    }
    
    return usageRatio;
  }
  
  /**
   * 压缩上下文
   */
  compressContext() {
    this.state.compressionCount++;
    
    console.log(`🧹 压缩上下文 (#${this.state.compressionCount})...`);
    
    // 这里可以实现具体的压缩逻辑，例如：
    // 1. 移除旧的、不重要的消息
    // 2. 总结长对话
    // 3. 提取关键信息
    
    const compressionStrategies = [
      this.summarizeOldMessages.bind(this),
      this.removeRedundantMessages.bind(this),
      this.extractKeyPoints.bind(this)
    ];
    
    let tokensSaved = 0;
    for (const strategy of compressionStrategies) {
      tokensSaved += strategy();
    }
    
    console.log(`✅ 上下文压缩完成，节省约 ${tokensSaved} tokens`);
    
    this.emit('contextCompressed', {
      count: this.state.compressionCount,
      tokensSaved,
      timestamp: new Date()
    });
    
    return tokensSaved;
  }
  
  /**
   * 总结旧消息
   */
  summarizeOldMessages() {
    // 实现：将旧消息总结为简短摘要
    // 返回估计节省的 tokens
    return 5000; // 示例值
  }
  
  /**
   * 移除冗余消息
   */
  removeRedundantMessages() {
    // 实现：移除重复或低价值消息
    return 3000; // 示例值
  }
  
  /**
   * 提取关键点
   */
  extractKeyPoints() {
    // 实现：提取对话关键点，移除细节
    return 2000; // 示例值
  }
  
  /**
   * 创建快照
   */
  createSnapshot() {
    this.state.archiveCount++;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = path.join(this.config.archiveDir, `snapshot_${timestamp}.json`);
    
    const snapshot = {
      metadata: {
        created: new Date().toISOString(),
        tokens: this.state.currentTokens,
        compressionCount: this.state.compressionCount,
        archiveCount: this.state.archiveCount
      },
      state: this.state,
      config: this.config
    };
    
    try {
      fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
      
      if (this.config.debug) {
        console.log(`📸 快照创建: ${snapshotFile}`);
      }
      
      this.emit('snapshotCreated', {
        file: snapshotFile,
        tokens: this.state.currentTokens,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ 快照创建失败:', error.message);
    }
  }
  
  /**
   * 重置上下文
   */
  resetContext(reason = 'manual') {
    console.log(`🔄 重置上下文 (原因: ${reason})...`);
    
    // 创建最终快照
    this.createSnapshot();
    
    // 重置状态
    const oldState = { ...this.state };
    this.state = {
      currentTokens: 0,
      lastSnapshotTokens: 0,
      compressionCount: 0,
      archiveCount: 0,
      startTime: new Date()
    };
    
    this.emit('contextReset', {
      oldState,
      newState: this.state,
      reason,
      timestamp: new Date()
    });
    
    console.log('✅ 上下文重置完成');
    
    return this.state;
  }
  
  /**
   * 获取状态报告
   */
  getStatusReport() {
    const usageRatio = this.state.currentTokens / this.config.maxTokens;
    const uptime = Date.now() - this.state.startTime;
    
    return {
      tokens: {
        current: this.state.currentTokens,
        max: this.config.maxTokens,
        ratio: usageRatio,
        percentage: (usageRatio * 100).toFixed(1) + '%'
      },
      operations: {
        compressions: this.state.compressionCount,
        archives: this.state.archiveCount,
        uptime: this.formatDuration(uptime)
      },
      warnings: this.getWarnings(usageRatio),
      recommendations: this.getRecommendations(usageRatio)
    };
  }
  
  /**
   * 获取警告
   */
  getWarnings(usageRatio) {
    const warnings = [];
    
    if (usageRatio >= 0.9) {
      warnings.push('⚠️  上下文使用超过90%，建议立即重置');
    } else if (usageRatio >= 0.8) {
      warnings.push('⚠️  上下文使用超过80%，考虑压缩或重置');
    } else if (usageRatio >= 0.7) {
      warnings.push('ℹ️  上下文使用超过70%，监控使用情况');
    }
    
    if (this.state.compressionCount >= 5) {
      warnings.push('⚠️  压缩次数过多，考虑重置上下文');
    }
    
    return warnings;
  }
  
  /**
   * 获取建议
   */
  getRecommendations(usageRatio) {
    const recommendations = [];
    
    if (usageRatio >= 0.85) {
      recommendations.push('立即重置上下文');
    } else if (usageRatio >= 0.75) {
      recommendations.push('执行上下文压缩');
      recommendations.push('移除不重要的历史消息');
    } else if (usageRatio >= 0.6) {
      recommendations.push('监控token使用增长');
      recommendations.push('准备压缩策略');
    }
    
    return recommendations;
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
   * 事件发射器（简化）
   */
  emit(event, data) {
    if (this.config.debug) {
      console.log(`📡 事件: ${event}`, data);
    }
  }
  
  /**
   * 自动管理策略
   */
  getAutoManagementStrategy() {
    return {
      // 基于使用率的策略
      byUsage: [
        { threshold: 0.9, action: 'reset', priority: 'critical' },
        { threshold: 0.8, action: 'compress', priority: 'high' },
        { threshold: 0.7, action: 'warn', priority: 'medium' },
        { threshold: 0.6, action: 'monitor', priority: 'low' }
      ],
      
      // 基于时间的策略
      byTime: [
        { interval: 3600000, action: 'snapshot' }, // 每小时快照
        { interval: 86400000, action: 'reset' }    // 每天重置
      ],
      
      // 基于操作的策略
      byOperations: [
        { compressions: 5, action: 'reset' },
        { archives: 10, action: 'cleanup' }
      ]
    };
  }
  
  /**
   * 应用自动管理
   */
  applyAutoManagement() {
    const report = this.getStatusReport();
    const strategy = this.getAutoManagementStrategy();
    
    // 检查使用率策略
    for (const rule of strategy.byUsage) {
      if (report.tokens.ratio >= rule.threshold) {
        console.log(`🤖 自动管理: ${rule.action} (使用率: ${report.tokens.percentage})`);
        
        switch (rule.action) {
          case 'reset':
            this.resetContext(`auto-usage-${rule.threshold}`);
            break;
          case 'compress':
            this.compressContext();
            break;
          case 'warn':
            console.warn(`⚠️  上下文使用率: ${report.tokens.percentage}`);
            break;
        }
        
        break;
      }
    }
    
    return report;
  }
}

module.exports = ContextManager;