/**
 * Claude技能系统类型定义
 */

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  category: 'utility' | 'development' | 'analysis' | 'automation';
  permission: 'user' | 'admin' | 'system';
  timeout: number;
}

export interface SkillContext {
  sessionId: string;
  requestId: string;
  userId?: string;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime: number;
}

export const DEFAULT_SKILL_CONFIG: SkillConfig = {
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  enabled: true,
  category: 'utility',
  permission: 'user',
  timeout: 30000
};
