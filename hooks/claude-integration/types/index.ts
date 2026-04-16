/**
 * Claude Hooks系统类型定义
 */

export interface HookConfig {
  name: string;
  enabled: boolean;
  priority: number;
  timeout: number;
}

export interface HookContext {
  requestId: string;
  sessionId?: string;
  userId?: string;
  operation: string;
  input: any;
  metadata?: Record<string, any>;
}

export interface HookResult {
  success: boolean;
  output?: any;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  executionTime: number;
}

export const DEFAULT_HOOK_CONFIG: HookConfig = {
  name: '',
  enabled: true,
  priority: 0,
  timeout: 5000
};
