/**
 * Simplify Skill - 文本简化和优化工具
 * 
 * Claude Code simplify.ts的简化移植版本
 * 提供文本简化、关键信息提取和可读性优化功能
 */

module.exports = {
  // Skill定义
  name: 'simplify',
  description: '文本简化和优化工具',
  type: 'prompt',
  aliases: ['simplifyText', 'clarify', 'summarize', 'makeSimple'],
  whenToUse: '当你需要简化复杂文本、提取关键信息或提高可读性时使用',
  argumentHint: '[文本] - 要简化的文本内容，或使用--level指定简化级别',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { text, level } = this.parseSimplifyArgs(args);
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        skill: 'simplify',
        error: '需要提供要简化的文本内容',
        example: '使用: simplify "这是一段复杂的文本..."',
        timestamp
      };
    }
    
    console.log(`📝 [Simplify Skill] 简化文本: ${text.length}字符, 级别: ${level}`);
    
    // 执行简化
    const simplified = await this.simplifyText(text, level);
    
    return {
      success: true,
      skill: 'simplify',
      level,
      timestamp,
      original: {
        length: text.length,
        preview: text.length > 100 ? text.substring(0, 100) + '...' : text
      },
      simplified: {
        length: simplified.length,
        text: simplified,
        preview: simplified.length > 150 ? simplified.substring(0, 150) + '...' : simplified
      },
      reduction: {
        characters: text.length - simplified.length,
        percentage: Math.round((1 - simplified.length / text.length) * 100)
      },
      summary: `简化完成: ${text.length} → ${simplified.length} 字符 (减少${Math.round((1 - simplified.length / text.length) * 100)}%)`
    };
  },
  
  /**
   * 解析简化参数
   */
  parseSimplifyArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let text = argsStr;
    let level = 'balanced'; // simple, balanced, comprehensive
    
    // 检查是否包含级别参数
    const levelMatch = argsStr.match(/--level\s+(\w+)/i);
    if (levelMatch) {
      level = levelMatch[1].toLowerCase();
      text = argsStr.replace(/--level\s+\w+/i, '').trim();
    }
    
    // 支持的其他参数格式
    if (argsStr.includes('--simple')) {
      level = 'simple';
      text = argsStr.replace('--simple', '').trim();
    } else if (argsStr.includes('--comprehensive')) {
      level = 'comprehensive';
      text = argsStr.replace('--comprehensive', '').trim();
    }
    
    // 清理文本
    text = text.replace(/^["']|["']$/g, '').trim();
    
    return { text, level };
  },
  
  /**
   * 文本简化算法
   */
  async simplifyText(text, level = 'balanced') {
    // 根据级别选择简化策略
    const strategies = {
      simple: this.simplifySimple.bind(this),
      balanced: this.simplifyBalanced.bind(this),
      comprehensive: this.simplifyComprehensive.bind(this)
    };
    
    const strategy = strategies[level] || strategies.balanced;
    return strategy(text);
  },
  
  /**
   * 简单简化 - 移除冗余，保留核心
   */
  simplifySimple(text) {
    console.log(`  使用简单简化策略`);
    
    // 1. 分割段落
    const paragraphs = text.split(/\n\s*\n/);
    
    // 2. 简化每个段落
    const simplifiedParagraphs = paragraphs.map(paragraph => {
      // 分割句子
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length === 0) return '';
      
      // 取前2个句子（如果是长段落）
      const importantSentences = sentences.length > 3 ? 
        [sentences[0], sentences[1]] : 
        sentences.slice(0, Math.min(2, sentences.length));
      
      // 合并
      return importantSentences
        .map(s => s.trim() + '.')
        .join(' ');
    }).filter(p => p.length > 0);
    
    // 3. 合并结果
    return simplifiedParagraphs.join('\n\n');
  },
  
  /**
   * 平衡简化 - 智能提取关键信息
   */
  simplifyBalanced(text) {
    console.log(`  使用平衡简化策略`);
    
    // 1. 识别文本类型
    const textType = this.identifyTextType(text);
    console.log(`  文本类型: ${textType}`);
    
    // 2. 根据类型应用不同简化
    switch (textType) {
      case 'technical':
        return this.simplifyTechnicalText(text);
      case 'narrative':
        return this.simplifyNarrativeText(text);
      case 'instructional':
        return this.simplifyInstructionalText(text);
      case 'conversational':
        return this.simplifyConversationalText(text);
      default:
        return this.simplifyGenericText(text);
    }
  },
  
  /**
   * 全面简化 - 深度分析和重构
   */
  simplifyComprehensive(text) {
    console.log(`  使用全面简化策略`);
    
    // 1. 提取关键概念
    const concepts = this.extractKeyConcepts(text);
    
    // 2. 识别主要论点/事实
    const points = this.extractMainPoints(text);
    
    // 3. 构建简化版本
    let result = '';
    
    if (concepts.length > 0) {
      result += `关键概念: ${concepts.join(', ')}\n\n`;
    }
    
    if (points.length > 0) {
      result += '主要内容:\n';
      points.forEach((point, index) => {
        result += `${index + 1}. ${point}\n`;
      });
    } else {
      // 回退到平衡简化
      result = this.simplifyBalanced(text);
    }
    
    return result;
  },
  
  /**
   * 识别文本类型
   */
  identifyTextType(text) {
    const lowerText = text.toLowerCase();
    
    // 检查关键词
    const checks = {
      technical: /algorithm|function|variable|parameter|code|api|debug|error|log/i,
      narrative: /story|narrate|character|plot|scene|setting|dialogue/i,
      instructional: /step|guide|tutorial|how to|instruction|procedure|method/i,
      conversational: /hello|hi|thanks|thank you|please|sorry|chat|conversation/i
    };
    
    for (const [type, regex] of Object.entries(checks)) {
      if (regex.test(lowerText)) {
        return type;
      }
    }
    
    // 基于结构判断
    const lines = text.split('\n');
    const avgLineLength = text.length / Math.max(lines.length, 1);
    
    if (avgLineLength < 50 && lines.length > 5) {
      return 'conversational';
    } else if (text.includes('1.') || text.includes('•') || text.includes('- ')) {
      return 'instructional';
    }
    
    return 'generic';
  },
  
  /**
   * 简化技术文本
   */
  simplifyTechnicalText(text) {
    // 提取技术要点
    const lines = text.split('\n');
    const technicalLines = lines.filter(line => 
      line.includes('function') || 
      line.includes('return') || 
      line.includes('const ') || 
      line.includes('let ') || 
      line.includes('var ') ||
      line.includes('=') ||
      line.includes('{') ||
      line.includes('}')
    );
    
    if (technicalLines.length > 0) {
      return technicalLines.slice(0, 10).join('\n');
    }
    
    return this.simplifyGenericText(text);
  },
  
  /**
   * 简化叙事文本
   */
  simplifyNarrativeText(text) {
    // 提取开头和关键情节
    const paragraphs = text.split(/\n\s*\n/);
    
    if (paragraphs.length >= 2) {
      return paragraphs[0] + '\n\n' + paragraphs[paragraphs.length - 1];
    }
    
    return paragraphs[0] || text.substring(0, Math.min(500, text.length));
  },
  
  /**
   * 简化指导性文本
   */
  simplifyInstructionalText(text) {
    // 提取步骤
    const steps = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // 匹配编号步骤: 1., 2., etc.
      if (line.match(/^\d+\.\s/) || line.match(/^[•\-]\s/)) {
        steps.push(line);
      }
    }
    
    if (steps.length > 0) {
      return steps.slice(0, 5).join('\n');
    }
    
    return this.simplifyGenericText(text);
  },
  
  /**
   * 简化对话文本
   */
  simplifyConversationalText(text) {
    // 提取主要对话
    const lines = text.split('\n');
    const dialogLines = lines.filter(line => 
      line.includes(':') || 
      line.startsWith('Q:') || 
      line.startsWith('A:') ||
      line.startsWith('问:') ||
      line.startsWith('答:')
    );
    
    if (dialogLines.length > 0) {
      return dialogLines.slice(0, 8).join('\n');
    }
    
    return this.simplifyGenericText(text);
  },
  
  /**
   * 简化通用文本
   */
  simplifyGenericText(text) {
    // 基本简化：取开头和结尾
    const length = text.length;
    
    if (length <= 500) {
      return text; // 已经很短了
    }
    
    // 取前200字符和后200字符
    const start = text.substring(0, 200);
    const end = text.substring(length - 200);
    
    return start + '...\n\n...' + end;
  },
  
  /**
   * 提取关键概念
   */
  extractKeyConcepts(text) {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const frequency = {};
    
    // 统计词频
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // 排序并取前5个
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  },
  
  /**
   * 提取主要论点
   */
  extractMainPoints(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const points = [];
    
    // 取重要的句子（包含关键词）
    const importantKeywords = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'critical'];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // 检查是否包含重要关键词
      const hasImportantWord = importantKeywords.some(keyword => 
        lowerSentence.includes(keyword)
      );
      
      // 或者句子较长（可能包含重要信息）
      if (hasImportantWord || sentence.length > 80) {
        points.push(sentence.trim());
      }
      
      if (points.length >= 3) break;
    }
    
    // 如果没有找到重要句子，取前3个句子
    if (points.length === 0 && sentences.length > 0) {
      return sentences.slice(0, 3).map(s => s.trim());
    }
    
    return points;
  }
};