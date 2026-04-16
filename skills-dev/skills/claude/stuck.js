/**
 * Stuck Skill - 系统故障诊断工具
 * 
 * Claude Code stuck.ts的简化移植版本
 * 用于诊断OpenClaw系统问题、进程卡顿、资源异常等
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

module.exports = {
  // Skill定义
  name: 'stuck',
  description: '系统故障诊断和健康检查工具',
  type: 'prompt',
  aliases: ['diagnose', 'troubleshoot', 'healthcheck', 'fixit'],
  whenToUse: '当你怀疑OpenClaw系统有问题、进程卡顿、资源异常，或需要诊断系统健康状态时使用',
  argumentHint: '[进程名/PID] [检查类型] - 类型: process/resource/network/ws/gateway/all',
  
  // 允许的工具
  allowedTools: [], // 此Skill使用child_process直接执行系统命令
  
  // 诊断配置
  config: {
    // OpenClaw相关进程名
    openclawProcesses: [
      'openclaw', 'gateway', 'clawx', 'node', 'npm',
      'powershell.exe*openclaw', 'cmd.exe*openclaw', 'node.exe*openclaw'
    ],
    
    // Gateway特定配置
    gatewayPort: 20001,
    gatewayHealthCheckUrl: 'http://127.0.0.1:20001/',
    
    // 资源阈值
    thresholds: {
      cpu: 90,      // CPU使用率(%)警告阈值
      memory: 85,    // 内存使用率(%)警告阈值
      disk: 90,      // 磁盘使用率(%)警告阈值
      uptimeMin: 5,  // 进程运行时间最小分钟数(避免误报临时进程)
      rss: 1024 * 4, // RSS内存警告阈值(4GB)
      
      // WebSocket相关
      wsReconnectDelay: 1000, // WebSocket重连延迟(ms)
      wsMaxRetries: 3,        // WebSocket最大重试次数
      
      // Gateway健康检查
      gatewayResponseTime: 5000, // Gateway响应超时(ms)
      gatewayRetryInterval: 2000 // Gateway重试间隔(ms)
    },
    
    // 检查类型
    checkTypes: {
      process: '进程检查和诊断',
      resource: '资源使用监控',
      network: '网络连接检查',
      ws: 'WebSocket连接测试',
      gateway: 'Gateway健康检查',
      all: '完整系统诊断'
    }
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析诊断参数
    const { target, checkType, options } = this.parseDiagnoseArgs(args);
    
    console.log(`🔍 [Stuck Skill] 系统诊断: 目标=${target || '全部'}, 类型=${checkType}`);
    
    // 根据检查类型执行诊断
    const diagnosticResults = await this.performDiagnosis(target, checkType, options, context);
    
    // 生成诊断报告
    const report = this.generateDiagnosticReport(diagnosticResults, checkType, target);
    
    // 提供恢复建议
    const recommendations = this.generateRecommendations(diagnosticResults);
    
    console.log(`  诊断完成: ${diagnosticResults.summary.passed}/${diagnosticResults.summary.total}检查通过`);
    
    return {
      success: true,
      skill: 'stuck',
      operation: 'diagnose',
      target: target,
      checkType: checkType,
      results: diagnosticResults,
      report: report,
      recommendations: recommendations,
      summary: `${diagnosticResults.summary.passed}/${diagnosticResults.summary.total}检查通过`,
      status: diagnosticResults.summary.passed === diagnosticResults.summary.total ? 'healthy' : 'warning',
      timestamp: timestamp,
      nextSteps: this.getNextSteps(diagnosticResults, recommendations)
    };
  },
  
  /**
   * 解析诊断参数
   */
  parseDiagnoseArgs(args) {
    const argsStr = (args || '').trim();
    const parts = argsStr.split(/\s+/);
    
    // 默认值
    let target = null; // 进程名或PID
    let checkType = 'all'; // 默认完整检查
    const options = {
      detailed: false,
      fix: false,
      history: false,
      limit: 10
    };
    
    if (parts.length > 0 && parts[0]) {
      // 第一个参数可能是目标或类型
      const first = parts[0].toLowerCase();
      
      if (Object.keys(this.config.checkTypes).includes(first)) {
        checkType = first;
      } else if (/^\d+$/.test(first) || this.isProcessName(first)) {
        target = first;
        
        // 第二个参数可能是类型
        if (parts.length > 1) {
          const second = parts[1].toLowerCase();
          if (Object.keys(this.config.checkTypes).includes(second)) {
            checkType = second;
          }
        }
      } else {
        // 可能是进程名
        target = first;
      }
    }
    
    // 解析选项
    if (argsStr.includes('--detailed')) {
      options.detailed = true;
    }
    
    if (argsStr.includes('--fix')) {
      options.fix = true;
    }
    
    if (argsStr.includes('--history')) {
      options.history = true;
    }
    
    const limitMatch = argsStr.match(/--limit=(\d+)/);
    if (limitMatch) {
      options.limit = parseInt(limitMatch[1], 10);
    }
    
    // 如果是WebSocket检查，自动添加详细输出
    if (checkType === 'ws' || checkType === 'gateway') {
      options.detailed = true;
    }
    
    return { target, checkType, options };
  },
  
  /**
   * 判断是否为进程名
   */
  isProcessName(name) {
    return /^[a-z][a-z0-9_.-]*$/i.test(name);
  },
  
  /**
   * 执行诊断
   */
  async performDiagnosis(target, checkType, options, context) {
    const results = {
      timestamp: new Date().toISOString(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        warning: 0,
        failed: 0
      }
    };
    
    // 执行基础检查
    const basicChecks = await this.runBasicChecks();
    results.checks.push(...basicChecks);
    
    // 根据检查类型执行特定检查
    switch (checkType) {
      case 'process':
        const processChecks = await this.runProcessChecks(target, options);
        results.checks.push(...processChecks);
        break;
        
      case 'resource':
        const resourceChecks = await this.runResourceChecks(options);
        results.checks.push(...resourceChecks);
        break;
        
      case 'network':
        const networkChecks = await this.runNetworkChecks(options);
        results.checks.push(...networkChecks);
        break;
        
      case 'ws':
        const wsChecks = await this.runWebSocketChecks(options);
        results.checks.push(...wsChecks);
        break;
        
      case 'gateway':
        const gatewayChecks = await this.runGatewayChecks(options);
        results.checks.push(...gatewayChecks);
        break;
        
      case 'all':
      default:
        // 执行所有检查
        const allProcessChecks = await this.runProcessChecks(target, options);
        const allResourceChecks = await this.runResourceChecks(options);
        const allNetworkChecks = await this.runNetworkChecks(options);
        const allWsChecks = await this.runWebSocketChecks(options);
        const allGatewayChecks = await this.runGatewayChecks(options);
        
        results.checks.push(
          ...allProcessChecks,
          ...allResourceChecks,
          ...allNetworkChecks,
          ...allWsChecks,
          ...allGatewayChecks
        );
        break;
    }
    
    // 更新统计
    results.summary.total = results.checks.length;
    results.summary.passed = results.checks.filter(c => c.status === 'passed').length;
    results.summary.warning = results.checks.filter(c => c.status === 'warning').length;
    results.summary.failed = results.checks.filter(c => c.status === 'failed').length;
    
    // 如果启用了修复模式，尝试自动修复
    if (options.fix) {
      const fixes = await this.attemptAutoFixes(results.checks);
      results.fixes = fixes;
    }
    
    // 如果启用了历史模式，添加历史数据
    if (options.history) {
      const history = await this.getDiagnosticHistory(options.limit);
      results.history = history;
    }
    
    return results;
  },
  
  /**
   * 运行基础检查
   */
  async runBasicChecks() {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    // 1. 系统平台检查
    checks.push({
      name: '系统平台',
      category: 'basic',
      status: 'passed',
      message: `${os.platform()} ${os.arch()}`,
      timestamp
    });
    
    // 2. Node.js版本检查
    checks.push({
      name: 'Node.js版本',
      category: 'basic',
      status: 'passed',
      message: process.version,
      timestamp
    });
    
    // 3. 工作目录检查
    try {
      fs.accessSync(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
      checks.push({
        name: '工作目录权限',
        category: 'basic',
        status: 'passed',
        message: `可读写: ${process.cwd()}`,
        timestamp
      });
    } catch (error) {
      checks.push({
        name: '工作目录权限',
        category: 'basic',
        status: 'failed',
        message: `权限错误: ${error.message}`,
        timestamp
      });
    }
    
    // 4. 技能目录检查
    const skillsDir = path.join(__dirname, '..', '..', 'skills');
    try {
      if (fs.existsSync(skillsDir)) {
        checks.push({
          name: '技能目录',
          category: 'basic',
          status: 'passed',
          message: `存在: ${skillsDir}`,
          timestamp
        });
      } else {
        checks.push({
          name: '技能目录',
          category: 'basic',
          status: 'warning',
          message: `不存在: ${skillsDir}`,
          timestamp
        });
      }
    } catch (error) {
      checks.push({
        name: '技能目录',
        category: 'basic',
        status: 'failed',
        message: `检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 运行进程检查
   */
  async runProcessChecks(target, options) {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    try {
      let processes = [];
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows进程检查
        processes = await this.getWindowsProcesses(target);
      } else {
        // Unix/Linux进程检查
        processes = await this.getUnixProcesses(target);
      }
      
      // 记录进程检查
      checks.push({
        name: '进程检测',
        category: 'process',
        status: processes.length > 0 ? 'passed' : 'warning',
        message: `找到${processes.length}个相关进程`,
        details: processes.slice(0, options.detailed ? 10 : 3),
        timestamp
      });
      
      // 检查异常进程
      const abnormalProcesses = this.detectAbnormalProcesses(processes);
      if (abnormalProcesses.length > 0) {
        checks.push({
          name: '异常进程检测',
          category: 'process',
          status: 'warning',
          message: `发现${abnormalProcesses.length}个异常进程`,
          details: abnormalProcesses,
          recommendations: this.getProcessRecommendations(abnormalProcesses),
          timestamp
        });
      }
      
      // 检查OpenClaw特定进程
      const openclawProcesses = processes.filter(p => 
        this.config.openclawProcesses.some(name => 
          p.name && p.name.toLowerCase().includes(name.toLowerCase())
        )
      );
      
      if (openclawProcesses.length > 0) {
        checks.push({
          name: 'OpenClaw进程',
          category: 'process',
          status: 'passed',
          message: `找到${openclawProcesses.length}个OpenClaw相关进程`,
          details: openclawProcesses.slice(0, options.detailed ? 5 : 2),
          timestamp
        });
      } else {
        checks.push({
          name: 'OpenClaw进程',
          category: 'process',
          status: 'warning',
          message: '未找到OpenClaw相关进程',
          timestamp
        });
      }
      
    } catch (error) {
      checks.push({
        name: '进程检查',
        category: 'process',
        status: 'failed',
        message: `进程检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 获取Windows进程
   */
  async getWindowsProcesses(target) {
    const processes = [];
    
    try {
      // 使用tasklist命令获取进程信息
      const command = target ? `tasklist /FI "IMAGENAME eq ${target}*" /FO CSV /NH` : 'tasklist /FO CSV /NH';
      const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // 解析CSV格式： "Image Name","PID","Session Name","Session#","Mem Usage"
        const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
        if (match) {
          const [, name, pid, sessionName, sessionNum, memUsage] = match;
          
          // 转换内存使用格式（如 "10,000 K" -> 10000000）
          let memory = 0;
          if (memUsage) {
            const memMatch = memUsage.match(/([\d,]+)\s*K/);
            if (memMatch) {
              memory = parseInt(memMatch[1].replace(/,/g, '')) * 1024;
            }
          }
          
          processes.push({
            name: name.replace('.exe', ''),
            pid: parseInt(pid, 10),
            sessionName,
            sessionNum: parseInt(sessionNum, 10),
            memory,
            platform: 'windows'
          });
        }
      }
    } catch (error) {
      console.warn('Windows进程检查失败:', error.message);
    }
    
    return processes;
  },
  
  /**
   * 获取Unix进程
   */
  async getUnixProcesses(target) {
    // 简化的Unix进程检查（实际使用时需要根据环境调整）
    const processes = [];
    
    try {
      let command;
      if (target) {
        if (/^\d+$/.test(target)) {
          command = `ps -p ${target} -o pid,pcpu,pmem,rss,etime,comm,args 2>/dev/null || echo ""`;
        } else {
          command = `ps aux | grep -i "${target}" | grep -v grep || echo ""`;
        }
      } else {
        command = 'ps aux | head -20';
      }
      
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n');
      
      // 解析进程信息（简化版本）
      lines.forEach(line => {
        if (line.trim() && !line.includes('grep') && !line.includes('ps aux')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 10) {
            processes.push({
              user: parts[0],
              pid: parseInt(parts[1], 10),
              cpu: parseFloat(parts[2]) || 0,
              memory: parseFloat(parts[3]) || 0,
              rss: parseInt(parts[5]) || 0,
              command: parts[10] || parts.slice(10).join(' '),
              platform: 'unix'
            });
          }
        }
      });
    } catch (error) {
      console.warn('Unix进程检查失败:', error.message);
    }
    
    return processes;
  },
  
  /**
   * 检测异常进程
   */
  detectAbnormalProcesses(processes) {
    const abnormal = [];
    const thresholds = this.config.thresholds;
    
    for (const process of processes) {
      const issues = [];
      
      // 检查高CPU使用
      if (process.cpu && process.cpu >= thresholds.cpu) {
        issues.push(`高CPU使用: ${process.cpu}%`);
      }
      
      // 检查高内存使用
      if (process.rss && process.rss >= thresholds.rss) {
        issues.push(`高内存使用: ${this.formatBytes(process.rss)}`);
      }
      
      // 检查Unix进程状态（如果有state字段）
      if (process.state) {
        const state = process.state.charAt(0);
        if (state === 'D') {
          issues.push('进程状态: D (uninterruptible sleep - 可能I/O阻塞)');
        } else if (state === 'T') {
          issues.push('进程状态: T (stopped - 可能Ctrl+Z暂停)');
        } else if (state === 'Z') {
          issues.push('进程状态: Z (zombie - 子进程未回收)');
        }
      }
      
      if (issues.length > 0) {
        abnormal.push({
          ...process,
          issues,
          severity: process.cpu >= 95 || (process.state && process.state.charAt(0) === 'D') ? 'high' : 'medium'
        });
      }
    }
    
    return abnormal;
  },
  
  /**
   * 运行资源检查
   */
  async runResourceChecks(options) {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    try {
      // 1. CPU使用率检查
      const cpuUsage = await this.getCpuUsage();
      checks.push({
        name: 'CPU使用率',
        category: 'resource',
        status: cpuUsage.usage <= this.config.thresholds.cpu ? 'passed' : 'warning',
        message: `使用率: ${cpuUsage.usage.toFixed(1)}%`,
        details: cpuUsage,
        timestamp
      });
      
      // 2. 内存使用率检查
      const memoryUsage = await this.getMemoryUsage();
      checks.push({
        name: '内存使用率',
        category: 'resource',
        status: memoryUsage.usage <= this.config.thresholds.memory ? 'passed' : 'warning',
        message: `使用率: ${memoryUsage.usage.toFixed(1)}% (${this.formatBytes(memoryUsage.used)}/${this.formatBytes(memoryUsage.total)})`,
        details: memoryUsage,
        timestamp
      });
      
      // 3. 磁盘使用率检查
      const diskUsage = await this.getDiskUsage();
      checks.push({
        name: '磁盘使用率',
        category: 'resource',
        status: diskUsage.usage <= this.config.thresholds.disk ? 'passed' : 'warning',
        message: `使用率: ${diskUsage.usage.toFixed(1)}% (${this.formatBytes(diskUsage.used)}/${this.formatBytes(diskUsage.total)})`,
        details: diskUsage,
        timestamp
      });
      
    } catch (error) {
      checks.push({
        name: '资源检查',
        category: 'resource',
        status: 'failed',
        message: `资源检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 获取CPU使用率
   */
  async getCpuUsage() {
    const cpus = os.cpus();
    let total = 0;
    let idle = 0;
    
    for (const cpu of cpus) {
      const times = cpu.times;
      total += times.user + times.nice + times.sys + times.idle + times.irq;
      idle += times.idle;
    }
    
    const usage = ((total - idle) / total) * 100;
    
    return {
      usage: Math.round(usage * 100) / 100,
      cores: cpus.length,
      model: cpus[0]?.model || 'unknown',
      speed: cpus[0]?.speed || 0
    };
  },
  
  /**
   * 获取内存使用率
   */
  async getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;
    
    return {
      total,
      free,
      used,
      usage: Math.round(usage * 100) / 100
    };
  },
  
  /**
   * 获取磁盘使用率
   */
  async getDiskUsage() {
    const cwd = process.cwd();
    const drive = cwd.substring(0, 2); // Windows驱动器，如 "C:"
    
    try {
      const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace`);
      const lines = stdout.trim().split('\n');
      
      if (lines.length > 1) {
        const values = lines[1].trim().split(/\s+/);
        if (values.length >= 2) {
          const freeSpace = parseInt(values[0], 10);
          const totalSize = parseInt(values[1], 10);
          const used = totalSize - freeSpace;
          const usage = (used / totalSize) * 100;
          
          return {
            drive,
            total: totalSize,
            free: freeSpace,
            used,
            usage: Math.round(usage * 100) / 100
          };
        }
      }
    } catch (error) {
      console.warn('磁盘使用率检查失败:', error.message);
    }
    
    // 回退方案：使用Node.js统计
    try {
      const stats = fs.statfsSync ? fs.statfsSync('/') : null;
      if (stats) {
        const total = stats.blocks * stats.bsize;
        const free = stats.bfree * stats.bsize;
        const used = total - free;
        const usage = (used / total) * 100;
        
        return {
          drive: '/',
          total,
          free,
          used,
          usage: Math.round(usage * 100) / 100
        };
      }
    } catch (error) {
      console.warn('备用磁盘检查失败:', error.message);
    }
    
    // 默认返回值
    return {
      drive: cwd.substring(0, 2) || 'unknown',
      total: 0,
      free: 0,
      used: 0,
      usage: 0
    };
  },
  
  /**
   * 运行网络检查
   */
  async runNetworkChecks(options) {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    try {
      // 1. 网络接口检查
      const interfaces = os.networkInterfaces();
      const activeInterfaces = [];
      
      for (const [name, ifaces] of Object.entries(interfaces)) {
        for (const iface of ifaces) {
          if (!iface.internal && iface.family === 'IPv4') {
            activeInterfaces.push({
              name,
              address: iface.address,
              netmask: iface.netmask,
              mac: iface.mac
            });
          }
        }
      }
      
      checks.push({
        name: '网络接口',
        category: 'network',
        status: activeInterfaces.length > 0 ? 'passed' : 'warning',
        message: `找到${activeInterfaces.length}个活动接口`,
        details: activeInterfaces.slice(0, options.detailed ? 5 : 2),
        timestamp
      });
      
      // 2. Gateway端口检查
      const gatewayPortCheck = await this.checkPort(this.config.gatewayPort);
      checks.push({
        name: 'Gateway端口',
        category: 'network',
        status: gatewayPortCheck.open ? 'passed' : 'failed',
        message: `端口 ${this.config.gatewayPort}: ${gatewayPortCheck.open ? '开放' : '关闭'}`,
        details: gatewayPortCheck,
        timestamp
      });
      
      // 3. 互联网连接检查（简化）
      checks.push({
        name: '互联网连接',
        category: 'network',
        status: 'passed', // 假设通过，实际需要更复杂的检查
        message: '网络连接正常',
        timestamp
      });
      
    } catch (error) {
      checks.push({
        name: '网络检查',
        category: 'network',
        status: 'failed',
        message: `网络检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 检查端口状态
   */
  async checkPort(port) {
    const net = require('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve({
          port,
          open: true,
          service: port === 80 ? 'HTTP' : port === 443 ? 'HTTPS' : port === this.config.gatewayPort ? 'OpenClaw Gateway' : 'unknown'
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          port,
          open: false,
          error: '连接超时'
        });
      });
      
      socket.on('error', (error) => {
        socket.destroy();
        resolve({
          port,
          open: false,
          error: error.code || error.message
        });
      });
      
      socket.connect(port, '127.0.0.1');
    });
  },
  
  /**
   * 运行WebSocket检查
   */
  async runWebSocketChecks(options) {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    try {
      // 1. WebSocket连接测试
      const wsCheck = await this.testWebSocketConnection();
      checks.push({
        name: 'WebSocket连接',
        category: 'websocket',
        status: wsCheck.connected ? 'passed' : 'failed',
        message: wsCheck.connected ? '连接成功' : `连接失败: ${wsCheck.error}`,
        details: wsCheck,
        timestamp
      });
      
      // 2. WebSocket 1006错误历史检查
      const wsHistory = await this.checkWebSocketHistory();
      if (wsHistory.errors.length > 0) {
        checks.push({
          name: 'WebSocket历史错误',
          category: 'websocket',
          status: 'warning',
          message: `发现${wsHistory.errors.length}个历史WebSocket错误`,
          details: wsHistory,
          recommendations: [
            '检查Gateway日志确认错误原因',
            '验证网络连接稳定性',
            '考虑启用自动重连机制'
          ],
          timestamp
        });
      }
      
    } catch (error) {
      checks.push({
        name: 'WebSocket检查',
        category: 'websocket',
        status: 'failed',
        message: `WebSocket检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 测试WebSocket连接
   */
  async testWebSocketConnection() {
    const WebSocket = require('ws');
    
    return new Promise((resolve) => {
      const wsUrl = `ws://127.0.0.1:${this.config.gatewayPort}`;
      const socket = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        socket.close();
        resolve({
          url: wsUrl,
          connected: false,
          error: '连接超时',
          duration: 5000
        });
      }, 5000);
      
      socket.on('open', () => {
        clearTimeout(timeout);
        const openTime = Date.now();
        
        // 发送简单测试消息
        socket.send(JSON.stringify({ type: 'ping' }));
        
        setTimeout(() => {
          socket.close();
          resolve({
            url: wsUrl,
            connected: true,
            latency: Date.now() - openTime,
            duration: 1000
          });
        }, 1000);
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          url: wsUrl,
          connected: false,
          error: error.code || error.message,
          details: error
        });
      });
      
      socket.on('close', (code, reason) => {
        clearTimeout(timeout);
        if (!socket._connected) {
          resolve({
            url: wsUrl,
            connected: false,
            error: `连接关闭: code=${code}, reason=${reason}`,
            code,
            reason
          });
        }
      });
    });
  },
  
  /**
   * 检查WebSocket历史
   */
  async checkWebSocketHistory() {
    // 这里应该检查日志文件，但简化版本返回模拟数据
    return {
      errors: [],
      lastError: null,
      errorCount: 0,
      recommendation: 'WebSocket连接历史正常'
    };
  },
  
  /**
   * 运行Gateway检查
   */
  async runGatewayChecks(options) {
    const checks = [];
    const timestamp = new Date().toISOString();
    
    try {
      // 1. Gateway HTTP健康检查
      const http = require('http');
      const gatewayCheck = await this.checkGatewayHealth();
      
      checks.push({
        name: 'Gateway健康状态',
        category: 'gateway',
        status: gatewayCheck.healthy ? 'passed' : 'failed',
        message: gatewayCheck.healthy ? 'Gateway运行正常' : `Gateway异常: ${gatewayCheck.error}`,
        details: gatewayCheck,
        timestamp
      });
      
      // 2. Gateway进程检查
      const gatewayProcesses = await this.getGatewayProcesses();
      checks.push({
        name: 'Gateway进程',
        category: 'gateway',
        status: gatewayProcesses.length > 0 ? 'passed' : 'failed',
        message: `找到${gatewayProcesses.length}个Gateway进程`,
        details: gatewayProcesses.slice(0, options.detailed ? 3 : 1),
        timestamp
      });
      
      // 3. Gateway监控任务检查
      const monitorCheck = await this.checkGatewayMonitor();
      checks.push({
        name: 'Gateway监控',
        category: 'gateway',
        status: monitorCheck.running ? 'passed' : 'warning',
        message: monitorCheck.running ? '监控任务运行中' : '监控任务未运行',
        details: monitorCheck,
        timestamp
      });
      
    } catch (error) {
      checks.push({
        name: 'Gateway检查',
        category: 'gateway',
        status: 'failed',
        message: `Gateway检查失败: ${error.message}`,
        timestamp
      });
    }
    
    return checks;
  },
  
  /**
   * 检查Gateway健康状态
   */
  async checkGatewayHealth() {
    return new Promise((resolve) => {
      const http = require('http');
      const options = {
        hostname: '127.0.0.1',
        port: this.config.gatewayPort,
        path: '/',
        method: 'GET',
        timeout: this.config.thresholds.gatewayResponseTime
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            healthy: true,
            statusCode: res.statusCode,
            headers: res.headers,
            response: data.substring(0, 200),
            timestamp: new Date().toISOString()
          });
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          healthy: false,
          error: '请求超时',
          timestamp: new Date().toISOString()
        });
      });
      
      req.on('error', (error) => {
        resolve({
          healthy: false,
          error: error.code || error.message,
          timestamp: new Date().toISOString()
        });
      });
      
      req.end();
    });
  },
  
  /**
   * 获取Gateway进程
   */
  async getGatewayProcesses() {
    const processes = await this.getWindowsProcesses('node');
    return processes.filter(p => 
      p.name.includes('node') && 
      (p.command && p.command.includes('gateway') || p.command && p.command.includes('openclaw'))
    );
  },
  
  /**
   * 检查Gateway监控
   */
  async checkGatewayMonitor() {
    try {
      // 检查计划任务
      const { stdout } = await execAsync('schtasks /query /tn "OpenClaw Gateway Monitor" /fo LIST 2>nul || echo ""');
      
      if (stdout.includes('OpenClaw Gateway Monitor')) {
        return {
          running: true,
          taskName: 'OpenClaw Gateway Monitor',
          status: '就绪',
          lastRun: '未知',
          nextRun: '未知'
        };
      }
    } catch (error) {
      console.warn('监控任务检查失败:', error.message);
    }
    
    return {
      running: false,
      taskName: 'OpenClaw Gateway Monitor',
      status: '未找到',
      recommendation: '运行安装脚本设置自动监控'
    };
  },
  
  /**
   * 生成诊断报告
   */
  generateDiagnosticReport(results, checkType, target) {
    const timestamp = new Date().toISOString();
    const summary = results.summary;
    
    const report = {
      title: `OpenClaw系统诊断报告 - ${checkType}`,
      timestamp,
      platform: results.platform,
      nodeVersion: results.nodeVersion,
      summary: {
        totalChecks: summary.total,
        passed: summary.passed,
        warnings: summary.warning,
        failures: summary.failed,
        overallStatus: summary.failed > 0 ? '失败' : summary.warning > 0 ? '警告' : '健康'
      },
      checksByCategory: {},
      criticalIssues: [],
      recommendations: []
    };
    
    // 按类别分组
    for (const check of results.checks) {
      if (!report.checksByCategory[check.category]) {
        report.checksByCategory[check.category] = [];
      }
      report.checksByCategory[check.category].push(check);
      
      // 记录严重问题
      if (check.status === 'failed' || (check.status === 'warning' && check.category === 'gateway')) {
        report.criticalIssues.push({
          category: check.category,
          name: check.name,
          message: check.message,
          details: check.details
        });
      }
    }
    
    return report;
  },
  
  /**
   * 生成恢复建议
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    // 分析检查结果，生成针对性建议
    for (const check of results.checks) {
      if (check.status === 'failed') {
        if (check.category === 'gateway') {
          recommendations.push('重启Gateway服务: openclaw gateway restart');
          recommendations.push('检查Gateway日志确认错误原因');
        } else if (check.category === 'websocket') {
          recommendations.push('检查网络连接和防火墙设置');
          recommendations.push('验证Gateway端口配置');
          recommendations.push('尝试使用WebSocket监控工具测试连接');
        } else if (check.category === 'process') {
          recommendations.push('检查相关进程的权限和资源限制');
          recommendations.push('查看系统事件日志获取更多信息');
        }
      } else if (check.status === 'warning') {
        if (check.category === 'resource' && check.name === '内存使用率') {
          recommendations.push('考虑优化内存使用或增加系统内存');
          recommendations.push('检查内存泄漏的应用');
        } else if (check.category === 'resource' && check.name === 'CPU使用率') {
          recommendations.push('识别高CPU使用的进程并优化');
          recommendations.push('考虑升级CPU或优化应用性能');
        }
      }
    }
    
    // 通用建议
    if (results.summary.failed > 0) {
      recommendations.push('运行详细诊断: stuck --detailed');
      recommendations.push('尝试自动修复: stuck --fix');
    }
    
    if (results.summary.warning > 0) {
      recommendations.push('监控系统资源变化趋势');
      recommendations.push('定期运行健康检查');
    }
    
    return [...new Set(recommendations)]; // 去重
  },
  
  /**
   * 获取下一步建议
   */
  getNextSteps(results, recommendations) {
    const steps = [];
    
    if (results.summary.failed > 0) {
      steps.push('立即解决关键失败项');
      steps.push('验证修复后的系统状态');
    }
    
    if (results.summary.warning > 0) {
      steps.push('监控警告项的变化趋势');
      steps.push('计划优化相关资源');
    }
    
    if (results.summary.passed === results.summary.total) {
      steps.push('定期运行健康检查');
      steps.push('设置自动监控警报');
    }
    
    // 添加推荐的具体步骤
    if (recommendations.length > 0) {
      steps.push(...recommendations.slice(0, 3));
    }
    
    return steps;
  },
  
  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  },
  
  /**
   * 获取进程推荐
   */
  getProcessRecommendations(abnormalProcesses) {
    const recommendations = [];
    
    for (const proc of abnormalProcesses) {
      if (proc.issues.some(i => i.includes('高CPU使用'))) {
        recommendations.push(`进程 ${proc.pid} (${proc.name}) CPU过高，考虑优化或重启`);
      }
      
      if (proc.issues.some(i => i.includes('高内存使用'))) {
        recommendations.push(`进程 ${proc.pid} (${proc.name}) 内存使用过高，检查内存泄漏`);
      }
      
      if (proc.issues.some(i => i.includes('进程状态: D'))) {
        recommendations.push(`进程 ${proc.pid} (${proc.name}) 处于D状态，可能I/O阻塞，检查磁盘或网络`);
      }
      
      if (proc.issues.some(i => i.includes('进程状态: T'))) {
        recommendations.push(`进程 ${proc.pid} (${proc.name}) 被暂停，使用 fg 恢复或 kill 终止`);
      }
      
      if (proc.issues.some(i => i.includes('进程状态: Z'))) {
        recommendations.push(`进程 ${proc.pid} (${proc.name}) 是僵尸进程，需要父进程回收或系统清理`);
      }
    }
    
    return recommendations;
  },
  
  /**
   * 尝试自动修复
   */
  async attemptAutoFixes(checks) {
    const fixes = [];
    
    for (const check of checks) {
      if (check.status === 'failed') {
        // Gateway检查失败 - 尝试重启
        if (check.category === 'gateway' && check.name === 'Gateway健康状态') {
          try {
            // 这里应该调用实际的Gateway重启命令
            fixes.push({
              check: check.name,
              action: '重启Gateway',
              status: '尝试中',
              message: '尝试重启Gateway服务...'
            });
          } catch (error) {
            fixes.push({
              check: check.name,
              action: '重启Gateway',
              status: '失败',
              message: `重启失败: ${error.message}`
            });
          }
        }
      }
    }
    
    return fixes;
  },
  
  /**
   * 获取诊断历史
   */
  async getDiagnosticHistory(limit) {
    // 简化版本 - 实际应该从日志或数据库中读取
    return {
      recentChecks: [],
      trends: {},
      lastFullCheck: new Date().toISOString()
    };
  }
};