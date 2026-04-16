/**
 * 团队协作系统 - TypeScript版
 * 多用户会话、权限管理、协作编辑
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
}

export interface CollaborationSession {
  id: string;
  name: string;
  description?: string;
  owner: User;
  participants: Map<string, User>;
  createdAt: Date;
  updatedAt: Date;
  settings: SessionSettings;
  state: SessionState;
}

export interface SessionSettings {
  maxParticipants: number;
  allowAnonymous: boolean;
  requireApproval: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  fileSharingEnabled: boolean;
}

export interface SessionState {
  isActive: boolean;
  currentActivity?: string;
  lastActivity: Date;
  messageCount: number;
  fileCount: number;
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  sender: User;
  type: 'text' | 'file' | 'command' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FileShare {
  id: string;
  sessionId: string;
  uploader: User;
  filename: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
  downloadCount: number;
}

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private messages: Map<string, CollaborationMessage[]> = new Map();
  private files: Map<string, FileShare[]> = new Map();
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds
  
  constructor() {
    console.log('🚀 团队协作管理器初始化');
  }
  
  async createSession(config: {
    name: string;
    owner: User;
    description?: string;
    settings?: Partial<SessionSettings>;
  }): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: SessionSettings = {
      maxParticipants: 50,
      allowAnonymous: false,
      requireApproval: true,
      recordingEnabled: true,
      chatEnabled: true,
      fileSharingEnabled: true,
      ...config.settings
    };
    
    const session: CollaborationSession = {
      id: sessionId,
      name: config.name,
      description: config.description,
      owner: config.owner,
      participants: new Map([[config.owner.id, config.owner]]),
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: defaultSettings,
      state: {
        isActive: true,
        lastActivity: new Date(),
        messageCount: 0,
        fileCount: 0
      }
    };
    
    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);
    this.files.set(sessionId, []);
    
    // 更新用户会话映射
    if (!this.userSessions.has(config.owner.id)) {
      this.userSessions.set(config.owner.id, new Set());
    }
    this.userSessions.get(config.owner.id)!.add(sessionId);
    
    console.log(`✅ 创建协作会话: ${sessionId} (${config.name})`);
    return sessionId;
  }
  
  async joinSession(sessionId: string, user: User): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ 会话不存在: ${sessionId}`);
      return false;
    }
    
    // 检查会话是否活跃
    if (!session.state.isActive) {
      console.error(`❌ 会话已关闭: ${sessionId}`);
      return false;
    }
    
    // 检查参与者限制
    if (session.participants.size >= session.settings.maxParticipants) {
      console.error(`❌ 会话已满: ${sessionId}`);
      return false;
    }
    
    // 如果需要审批
    if (session.settings.requireApproval && user.role === 'guest') {
      console.log(`⏳ 等待审批: ${user.name} 加入会话 ${sessionId}`);
      // 这里可以发送审批请求给会话所有者
      return false;
    }
    
    // 添加参与者
    session.participants.set(user.id, user);
    session.updatedAt = new Date();
    
    // 更新用户会话映射
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set());
    }
    this.userSessions.get(user.id)!.add(sessionId);
    
    // 发送系统消息
    await this.sendSystemMessage(sessionId, `${user.name} 加入了会话`);
    
    console.log(`✅ ${user.name} 加入会话: ${sessionId}`);
    return true;
  }
  
  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`❌ 会话不存在: ${sessionId}`);
      return false;
    }
    
    const user = session.participants.get(userId);
    if (!user) {
      console.error(`❌ 用户不在会话中: ${userId}`);
      return false;
    }
    
    // 移除参与者
    session.participants.delete(userId);
    session.updatedAt = new Date();
    
    // 更新用户会话映射
    if (this.userSessions.has(userId)) {
      this.userSessions.get(userId)!.delete(sessionId);
    }
    
    // 如果是所有者离开，需要转移所有权或关闭会话
    if (userId === session.owner.id && session.participants.size > 0) {
      // 转移给第一个管理员或成员
      const newOwner = Array.from(session.participants.values())
        .find(u => u.role === 'admin') || 
        Array.from(session.participants.values())[0];
      
      if (newOwner) {
        session.owner = newOwner;
        await this.sendSystemMessage(sessionId, `${newOwner.name} 成为新的会话所有者`);
      }
    }
    
    // 如果没有人了，关闭会话
    if (session.participants.size === 0) {
      await this.closeSession(sessionId);
    } else {
      await this.sendSystemMessage(sessionId, `${user.name} 离开了会话`);
    }
    
    console.log(`✅ ${user.name} 离开会话: ${sessionId}`);
    return true;
  }
  
  async sendMessage(sessionId: string, message: Omit<CollaborationMessage, 'id' | 'sessionId' | 'timestamp'>): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }
    
    // 检查发送者是否在会话中
    if (!session.participants.has(message.sender.id)) {
      throw new Error(`发送者不在会话中: ${message.sender.id}`);
    }
    
    // 检查聊天是否启用
    if (!session.settings.chatEnabled && message.type === 'text') {
      throw new Error('会话聊天功能已禁用');
    }
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullMessage: CollaborationMessage = {
      ...message,
      id: messageId,
      sessionId,
      timestamp: new Date()
    };
    
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(fullMessage);
    this.messages.set(sessionId, sessionMessages);
    
    session.state.lastActivity = new Date();
    session.state.messageCount++;
    session.updatedAt = new Date();
    
    console.log(`📨 消息发送: ${sessionId} - ${message.sender.name}: ${message.content.substring(0, 50)}...`);
    return messageId;
  }
  
  async sendSystemMessage(sessionId: string, content: string): Promise<string> {
    const systemUser: User = {
      id: 'system',
      name: '系统',
      role: 'admin',
      joinedAt: new Date()
    };
    
    return this.sendMessage(sessionId, {
      sender: systemUser,
      type: 'system',
      content
    });
  }
  
  async shareFile(sessionId: string, file: Omit<FileShare, 'id' | 'sessionId' | 'uploadedAt' | 'downloadCount'>): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }
    
    // 检查文件分享是否启用
    if (!session.settings.fileSharingEnabled) {
      throw new Error('会话文件分享功能已禁用');
    }
    
    // 检查上传者是否在会话中
    if (!session.participants.has(file.uploader.id)) {
      throw new Error(`上传者不在会话中: ${file.uploader.id}`);
    }
    
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullFile: FileShare = {
      ...file,
      id: fileId,
      sessionId,
      uploadedAt: new Date(),
      downloadCount: 0
    };
    
    const sessionFiles = this.files.get(sessionId) || [];
    sessionFiles.push(fullFile);
    this.files.set(sessionId, sessionFiles);
    
    session.state.lastActivity = new Date();
    session.state.fileCount++;
    session.updatedAt = new Date();
    
    // 发送系统消息通知
    await this.sendSystemMessage(sessionId, `${file.uploader.name} 分享了文件: ${file.filename}`);
    
    console.log(`📎 文件分享: ${sessionId} - ${file.uploader.name}: ${file.filename}`);
    return fileId;
  }
  
  async getSessionMessages(sessionId: string, limit = 100, offset = 0): Promise<CollaborationMessage[]> {
    const messages = this.messages.get(sessionId) || [];
    return messages.slice(offset, offset + limit).reverse(); // 最新的在前
  }
  
  async getSessionFiles(sessionId: string): Promise<FileShare[]> {
    return this.files.get(sessionId) || [];
  }
  
  async getSessionParticipants(sessionId: string): Promise<User[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return Array.from(session.participants.values());
  }
  
  async getUserSessions(userId: string): Promise<CollaborationSession[]> {
    const sessionIds = this.userSessions.get(userId) || new Set();
    const sessions: CollaborationSession[] = [];
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }
  
  async updateSessionSettings(sessionId: string, settings: Partial<SessionSettings>): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.settings = { ...session.settings, ...settings };
    session.updatedAt = new Date();
    
    console.log(`⚙️ 更新会话设置: ${sessionId}`);
    return true;
  }
  
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.state.isActive = false;
    session.updatedAt = new Date();
    
    // 从所有用户的会话映射中移除
    for (const userId of session.participants.keys()) {
      if (this.userSessions.has(userId)) {
        this.userSessions.get(userId)!.delete(sessionId);
      }
    }
    
    await this.sendSystemMessage(sessionId, '会话已结束');
    
    console.log(`🛑 关闭会话: ${sessionId}`);
    return true;
  }
  
  async getSessionStats(sessionId: string): Promise<{
    participantCount: number;
    messageCount: number;
    fileCount: number;
    duration: number; // 分钟
    activityLevel: 'high' | 'medium' | 'low';
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }
    
    const duration = (Date.now() - session.createdAt.getTime()) / (1000 * 60); // 分钟
    
    // 计算活动级别
    const messagesPerHour = session.state.messageCount / (duration / 60);
    let activityLevel: 'high' | 'medium' | 'low' = 'low';
    if (messagesPerHour > 20) activityLevel = 'high';
    else if (messagesPerHour > 5) activityLevel = 'medium';
    
    return {
      participantCount: session.participants.size,
      messageCount: session.state.messageCount,
      fileCount: session.state.fileCount,
      duration: Math.round(duration),
      activityLevel
    };
  }
  
  async broadcastToSession(sessionId: string, message: string, excludeUserId?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    console.log(`📢 广播消息到会话 ${sessionId}: ${message.substring(0, 50)}...`);
    
    // 这里可以实现WebSocket广播等实时通信
    // 当前为模拟实现
  }
  
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.state.isActive);
  }
  
  getSessionCount(): number {
    return this.sessions.size;
  }
  
  getUserCount(): number {
    return this.userSessions.size;
  }
  
  cleanupInactiveSessions(maxAgeHours = 24): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.state.isActive && session.updatedAt.getTime() < cutoffTime) {
        // 清理不活跃的已关闭会话
        this.sessions.delete(sessionId);
        this.messages.delete(sessionId);
        this.files.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个不活跃会话`);
    }
    
    return cleanedCount;
  }
}

// 导出工厂函数
export function createCollaborationManager() {
  return new CollaborationManager();
}

// 导出类型
export type {
  User,
  CollaborationSession,
  CollaborationMessage,
  FileShare,
  SessionSettings,
  SessionState
};