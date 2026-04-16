/**
 * LoremIpsum Skill - 占位文本生成工具
 * 
 * Claude Code loremIpsum.ts的简化移植版本
 * 生成测试文本、演示数据和占位内容
 */

module.exports = {
  // Skill定义
  name: 'loremIpsum',
  description: '占位文本和测试数据生成工具',
  type: 'prompt',
  aliases: ['placeholder', 'filler', 'testtext', 'generatetext'],
  whenToUse: '当你需要生成测试文本、占位内容或演示数据时使用',
  argumentHint: '[长度] [类型] - 长度: 单词数/段落数, 类型: lorem/tech/code/chinese/mixed',
  
  // 允许的工具
  allowedTools: [], // 此Skill不需要外部工具
  
  // 单词库
  wordBanks: {
    // 英语常见单词 (类似原版)
    english: [
      'the', 'a', 'an', 'I', 'you', 'he', 'she', 'it', 'we', 'they',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might',
      'must', 'shall', 'should', 'make', 'made', 'get', 'got', 'go', 'went',
      'come', 'came', 'see', 'saw', 'know', 'take', 'think', 'look', 'want',
      'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need',
      'feel', 'seem', 'leave', 'put', 'time', 'year', 'day', 'way', 'man',
      'thing', 'life', 'hand', 'part', 'place', 'case', 'point', 'fact',
      'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own',
      'other', 'old', 'right', 'big', 'high', 'small', 'large', 'next',
      'early', 'young', 'few', 'public', 'bad', 'same', 'able', 'in', 'on',
      'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about', 'like',
      'through', 'over', 'before', 'between', 'under', 'since', 'without',
      'and', 'or', 'but', 'if', 'than', 'because', 'as', 'until', 'while',
      'so', 'though', 'both', 'each', 'when', 'where', 'why', 'how', 'not',
      'now', 'just', 'more', 'also', 'here', 'there', 'then', 'only', 'very',
      'well', 'back', 'still', 'even', 'much', 'too', 'such', 'never', 'again',
      'most', 'once', 'off', 'away', 'down', 'out', 'up', 'test', 'code',
      'data', 'file', 'line', 'text', 'word', 'number', 'system', 'program',
      'set', 'run', 'value', 'name', 'type', 'state', 'end', 'start'
    ],
    
    // 技术相关词汇
    technical: [
      'algorithm', 'application', 'architecture', 'authentication', 'backend',
      'bandwidth', 'browser', 'cache', 'compilation', 'configuration', 'database',
      'deployment', 'development', 'encryption', 'endpoint', 'framework', 'frontend',
      'function', 'gateway', 'implementation', 'integration', 'interface', 'library',
      'middleware', 'migration', 'module', 'optimization', 'orchestration', 'package',
      'performance', 'platform', 'protocol', 'repository', 'resolution', 'response',
      'runtime', 'scalability', 'schema', 'security', 'serialization', 'server',
      'service', 'session', 'specification', 'storage', 'synchronization', 'template',
      'throughput', 'transaction', 'validation', 'virtualization', 'workflow'
    ],
    
    // 中文常见词汇
    chinese: [
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '这', '个', '中', '上',
      '大', '为', '和', '国', '地', '到', '以', '说', '时', '要', '就', '出', '会', '可',
      '也', '对', '生', '能', '而', '子', '那', '得', '于', '着', '下', '自', '之', '年',
      '过', '发', '后', '作', '里', '用', '道', '行', '所', '然', '家', '种', '事', '成',
      '方', '多', '经', '么', '去', '法', '学', '如', '都', '同', '现', '当', '没', '动',
      '面', '起', '看', '定', '天', '分', '还', '进', '好', '小', '部', '其', '些', '主',
      '样', '理', '心', '样', '她', '本', '前', '开', '但', '因', '只', '从', '想', '实'
    ],
    
    // 代码相关词汇
    code: [
      'function', 'variable', 'constant', 'parameter', 'argument', 'return', 'import',
      'export', 'class', 'object', 'instance', 'method', 'property', 'attribute',
      'constructor', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction',
      'interface', 'implementation', 'declaration', 'definition', 'invocation',
      'execution', 'compilation', 'interpretation', 'syntax', 'semantics', 'runtime',
      'compile-time', 'type', 'value', 'reference', 'pointer', 'array', 'list', 'map',
      'set', 'queue', 'stack', 'tree', 'graph', 'algorithm', 'complexity', 'iteration',
      'recursion', 'conditional', 'loop', 'branch', 'statement', 'expression', 'operator',
      'operand', 'literal', 'identifier', 'namespace', 'scope', 'context', 'environment'
    ]
  },
  
  // 句子模板
  sentenceTemplates: {
    lorem: [
      '{{word1}} {{word2}} {{word3}} {{word4}} {{word5}}.',
      '{{word1}} {{word2}} et {{word3}} {{word4}}.',
      '{{word1}} {{word2}} {{word3}}, {{word4}} {{word5}} {{word6}}.',
      'Sed {{word1}} {{word2}} {{word3}} {{word4}}.',
      'In {{word1}} {{word2}} {{word3}} {{word4}} {{word5}}.'
    ],
    
    english: [
      'The {{word1}} {{word2}} {{word3}} {{word4}}.',
      'This {{word1}} {{word2}} {{word3}} {{word4}}.',
      '{{word1}} {{word2}} can {{word3}} {{word4}}.',
      'When {{word1}} {{word2}}, {{word3}} {{word4}}.',
      '{{word1}} {{word2}} {{word3}} with {{word4}}.'
    ],
    
    technical: [
      'The {{word1}} {{word2}} {{word3}} the {{word4}}.',
      '{{word1}} {{word2}} requires proper {{word3}} {{word4}}.',
      '{{word1}} {{word2}} implementation involves {{word3}} {{word4}}.',
      '{{word1}} {{word2}} {{word3}} provides {{word4}} {{word5}}.',
      '{{word1}} {{word2}} is essential for {{word3}} {{word4}}.'
    ],
    
    chinese: [
      '{{word1}}{{word2}}{{word3}}，{{word4}}。',
      '{{word1}}{{word2}}可以{{word3}}{{word4}}。',
      '当{{word1}}{{word2}}时，{{word3}}{{word4}}。',
      '{{word1}}{{word2}}{{word3}}的{{word4}}。',
      '{{word1}}和{{word2}}{{word3}}{{word4}}。'
    ]
  },
  
  // 执行函数
  execute: async function(args, context) {
    const timestamp = new Date().toISOString();
    
    // 解析参数
    const { length, type, unit, options } = this.parseLoremArgs(args);
    
    console.log(`📝 [LoremIpsum Skill] 长度: ${length}${unit}, 类型: ${type}, 选项: ${JSON.stringify(options)}`);
    
    // 生成文本
    const result = this.generateText(length, type, unit, options);
    
    console.log(`  生成文本: ${result.wordCount}单词, ${result.sentenceCount}句子, ${result.paragraphCount}段落`);
    
    return {
      success: true,
      skill: 'loremIpsum',
      operation: 'generate',
      length: length,
      unit: unit,
      type: type,
      text: result.text,
      metadata: {
        wordCount: result.wordCount,
        sentenceCount: result.sentenceCount,
        paragraphCount: result.paragraphCount,
        estimatedTokens: Math.ceil(result.wordCount * 1.3), // 估计token数
        generationTime: result.generationTime
      },
      summary: `生成${length}${unit} ${type}类型文本`,
      usageTips: [
        '复制文本用于测试或演示',
        '调整长度和类型以获得不同效果',
        '使用--paragraphs参数控制段落结构'
      ],
      timestamp: timestamp
    };
  },
  
  /**
   * 解析Lorem参数
   */
  parseLoremArgs(args) {
    const argsStr = args.trim();
    
    // 默认值
    let length = 100; // 默认长度
    let type = 'english'; // 类型: lorem, english, technical, chinese, code, mixed
    let unit = 'words'; // 单位: words, sentences, paragraphs
    let options = {
      includeNumbers: false,
      includePunctuation: true,
      capitalize: true,
      maxParagraphLength: 5 // 每个段落最多句子数
    };
    
    // 提取长度参数
    const lengthMatch = argsStr.match(/(\d+)/);
    if (lengthMatch) {
      length = parseInt(lengthMatch[1]);
    }
    
    // 提取单位
    if (argsStr.includes('paragraphs') || argsStr.includes('段落')) {
      unit = 'paragraphs';
    } else if (argsStr.includes('sentences') || argsStr.includes('句子')) {
      unit = 'sentences';
    } else {
      unit = 'words'; // 默认
    }
    
    // 提取类型
    if (argsStr.includes('lorem') || argsStr.includes('latin')) {
      type = 'lorem';
    } else if (argsStr.includes('tech') || argsStr.includes('technical')) {
      type = 'technical';
    } else if (argsStr.includes('chinese') || argsStr.includes('中文')) {
      type = 'chinese';
    } else if (argsStr.includes('code') || argsStr.includes('编程')) {
      type = 'code';
    } else if (argsStr.includes('mixed') || argsStr.includes('混合')) {
      type = 'mixed';
    } else {
      type = 'english'; // 默认
    }
    
    // 解析选项
    if (argsStr.includes('--no-numbers')) {
      options.includeNumbers = false;
    }
    
    if (argsStr.includes('--no-punctuation')) {
      options.includePunctuation = false;
    }
    
    if (argsStr.includes('--no-caps')) {
      options.capitalize = false;
    }
    
    if (argsStr.includes('--short-paragraphs')) {
      options.maxParagraphLength = 3;
    } else if (argsStr.includes('--long-paragraphs')) {
      options.maxParagraphLength = 8;
    }
    
    // 安全限制
    if (length > 10000) {
      length = 10000;
      console.log(`  长度限制为10000`);
    }
    
    return { length, type, unit, options };
  },
  
  /**
   * 生成文本
   */
  generateText(length, type, unit, options) {
    const startTime = Date.now();
    
    let wordCount = 0;
    let sentenceCount = 0;
    let paragraphCount = 0;
    let text = '';
    
    // 根据单位调整生成策略
    if (unit === 'words') {
      // 按单词数生成
      while (wordCount < length) {
        const paragraph = this.generateParagraph(type, options, length - wordCount);
        text += paragraph.text + '\n\n';
        wordCount += paragraph.wordCount;
        sentenceCount += paragraph.sentenceCount;
        paragraphCount++;
        
        // 控制段落数量
        if (paragraphCount >= 10 && wordCount >= length * 0.5) {
          break;
        }
      }
    } else if (unit === 'sentences') {
      // 按句子数生成
      for (let i = 0; i < length; i++) {
        const sentence = this.generateSentence(type, options);
        text += sentence;
        
        // 添加段落分隔
        if ((i + 1) % options.maxParagraphLength === 0 && i < length - 1) {
          text += '\n\n';
          paragraphCount++;
        } else if (i < length - 1) {
          text += ' ';
        }
        
        sentenceCount++;
        wordCount += this.countWords(sentence);
      }
      paragraphCount = Math.ceil(length / options.maxParagraphLength);
    } else if (unit === 'paragraphs') {
      // 按段落数生成
      for (let i = 0; i < length; i++) {
        const paragraph = this.generateParagraph(type, options, 100); // 每个段落约100单词
        text += paragraph.text;
        
        if (i < length - 1) {
          text += '\n\n';
        }
        
        wordCount += paragraph.wordCount;
        sentenceCount += paragraph.sentenceCount;
        paragraphCount++;
      }
    }
    
    // 清理文本
    text = text.trim();
    
    const generationTime = Date.now() - startTime;
    
    return {
      text,
      wordCount,
      sentenceCount,
      paragraphCount,
      generationTime
    };
  },
  
  /**
   * 生成段落
   */
  generateParagraph(type, options, targetWords = 100) {
    let paragraphText = '';
    let wordCount = 0;
    let sentenceCount = 0;
    
    // 每个段落3-8个句子
    const sentenceCountInParagraph = Math.min(
      Math.max(3, Math.floor(targetWords / 15)),
      options.maxParagraphLength
    );
    
    for (let i = 0; i < sentenceCountInParagraph; i++) {
      const sentence = this.generateSentence(type, options);
      paragraphText += sentence;
      
      if (i < sentenceCountInParagraph - 1) {
        paragraphText += ' ';
      }
      
      sentenceCount++;
      wordCount += this.countWords(sentence);
    }
    
    return {
      text: paragraphText,
      wordCount,
      sentenceCount
    };
  },
  
  /**
   * 生成句子
   */
  generateSentence(type, options) {
    let sentence = '';
    
    // 选择模板
    const templates = this.sentenceTemplates[type] || this.sentenceTemplates.english;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // 填充模板
    sentence = template;
    for (let i = 1; i <= 10; i++) {
      const placeholder = `{{word${i}}}`;
      if (sentence.includes(placeholder)) {
        const word = this.getRandomWord(type);
        sentence = sentence.replace(placeholder, word);
      }
    }
    
    // 可选：添加数字
    if (options.includeNumbers && Math.random() < 0.1) {
      const numbers = ['one', 'two', 'three', 'four', 'five', 'first', 'second', 'third'];
      const number = numbers[Math.floor(Math.random() * numbers.length)];
      sentence = sentence.replace(/\.$/, ` ${number}.`);
    }
    
    // 处理首字母大写
    if (options.capitalize) {
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    
    // 处理标点
    if (!options.includePunctuation) {
      sentence = sentence.replace(/[.,!?;:]$/, '');
    }
    
    return sentence;
  },
  
  /**
   * 获取随机单词
   */
  getRandomWord(type) {
    let wordBank = this.wordBanks.english;
    
    if (type === 'lorem') {
      // 拉丁风格单词
      const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 
                         'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
                         'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
                         'aliqua', 'enim', 'minim', 'veniam'];
      return loremWords[Math.floor(Math.random() * loremWords.length)];
    } else if (type === 'technical') {
      // 技术词汇混合
      const techMix = [...this.wordBanks.english, ...this.wordBanks.technical];
      wordBank = techMix;
    } else if (type === 'chinese') {
      wordBank = this.wordBanks.chinese;
    } else if (type === 'code') {
      wordBank = this.wordBanks.code;
    } else if (type === 'mixed') {
      // 混合所有类型
      const allWords = [
        ...this.wordBanks.english,
        ...this.wordBanks.technical,
        ...this.wordBanks.chinese.filter(w => w.length > 1), // 过滤单字
        ...this.wordBanks.code
      ];
      wordBank = allWords;
    }
    
    return wordBank[Math.floor(Math.random() * wordBank.length)];
  },
  
  /**
   * 计算单词数
   */
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  },
  
  /**
   * 显示帮助
   */
  showHelp() {
    return {
      success: true,
      skill: 'loremIpsum',
      operation: 'help',
      help: {
        description: '占位文本和测试数据生成工具',
        usage: 'loremIpsum [长度] [类型] [选项]',
        examples: [
          'loremIpsum 100',
          'loremIpsum 50 technical',
          'loremIpsum 3 paragraphs',
          'loremIpsum 200 chinese',
          'loremIpsum 10 sentences --no-caps'
        ],
        types: [
          { name: 'english', description: '英语普通文本 (默认)' },
          { name: 'lorem', description: '拉丁风格占位文本' },
          { name: 'technical', description: '技术文档风格' },
          { name: 'chinese', description: '中文文本' },
          { name: 'code', description: '编程相关词汇' },
          { name: 'mixed', description: '混合类型' }
        ],
        units: [
          { name: 'words', description: '单词数 (默认)' },
          { name: 'sentences', description: '句子数' },
          { name: 'paragraphs', description: '段落数' }
        ],
        options: [
          { option: '--no-numbers', description: '不包含数字' },
          { option: '--no-punctuation', description: '不包含标点' },
          { option: '--no-caps', description: '不大写首字母' },
          { option: '--short-paragraphs', description: '短段落 (每段3句子)' },
          { option: '--long-paragraphs', description: '长段落 (每段8句子)' }
        ],
        tips: [
          '默认生成100单词英语文本',
          '最大长度限制为10000单词',
          '中文类型使用中文词汇生成',
          '技术类型适合文档和演示'
        ]
      },
      summary: '占位文本生成工具 - 创建测试内容和演示数据',
      timestamp: new Date().toISOString()
    };
  }
};