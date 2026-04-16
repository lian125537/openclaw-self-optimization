#!/usr/bin/env node

/**
 * 聊天记录保持系统
 * 实时监控OpenClaw会话，防止上下文被清空
 * 自动将会话内容保存到记忆系统
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChatHistoryPreserver {
  constructor() {
    this.sessionDir = '/home/boz/.openclaw/agents/main/sessions';
    this.memoryDir = '/home/boz/.openclaw/workspace/memory';
    this.backupDir = '/home/boz/.openclaw/workspace/memory/chat-history';
    
    // 确保目录存在
    this.ensureDirectories();
    
    // 监控状态
    this.monitoredSessions = new Set();
    this.lastCheckTime = Date.now();
    
    console.log('📚 聊天记录保持系统启动');
    console.log(`会话目录: ${this.sessionDir}`);
    console.log(`记忆目录: ${this.memoryDir}`);
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`创建备份目录: ${this.backupDir}`);
    }
  }
  
  // 获取当前活跃会话
  getActiveSessions() {
    try {
      const sessions = [];
      const files = fs.readdirSync(this.sessionDir);
      
      for (const file of files) {
        if (file.endsWith('.jsonl') && !file.includes('.backup') && !file.includes('.reset') && !file.includes('.bak')) {
          const sessionPath = path.join(this.sessionDir, file);
          const stats = fs.statSync(sessionPath);
          
          // 最近5分钟内有活动的会话
          if (Date.now() - stats.mtimeMs < 5 * 60 * 1000) {
            sessions.push({
              id: file.replace('.jsonl', ''),
              path: sessionPath,
              mtime: stats.mtimeMs,
              size: stats.size
            });
          }
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('获取会话列表失败:', error.message);
      return [];
    }
  }
  
  // 解析会话文件
  parseSessionFile(sessionPath) {
    try {
      const content = fs.readFileSync(sessionPath, 'utf8');
      const lines = content.trim().split('\n');
      const messages = [];
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          
          // 处理不同类型的消息事件
          if (event.type === 'message' && event.message) {
            // 嵌套消息格式
            const msg = event.message;
            if (msg.role === 'user' || msg.role === 'assistant') {
              // 提取文本内容
              let textContent = '';
              if (Array.isArray(msg.content)) {
                // 处理 content 数组格式
                for (const item of msg.content) {
                  if (item.type === 'text' && item.text) {
                    textContent += item.text + '\n';
                  }
                }
              } else if (typeof msg.content === 'string') {
                // 直接字符串格式
                textContent = msg.content;
              }
              
              if (textContent.trim()) {
                messages.push({
                  role: msg.role,
                  content: textContent.trim(),
                  timestamp: event.timestamp || msg.timestamp || Date.now()
                });
              }
            }
          } else if (event.role === 'user' || event.role === 'assistant') {
            // 旧格式：直接包含 role/content
            if (event.content && typeof event.content === 'string') {
              messages.push({
                role: event.role,
                content: event.content,
                timestamp: event.timestamp || Date.now()
              });
            }
          }
        } catch (e) {
          // 跳过无效JSON行
        }
      }
      
      return messages;
    } catch (error) {
      console.error(`解析会话文件失败 ${sessionPath}:`, error.message);
      return [];
    }
  }
  
  // 提取重要对话内容
  extractImportantMessages(messages) {
    const important = [];
    
    for (const msg of messages) {
      // 只保留用户和助手的消息
      if (msg.role === 'user' || msg.role === 'assistant') {
        // 过滤掉工具调用等系统消息
        if (msg.content && typeof msg.content === 'string' && msg.content.trim().length > 10) {
          important.push({
            role: msg.role,
            content: msg.content.substring(0, 500), // 截断过长的内容
            timestamp: msg.timestamp || Date.now()
          });
        }
      }
    }
    
    return important;
  }
  
  // 保存到每日记忆文件
  saveToDailyMemory(sessionId, messages) {
    if (messages.length === 0) return;
    
    // 总是使用当前本地日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const memoryFile = path.join(this.memoryDir, `${today}.md`);
    
    let existingContent = '';
    if (fs.existsSync(memoryFile)) {
      existingContent = fs.readFileSync(memoryFile, 'utf8');
    }
    
    const newContent = this.formatChatHistory(sessionId, messages);
    
    // 检查是否已经有这个会话的记录
    const sessionPattern = new RegExp(`会话ID: ${sessionId}[\\s\\S]*?\\*自动备份于:`, 'g');
    const existingSessionMatch = existingContent.match(sessionPattern);
    
    if (existingSessionMatch) {
      // 已有记录，更新它
      const updatedContent = existingContent.replace(sessionPattern, newContent);
      fs.writeFileSync(memoryFile, updatedContent, 'utf8');
      console.log(`🔄 更新会话 ${sessionId} 到 ${today}.md (${messages.length} 条消息)`);
    } else {
      // 新会话，添加记录
      const updatedContent = existingContent + '\n\n' + newContent;
      fs.writeFileSync(memoryFile, updatedContent, 'utf8');
      console.log(`✅ 保存会话 ${sessionId} 到 ${today}.md (${messages.length} 条消息)`);
    }
  }
  
  // 格式化聊天历史
  formatChatHistory(sessionId, messages) {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    let formatted = `## 💬 实时聊天记录备份 (${now})\n\n`;
    formatted += `**会话ID**: ${sessionId}\n\n`;
    
    for (const msg of messages.slice(-20)) { // 只保留最近20条
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
      
      formatted += `### ${role} [${time}]\n`;
      formatted += `${msg.content}\n\n`;
    }
    
    formatted += `---\n*自动备份于: ${now}*\n`;
    return formatted;
  }
  
  // 创建会话备份
  createSessionBackup(sessionId, sessionPath) {
    const backupFile = path.join(this.backupDir, `${sessionId}_${Date.now()}.jsonl`);
    
    try {
      fs.copyFileSync(sessionPath, backupFile);
      console.log(`📦 创建会话备份: ${backupFile}`);
    } catch (error) {
      console.error(`创建备份失败 ${sessionId}:`, error.message);
    }
  }
  
  // 监控循环
  startMonitoring(intervalMs = 60000) { // 默认1分钟检查一次
    console.log(`⏰ 开始监控，检查间隔: ${intervalMs/1000}秒`);
    
    setInterval(() => {
      this.checkAndPreserve();
    }, intervalMs);
    
    // 立即执行一次检查
    this.checkAndPreserve();
  }
  
  // 检查并保存
  checkAndPreserve() {
    const now = Date.now();
    const activeSessions = this.getActiveSessions();
    
    console.log(`\n🔍 检查会话 (${new Date().toLocaleTimeString('zh-CN')})`);
    console.log(`活跃会话数: ${activeSessions.length}`);
    
    for (const session of activeSessions) {
      if (!this.monitoredSessions.has(session.id)) {
        console.log(`👀 开始监控新会话: ${session.id}`);
        this.monitoredSessions.add(session.id);
      }
      
      // 解析会话内容
      const messages = this.parseSessionFile(session.path);
      const importantMessages = this.extractImportantMessages(messages);
      
      if (importantMessages.length > 0) {
        // 保存到每日记忆
        this.saveToDailyMemory(session.id, importantMessages);
        
        // 每10分钟创建一次完整备份
        if (now - this.lastCheckTime > 10 * 60 * 1000) {
          this.createSessionBackup(session.id, session.path);
        }
      }
    }
    
    this.lastCheckTime = now;
    
    // 清理过期的监控会话（24小时无活动）
    this.cleanupOldSessions();
  }
  
  // 清理旧的监控会话
  cleanupOldSessions() {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const sessionId of this.monitoredSessions) {
      const sessionPath = path.join(this.sessionDir, `${sessionId}.jsonl`);
      
      if (fs.existsSync(sessionPath)) {
        const stats = fs.statSync(sessionPath);
        if (stats.mtimeMs < twentyFourHoursAgo) {
          console.log(`🧹 清理过期会话监控: ${sessionId}`);
          this.monitoredSessions.delete(sessionId);
        }
      } else {
        console.log(`🗑️ 清理不存在的会话: ${sessionId}`);
        this.monitoredSessions.delete(sessionId);
      }
    }
  }
  
  // 启动系统服务
  startAsService() {
    console.log('🚀 启动聊天记录保持服务');
    console.log('按 Ctrl+C 停止服务\n');
    
    // 捕获退出信号
    process.on('SIGINT', () => {
      console.log('\n🛑 停止聊天记录保持服务');
      process.exit(0);
    });
    
    // 开始监控
    this.startMonitoring();
  }
}

// 主程序
if (require.main === module) {
  const preserver = new ChatHistoryPreserver();
  preserver.startAsService();
}

module.exports = ChatHistoryPreserver;