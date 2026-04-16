/**
 * 监控和告警系统 - 扩展S级修复系统
 */

class MonitoringSystem {
  constructor() {
    this.name = 'openclaw-monitoring';
    this.version = '1.0.0';
    this.metrics = new Map();
    this.alerts = new Map();
    this.startTime = Date.now();
    this.alertHistory = [];
    
    console.log('🚀 监控系统初始化');
  }
  
  initialize() {
    console.log('📊 初始化监控和告警系统...');
    
    // 初始化核心指标
    this.initializeCoreMetrics();
    
    // 启动监控循环
    this.startMonitoringLoop();
    
    // 启动告警检查
    this.startAlertChecking();
    
    console.log('✅ 监控系统初始化完成');
  }
  
  initializeCoreMetrics() {
    // 系统性能指标
    this.metrics.set('system.cpu.usage', { value: 0, unit: '%', threshold: 80 });
    this.metrics.set('system.memory.usage', { value: 0, unit: '%', threshold: 85 });
    this.metrics.set('system.disk.usage', { value: 0, unit: '%', threshold: 90 });
    
    // Gateway指标
    this.metrics.set('gateway.connections.active', { value: 0, unit: 'count', threshold: 100 });
    this.metrics.set('gateway.requests.per.second', { value: 0, unit: 'req/s', threshold: 50 });
    this.metrics.set('gateway.response.time.p95', { value: 0, unit: 'ms', threshold: 1000 });
    
    // 内存系统指标
    this.metrics.set('memory.search.hit.rate', { value: 0, unit: '%', threshold: 30 }); // 低于30%告警
    this.metrics.set('memory.index.size', { value: 0, unit: 'MB', threshold: 1000 });
    this.metrics.set('memory.chunks.count', { value: 0, unit: 'count', threshold: 10000 });
    
    // 错误指标
    this.metrics.set('errors.rate.limit.count', { value: 0, unit: 'count', threshold: 10 });
    this.metrics.set('errors.timeout.count', { value: 0, unit: 'count', threshold: 5 });
    this.metrics.set('errors.connection.count', { value: 0, unit: 'count', threshold: 3 });
    
    // 业务指标
    this.metrics.set('business.messages.sent', { value: 0, unit: 'count' });
    this.metrics.set('business.sessions.active', { value: 0, unit: 'count' });
    this.metrics.set('business.users.active', { value: 0, unit: 'count' });
    
    console.log(`📈 初始化 ${this.metrics.size} 个监控指标`);
  }
  
  startMonitoringLoop() {
    // 每30秒收集一次指标
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
    
    // 每5分钟生成一次报告
    setInterval(() => {
      this.generateReport();
    }, 300000);
    
    console.log('⏰ 监控循环已启动 (30秒收集, 5分钟报告)');
  }
  
  startAlertChecking() {
    // 每60秒检查一次告警
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
    
    console.log('🚨 告警检查已启动 (60秒间隔)');
  }
  
  async collectMetrics() {
    const timestamp = Date.now();
    
    try {
      // 收集系统指标
      await this.collectSystemMetrics(timestamp);
      
      // 收集Gateway指标
      await this.collectGatewayMetrics(timestamp);
      
      // 收集内存指标
      await this.collectMemoryMetrics(timestamp);
      
      // 收集错误指标
      await this.collectErrorMetrics(timestamp);
      
      // 收集业务指标
      await this.collectBusinessMetrics(timestamp);
      
      console.log(`📊 指标收集完成 (${new Date(timestamp).toLocaleTimeString()})`);
    } catch (error) {
      console.error('❌ 指标收集失败:', error);
    }
  }
  
  async collectSystemMetrics(timestamp) {
    // 模拟系统指标收集
    this.metrics.get('system.cpu.usage').value = Math.random() * 100;
    this.metrics.get('system.memory.usage').value = Math.random() * 100;
    this.metrics.get('system.disk.usage').value = Math.random() * 100;
  }
  
  async collectGatewayMetrics(timestamp) {
    // 模拟Gateway指标
    this.metrics.get('gateway.connections.active').value = Math.floor(Math.random() * 50);
    this.metrics.get('gateway.requests.per.second').value = Math.floor(Math.random() * 30);
    this.metrics.get('gateway.response.time.p95').value = Math.floor(Math.random() * 500);
  }
  
  async collectMemoryMetrics(timestamp) {
    // 模拟内存指标
    this.metrics.get('memory.search.hit.rate').value = 50 + Math.random() * 40; // 50-90%
    this.metrics.get('memory.index.size').value = Math.floor(Math.random() * 500);
    this.metrics.get('memory.chunks.count').value = Math.floor(Math.random() * 5000);
  }
  
  async collectErrorMetrics(timestamp) {
    // 模拟错误指标
    this.metrics.get('errors.rate.limit.count').value = Math.floor(Math.random() * 5);
    this.metrics.get('errors.timeout.count').value = Math.floor(Math.random() * 3);
    this.metrics.get('errors.connection.count').value = Math.floor(Math.random() * 2);
  }
  
  async collectBusinessMetrics(timestamp) {
    // 模拟业务指标
    this.metrics.get('business.messages.sent').value += Math.floor(Math.random() * 10);
    this.metrics.get('business.sessions.active').value = Math.floor(Math.random() * 20);
    this.metrics.get('business.users.active').value = Math.floor(Math.random() * 10);
  }
  
  checkAlerts() {
    const alerts = [];
    const timestamp = Date.now();
    
    for (const [metricName, metric] of this.metrics.entries()) {
      if (metric.threshold && metric.value > metric.threshold) {
        const alert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          metric: metricName,
          value: metric.value,
          threshold: metric.threshold,
          unit: metric.unit,
          severity: this.calculateSeverity(metricName, metric.value, metric.threshold),
          timestamp: new Date(timestamp).toISOString(),
          message: `${metricName} 超过阈值: ${metric.value}${metric.unit} > ${metric.threshold}${metric.unit}`
        };
        
        alerts.push(alert);
        
        // 触发告警
        this.triggerAlert(alert);
      }
    }
    
    if (alerts.length > 0) {
      console.log(`🚨 发现 ${alerts.length} 个告警`);
    }
    
    return alerts;
  }
  
  calculateSeverity(metricName, value, threshold) {
    const exceedRatio = (value - threshold) / threshold;
    
    if (exceedRatio > 1.0) return 'critical';
    if (exceedRatio > 0.5) return 'high';
    if (exceedRatio > 0.2) return 'medium';
    return 'low';
  }
  
  triggerAlert(alert) {
    // 记录告警历史
    this.alertHistory.push(alert);
    
    // 保持最近100条告警
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-50);
    }
    
    // 根据严重程度处理告警
    switch (alert.severity) {
      case 'critical':
        console.error(`🔴 CRITICAL: ${alert.message}`);
        // 这里可以发送紧急通知（邮件、短信、钉钉等）
        break;
      case 'high':
        console.warn(`🟠 HIGH: ${alert.message}`);
        // 这里可以发送重要通知
        break;
      case 'medium':
        console.warn(`🟡 MEDIUM: ${alert.message}`);
        // 这里可以记录日志
        break;
      case 'low':
        console.log(`🟢 LOW: ${alert.message}`);
        // 这里可以仅记录
        break;
    }
    
    // 存储到告警映射
    if (!this.alerts.has(alert.metric)) {
      this.alerts.set(alert.metric, []);
    }
    this.alerts.get(alert.metric).push(alert);
  }
  
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      metrics: this.getMetricsSummary(),
      alerts: this.getAlertsSummary(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('📈 监控报告生成:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
  
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const seconds = Math.floor((uptimeMs % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  getMetricsSummary() {
    const summary = {
      totalMetrics: this.metrics.size,
      criticalMetrics: 0,
      warningMetrics: 0,
      healthyMetrics: 0
    };
    
    for (const [name, metric] of this.metrics.entries()) {
      if (metric.threshold) {
        if (metric.value > metric.threshold * 1.5) {
          summary.criticalMetrics++;
        } else if (metric.value > metric.threshold) {
          summary.warningMetrics++;
        } else {
          summary.healthyMetrics++;
        }
      }
    }
    
    return summary;
  }
  
  getAlertsSummary() {
    const lastHour = Date.now() - 3600000;
    const recentAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > lastHour
    );
    
    const severityCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const alert of recentAlerts) {
      severityCount[alert.severity]++;
    }
    
    return {
      totalLastHour: recentAlerts.length,
      bySeverity: severityCount,
      mostCommonAlert: this.getMostCommonAlert(recentAlerts)
    };
  }
  
  getMostCommonAlert(alerts) {
    if (alerts.length === 0) return null;
    
    const metricCount = {};
    for (const alert of alerts) {
      metricCount[alert.metric] = (metricCount[alert.metric] || 0) + 1;
    }
    
    const mostCommon = Object.entries(metricCount)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      metric: mostCommon[0],
      count: mostCommon[1]
    };
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // 基于指标生成建议
    for (const [metricName, metric] of this.metrics.entries()) {
      if (metric.threshold && metric.value > metric.threshold) {
        const recommendation = this.getRecommendationForMetric(metricName, metric);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }
    
    return recommendations;
  }
  
  getRecommendationForMetric(metricName, metric) {
    const recommendations = {
      'system.memory.usage': '考虑增加内存或优化内存使用',
      'system.cpu.usage': '检查CPU密集型任务，考虑优化或扩容',
      'system.disk.usage': '清理磁盘空间或增加存储',
      'gateway.connections.active': '考虑负载均衡或扩容Gateway',
      'gateway.response.time.p95': '优化API响应时间，检查慢查询',
      'memory.search.hit.rate': '优化内存搜索配置，考虑增加缓存',
      'errors.rate.limit.count': '调整API调用频率或申请更高配额',
      'errors.timeout.count': '检查网络连接或增加超时时间'
    };
    
    if (recommendations[metricName]) {
      return {
        metric: metricName,
        issue: `当前值: ${metric.value}${metric.unit}, 阈值: ${metric.threshold}${metric.unit}`,
        recommendation: recommendations[metricName],
        priority: metric.value > metric.threshold * 1.5 ? '高' : '中'
      };
    }
    
    return null;
  }
  
  getMetric(metricName) {
    return this.metrics.get(metricName);
  }
  
  setMetric(metricName, value) {
    const metric = this.metrics.get(metricName);
    if (metric) {
      metric.value = value;
      return true;
    }
    return false;
  }
  
  getAlertHistory(limit = 20) {
    return this.alertHistory.slice(-limit);
  }
  
  clearAlerts(metricName) {
    if (metricName) {
      this.alerts.delete(metricName);
    } else {
      this.alerts.clear();
    }
  }
  
  shutdown() {
    console.log('🛑 关闭监控系统...');
    // 清理定时器等资源
    console.log('✅ 监控系统已关闭');
  }
}

// 创建全局监控实例
const globalMonitoring = new MonitoringSystem();

// 导出
module.exports = {
  MonitoringSystem,
  globalMonitoring,
  
  // 工具函数
  startMonitoring: () => globalMonitoring.initialize(),
  getMetrics: () => {
    const metrics = {};
    for (const [name, metric] of globalMonitoring.metrics.entries()) {
      metrics[name] = { ...metric };
    }
    return metrics;
  },
  getAlerts: (limit = 10) => globalMonitoring.getAlertHistory(limit),
  generateReport: () => globalMonitoring.generateReport(),
  shutdownMonitoring: () => globalMonitoring.shutdown()
};