/**
 * Claude集成钩子处理器 - 增强版
 * 
 * 将Claude 4.6核心组件（包括安全护栏）集成到OpenClaw运行时
 */

const path = require('path');
const fs = require('fs').promises;

// Claude核心组件
let claudeCore = null;
let initialized = false;

/**
 * 初始化Claude核心组件（带安全护栏）
 */
async function initializeClaudeCore() {
  if (initialized) return;
  
  try {
    // 尝试从工作空间加载Claude核心组件
    const claudeCorePath = path.join(process.cwd(), 'claude-core-porting', 'src', 'index.js');
    
    // 检查路径是否存在
    try {
      await fs.access(claudeCorePath);
    } catch (error) {
      console.error('[ClaudeHook] Claude核心组件未找到:', claudeCorePath);
      console.error('[ClaudeHook] 请确保claude-core-porting项目在工作空间根目录');
      return;
    }
    
    // 动态导入Claude核心组件
    const { ClaudeCorePorting, OpenClawAdapter } = require(claudeCorePath);
    
    // 初始化核心组件（启用安全护栏）
    claudeCore = new ClaudeCorePorting({
      enableErrorClassification: true,
      enableContextCompression: true,
      enableToolValidation: true,
      enableSafetyGuardrails: true,  // 启用安全护栏
      enableCodeSandbox: true,
      enableMemoryRetrieval: true,
      securityLevel: 'moderate',     // 中等安全级别
      logLevel: 'info'
    });
    
    // 注册OpenClaw工具定义
    registerOpenClawTools();
    
    initialized = true;
    console.log('[ClaudeHook] Claude核心组件初始化完成（包含安全护栏）');
    
    // 显示安全护栏状态
    const status = claudeCore.getStatus();
    if (status.components.safetyGuardrails) {
      console.log('[ClaudeHook] 安全护栏已启用，安全级别:', status.options.securityLevel);
      console.log('[ClaudeHook] 安全组件:', status.components.safetyGuardrails.stats?.byCategory || {});
    }
    
  } catch (error) {
    console.error('[ClaudeHook] Claude核心组件初始化失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 注册OpenClaw工具定义
 */
function registerOpenClawTools() {
  if (!claudeCore) return;
  
  const openClawTools = [
    {
      name: 'exec',
      description: '执行系统命令',
      version: '1.0.0',
      parameters: {
        command: {
          type: 'string',
          required: true,
          description: '要执行的命令'
        },
        workdir: {
          type: 'string',
          required: false,
          description: '工作目录'
        },
        env: {
          type: 'object',
          required: false,
          description: '环境变量'
        }
      },
      requiredPermissions: ['execute']
    },
    {
      name: 'read',
      description: '读取文件',
      version: '1.0.0',
      parameters: {
        path: {
          type: 'string',
          required: true,
          description: '文件路径'
        },
        offset: {
          type: 'number',
          required: false,
          description: '起始偏移'
        },
        limit: {
          type: 'number',
          required: false,
          description: '读取限制'
        }
      },
      requiredPermissions: ['read']
    },
    {
      name: 'write',
      description: '写入文件',
      version: '1.0.0',
      parameters: {
        path: {
          type: 'string',
          required: true,
          description: '文件路径'
        },
        content: {
          type: 'string',
          required: true,
          description: '文件内容'
        }
      },
      requiredPermissions: ['write']
    },
    {
      name: 'edit',
      description: '编辑文件',
      version: '1.0.0',
      parameters: {
        path: {
          type: 'string',
          required: true,
          description: '文件路径'
        },
        edits: {
          type: 'array',
          required: true,
          description: '编辑操作'
        }
      },
      requiredPermissions: ['write']
    }
  ];
  
  openClawTools.forEach(tool => {
    try {
      claudeCore.registerTool(tool.name, tool);
      console.log(`[ClaudeHook] 注册工具: ${tool.name}`);
    } catch (error) {
      console.error(`[ClaudeHook] 注册工具失败 ${tool.name}:`, error.message);
    }
  });
}

/**
 * 检查消息类型
 */
function determineMessageType(messageBody, context = {}) {
  // 检查是否是工具调用
  if (containsToolCall(messageBody)) {
    return 'tool_call';
  }
  
  // 检查是否是AI输出（如果是助手消息）
  if (context.isAssistantMessage) {
    return 'output';
  }
  
  // 否则是用户输入
  return 'input';
}

/**
 * 检查消息中是否包含工具调用
 */
function containsToolCall(messageBody) {
  if (!messageBody) return false;
  
  // 简单的工具调用检测
  const toolCallPatterns = [
    /tool.*call/i,
    /exec.*command/i,
    /read.*file/i,
    /write.*file/i,
    /edit.*file/i,
    /运行.*命令/i,
    /执行.*代码/i,
    /\b(exec|read|write|edit|process|message|tts)\b.*\(/i  // 检测函数调用模式
  ];
  
  return toolCallPatterns.some(pattern => pattern.test(messageBody));
}

/**
 * 提取工具调用信息
 */
function extractToolCallInfo(messageBody) {
  // 简化的工具调用解析
  // 在实际应用中，这里应该解析实际的工具调用结构
  const toolCall = {
    tool: 'unknown',
    parameters: {},
    detected: false
  };
  
  if (messageBody.includes('exec') || messageBody.includes('执行') || messageBody.includes('命令')) {
    toolCall.tool = 'exec';
    toolCall.detected = true;
    
    // 简单提取命令
    const commandMatch = messageBody.match(/(?:exec|执行|命令)[:\s]+(['"]?)([^'"\n]+)\1/i);
    if (commandMatch) {
      toolCall.parameters.command = commandMatch[2];
    }
  }
  
  if (messageBody.includes('read') || messageBody.includes('读取')) {
    toolCall.tool = 'read';
    toolCall.detected = true;
  }
  
  if (messageBody.includes('write') || messageBody.includes('写入')) {
    toolCall.tool = 'write';
    toolCall.detected = true;
  }
  
  if (messageBody.includes('edit') || messageBody.includes('编辑')) {
    toolCall.tool = 'edit';
    toolCall.detected = true;
  }
  
  return toolCall;
}

/**
 * 主处理器函数
 */
const handler = async (event) => {
  try {
    // 初始化Claude核心组件
    if (!initialized) {
      await initializeClaudeCore();
    }
    
    // 处理不同事件类型
    switch (event.type) {
      case 'gateway:startup':
        console.log('[ClaudeHook] Gateway启动，初始化Claude组件');
        await initializeClaudeCore();
        break;
        
      case 'message:preprocessed':
        await handleMessagePreprocessed(event);
        break;
        
      case 'command':
        await handleCommand(event);
        break;
        
      case 'tool:called':
        await handleToolCalled(event);
        break;
        
      case 'agent:response':
        await handleAgentResponse(event);
        break;
        
      default:
        // 忽略其他事件
        break;
    }
    
  } catch (error) {
    console.error('[ClaudeHook] 处理器错误:', error.message);
    console.error(error.stack);
    
    // 如果启用了错误处理，尝试分类和处理错误
    if (claudeCore && claudeCore.classifyError) {
      await handleError(error, { eventType: event.type });
    }
  }
};

/**
 * 处理预处理消息 - 增强安全检查
 */
async function handleMessagePreprocessed(event) {
  if (!claudeCore || !event.context || !event.context.bodyForAgent) {
    return;
  }
  
  const messageBody = event.context.bodyForAgent;
  const from = event.context.from || 'unknown';
  const context = event.context;
  
  // 确定消息类型
  const messageType = determineMessageType(messageBody, context);
  console.log(`[ClaudeHook] 消息预处理，用户: ${from}, 类型: ${messageType}`);
  
  // 执行安全检查
  const safetyCheck = await claudeCore.checkSafety({
    type: messageType,
    content: messageBody,
    context: {
      userId: from,
      permissions: context.permissions || ['read', 'write', 'execute'],
      environment: 'openclaw',
      timestamp: new Date().toISOString()
    }
  });
  
  // 记录安全检查结果
  console.log(`[ClaudeHook] 安全检查结果: 分数=${safetyCheck.score.toFixed(3)}, 安全=${safetyCheck.safe}, 阻止=${safetyCheck.blocked}`);
  
  // 如果被阻止，添加警告消息
  if (safetyCheck.blocked) {
    console.log(`[ClaudeHook] ⚠️ 消息被安全护栏阻止: ${from}`);
    
    let warningMessage = `⚠️ **安全警告**: 检测到潜在危险内容，已被Claude安全系统阻止。`;
    
    // 添加具体原因
    if (safetyCheck.violations && safetyCheck.violations.length > 0) {
      const violation = safetyCheck.violations[0];
      warningMessage += `\n原因: ${violation.message}`;
    }
    
    // 添加到消息数组
    if (event.messages && Array.isArray(event.messages)) {
      event.messages.push(warningMessage);
    }
    
    // 标记为已阻止
    event.blocked = true;
    event.blockReason = safetyCheck.violations?.[0]?.message || '安全护栏阻止';
    return;
  }
  
  // 如果有警告但未被阻止
  if (safetyCheck.warnings && safetyCheck.warnings.length > 0) {
    console.log(`[ClaudeHook] ⚠️ 消息有安全警告: ${from}`);
    
    // 可以记录警告，但不阻止消息
    for (const warning of safetyCheck.warnings) {
      console.log(`[ClaudeHook] 警告: ${warning.message} (${warning.severity})`);
    }
    
    // 可选：添加温和警告到消息
    if (safetyCheck.warnings.some(w => w.severity === 'medium')) {
      const warningNote = `⚠️ **注意**: Claude安全系统检测到潜在问题，请谨慎对待。`;
      if (event.messages && Array.isArray(event.messages)) {
        event.messages.push(warningNote);
      }
    }
  }
  
  // 如果是工具调用，进行额外验证
  if (messageType === 'tool_call' && claudeCore.validateToolCall) {
    const toolCall = extractToolCallInfo(messageBody);
    
    if (toolCall.detected) {
      console.log(`[ClaudeHook] 检测到工具调用: ${toolCall.tool}`);
      
      const validationContext = {
        userId: from,
        permissions: context.permissions || ['read', 'write', 'execute'],
        operation: 'tool_execution',
        environment: 'openclaw'
      };
      
      const validation = claudeCore.validateToolCall(toolCall, validationContext);
      
      if (!validation.success) {
        console.log(`[ClaudeHook] 工具调用验证失败: ${validation.overall?.issues?.[0]?.issue || '未知问题'}`);
        
        // 添加验证失败警告
        const validationWarning = `⚠️ **工具安全警告**: 检测到潜在危险工具调用，建议避免执行。`;
        
        if (event.messages && Array.isArray(event.messages)) {
          event.messages.push(validationWarning);
        }
      } else {
        console.log(`[ClaudeHook] 工具调用验证通过: ${toolCall.tool}`);
      }
    }
  }
  
  // 检查消息长度，考虑上下文压缩
  if (messageBody.length > 1000) {
    console.log(`[ClaudeHook] 长消息检测 (${messageBody.length} 字符)，考虑上下文压缩`);
    
    // 在实际实现中，这里会跟踪会话上下文并进行压缩
    // 当前仅记录，后续实现完整压缩逻辑
  }
}

/**
 * 处理工具调用事件
 */
async function handleToolCalled(event) {
  if (!claudeCore || !event.toolName) {
    return;
  }
  
  console.log(`[ClaudeHook] 工具调用事件: ${event.toolName}`);
  
  // 对实际工具调用进行安全检查
  const safetyCheck = await claudeCore.checkSafety({
    type: 'tool_call',
    toolName: event.toolName,
    toolArgs: event.toolArgs || {},
    content: '',
    context: {
      userId: event.userId || 'unknown',
      permissions: event.permissions || ['read', 'write', 'execute'],
      operation: 'tool_execution',
      environment: 'openclaw'
    }
  });
  
  // 记录安全检查结果
  console.log(`[ClaudeHook] 工具安全检查: ${event.toolName}, 分数=${safetyCheck.score.toFixed(3)}, 安全=${safetyCheck.safe}`);
  
  // 如果被阻止，设置阻止标志
  if (safetyCheck.blocked) {
    console.log(`[ClaudeHook] ⚠️ 工具调用被阻止: ${event.toolName}`);
    event.blocked = true;
    event.blockReason = safetyCheck.violations?.[0]?.message || '工具安全阻止';
    
    // 如果需要审批
    if (safetyCheck.requiresApproval) {
      console.log(`[ClaudeHook] 工具调用需要审批: ${event.toolName}, 原因: ${safetyCheck.approvalReason}`);
      event.requiresApproval = true;
      event.approvalReason = safetyCheck.approvalReason;
    }
  }
}

/**
 * 处理AI响应事件
 */
async function handleAgentResponse(event) {
  if (!claudeCore || !event.response) {
    return;
  }
  
  console.log(`[ClaudeHook] AI响应事件，长度: ${event.response.length} 字符`);
  
  // 对AI输出进行安全检查
  const safetyCheck = await claudeCore.checkSafety({
    type: 'output',
    content: event.response,
    context: {
      userId: event.userId || 'unknown',
      source: 'ai_assistant',
      environment: 'openclaw'
    }
  });
  
  // 记录安全检查结果
  console.log(`[ClaudeHook] 输出安全检查: 分数=${safetyCheck.score.toFixed(3)}, 安全=${safetyCheck.safe}`);
  
  // 如果有问题但未被阻止，可以考虑添加标记
  if (safetyCheck.sanitizedText && safetyCheck.sanitizedText !== event.response) {
    console.log(`[ClaudeHook] 输出被清理，原始长度: ${event.response.length}, 清理后: ${safetyCheck.sanitizedText.length}`);
    
    // 使用清理后的文本
    event.response = safetyCheck.sanitizedText;
  }
  
  // 如果有严重问题，考虑标记响应
  if (safetyCheck.violations && safetyCheck.violations.length > 0) {
    const seriousViolations = safetyCheck.violations.filter(v => v.severity === 'critical' || v.severity === 'high');
    if (seriousViolations.length > 0) {
      console.log(`[ClaudeHook] ⚠️ AI输出有严重问题: ${seriousViolations[0].message}`);
      // 可以标记响应需要审查
      event.needsReview = true;
      event.reviewReasons = seriousViolations.map(v => v.message);
    }
  }
}

/**
 * 处理命令事件
 */
async function handleCommand(event) {
  if (!claudeCore || !event.action) {
    return;
  }
  
  // 处理特定命令
  switch (event.action) {
    case 'new':
      console.log('[ClaudeHook] 新会话创建，重置Claude组件状态');
      if (claudeCore.resetAll) {
        claudeCore.resetAll();
      }
      break;
      
    case 'reset':
      console.log('[ClaudeHook] 会话重置，重置Claude组件状态');
      if (claudeCore.resetAll) {
        claudeCore.resetAll();
      }
      break;
      
    case 'status':
      console.log('[ClaudeHook] 状态查询');
      if (claudeCore.getStatus) {
        const status = claudeCore.getStatus();
        console.log('[ClaudeHook] Claude组件状态:', {
          initialized: status.initialized,
          components: Object.keys(status.components),
          securityLevel: status.options.securityLevel
        });
        
        // 返回状态信息
        event.status = status;
      }
      break;
      
    default:
      // 忽略其他命令
      break;
  }
}

/**
 * 处理错误
 */
async function handleError(error, context = {}) {
  if (!claudeCore || !claudeCore.classifyError) {
    return null;
  }
  
  try {
    const classification = claudeCore.classifyError(error, context);
    
    console.log(`[ClaudeHook] 错误分类: ${classification.classification.type?.code || 'unclassified'}`);
    console.log(`[ClaudeHook] 严重程度: ${classification.classification.type?.severity || 'unknown'}`);
    
    if (classification.recovery && claudeCore.handleError) {
      const recoveryResult = await claudeCore.handleError(classification, {
        retryAvailable: true,
        maxRetries: 3
      });
      
      console.log(`[ClaudeHook] 错误恢复: ${recoveryResult.success ? '成功' : '失败'}`);
      return recoveryResult;
    }
    
    return classification;
  } catch (error) {
    console.error('[ClaudeHook] 错误处理失败:', error.message);
    return null;
  }
}

// 导出处理器
module.exports = handler;