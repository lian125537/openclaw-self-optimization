/**
 * SemanticTagSystem - 语义标签系统
 * 实现 VCP 的语义标签功能，支持标签索引、检索和相关性计算
 */

const EventEmitter = require('events');

class SemanticTagSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 配置
    this.config = {
      similarityThreshold: options.similarityThreshold || 0.7,
      maxTagsPerResource: options.maxTagsPerResource || 20,
      enableFuzzyMatch: options.enableFuzzyMatch !== false,
      cacheSize: options.cacheSize || 1000,
      debug: options.debug || false,
      ...options
    };
    
    // 数据结构
    this.tags = new Map(); // tagName -> { resources: Set, metadata }
    this.resources = new Map(); // resourceId -> { tags: Set, content, metadata }
    this.tagGraph = new Map(); // tagName -> Map<tagName, weight>
    
    // 缓存
    this.searchCache = new Map();
    this.similarityCache = new Map();
    
    // 统计
    this.stats = {
      tagsCreated: 0,
      resourcesIndexed: 0,
      searchesPerformed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      similarityCalculations: 0
    };
    
    // 初始化标准标签
    this.initializeStandardTags();
    
    console.log('🔖 SemanticTagSystem 初始化完成');
  }
  
  /**
   * 初始化标准标签
   */
  initializeStandardTags() {
    const standardTags = {
      // 技术相关
      'programming': { category: 'technical', weight: 1.0 },
      'ai': { category: 'technical', weight: 1.0 },
      'system': { category: 'technical', weight: 1.0 },
      'web': { category: 'technical', weight: 0.9 },
      'mobile': { category: 'technical', weight: 0.9 },
      'database': { category: 'technical', weight: 0.9 },
      'javascript': { category: 'technical', weight: 0.8 },
      'python': { category: 'technical', weight: 0.8 },
      'java': { category: 'technical', weight: 0.8 },
      
      // 项目相关
      'project': { category: 'work', weight: 1.0 },
      'urgent': { category: 'work', weight: 1.2 },
      'important': { category: 'work', weight: 1.1 },
      'planning': { category: 'work', weight: 0.8 },
      'review': { category: 'work', weight: 0.8 },
      'bug': { category: 'work', weight: 1.0 },
      'feature': { category: 'work', weight: 0.9 },
      
      // 内容类型
      'documentation': { category: 'content', weight: 0.9 },
      'tutorial': { category: 'content', weight: 0.9 },
      'example': { category: 'content', weight: 0.8 },
      'reference': { category: 'content', weight: 1.0 },
      'article': { category: 'content', weight: 0.9 },
      'blog': { category: 'content', weight: 0.8 },
      
      // 个人相关
      'personal': { category: 'personal', weight: 1.0 },
      'memory': { category: 'personal', weight: 1.0 },
      'learning': { category: 'personal', weight: 0.9 },
      'creative': { category: 'personal', weight: 0.9 },
      'idea': { category: 'personal', weight: 0.8 },
      'thought': { category: 'personal', weight: 0.8 },
      
      // 时间相关
      'recent': { category: 'temporal', weight: 1.1 },
      'historical': { category: 'temporal', weight: 0.9 },
      'future': { category: 'temporal', weight: 0.8 },
      'today': { category: 'temporal', weight: 1.2 },
      'yesterday': { category: 'temporal', weight: 1.0 },
      'week': { category: 'temporal', weight: 0.9 },
      
      // VCP 相关
      'vcp': { category: 'vcp', weight: 1.0 },
      'coordinator': { category: 'vcp', weight: 1.0 },
      'semantic': { category: 'vcp', weight: 1.0 },
      'memory': { category: 'vcp', weight: 1.0 },
      'agent': { category: 'vcp', weight: 1.0 }
    };
    
    for (const [tag, metadata] of Object.entries(standardTags)) {
      this.createTag(tag, metadata);
    }
    
    console.log(`📚 初始化了 ${Object.keys(standardTags).length} 个标准标签`);
  }
  
  /**
   * 创建标签
   */
  createTag(tagName, metadata = {}) {
    if (this.tags.has(tagName)) {
      return this.tags.get(tagName);
    }
    
    const tag = {
      name: tagName,
      resources: new Set(),
      metadata: {
        created: new Date(),
        accessed: new Date(),
        accessCount: 0,
        ...metadata
      }
    };
    
    this.tags.set(tagName, tag);
    this.tagGraph.set(tagName, new Map());
    this.stats.tagsCreated++;
    
    this.emit('tagCreated', tag);
    
    if (this.config.debug) {
      console.log(`🏷️  创建标签: ${tagName}`);
    }
    
    return tag;
  }
  
  /**
   * 索引资源
   */
  indexResource(resourceId, content, tags = [], metadata = {}) {
    if (this.resources.has(resourceId)) {
      // 更新现有资源
      return this.updateResource(resourceId, content, tags, metadata);
    }
    
    // 限制标签数量
    const limitedTags = tags.slice(0, this.config.maxTagsPerResource);
    
    const resource = {
      id: resourceId,
      content: content,
      tags: new Set(limitedTags),
      metadata: {
        indexed: new Date(),
        updated: new Date(),
        accessCount: 0,
        ...metadata
      }
    };
    
    this.resources.set(resourceId, resource);
    this.stats.resourcesIndexed++;
    
    // 更新标签的资源集合
    limitedTags.forEach(tagName => {
      const tag = this.getOrCreateTag(tagName);
      tag.resources.add(resourceId);
      tag.metadata.accessed = new Date();
      tag.metadata.accessCount = (tag.metadata.accessCount || 0) + 1;
    });
    
    // 更新标签图
    this.updateTagGraph(limitedTags);
    
    this.emit('resourceIndexed', resource);
    
    if (this.config.debug) {
      console.log(`📄 索引资源: ${resourceId} (${limitedTags.length}个标签)`);
    }
    
    return resource;
  }
  
  /**
   * 更新资源
   */
  updateResource(resourceId, content, tags = [], metadata = {}) {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`资源不存在: ${resourceId}`);
    }
    
    // 移除旧标签关联
    resource.tags.forEach(oldTag => {
      const tag = this.tags.get(oldTag);
      if (tag) {
        tag.resources.delete(resourceId);
      }
    });
    
    // 更新资源
    const limitedTags = tags.slice(0, this.config.maxTagsPerResource);
    resource.content = content;
    resource.tags = new Set(limitedTags);
    resource.metadata.updated = new Date();
    resource.metadata.accessCount = (resource.metadata.accessCount || 0) + 1;
    Object.assign(resource.metadata, metadata);
    
    // 添加新标签关联
    limitedTags.forEach(tagName => {
      const tag = this.getOrCreateTag(tagName);
      tag.resources.add(resourceId);
      tag.metadata.accessed = new Date();
      tag.metadata.accessCount = (tag.metadata.accessCount || 0) + 1;
    });
    
    // 更新标签图
    this.updateTagGraph(limitedTags);
    
    this.emit('resourceUpdated', resource);
    
    return resource;
  }
  
  /**
   * 获取或创建标签
   */
  getOrCreateTag(tagName) {
    if (this.tags.has(tagName)) {
      return this.tags.get(tagName);
    }
    
    return this.createTag(tagName);
  }
  
  /**
   * 更新标签图
   */
  updateTagGraph(tags) {
    if (tags.length < 2) return;
    
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const tag1 = tags[i];
        const tag2 = tags[j];
        
        // 更新双向权重
        this.incrementTagAssociation(tag1, tag2);
        this.incrementTagAssociation(tag2, tag1);
      }
    }
  }
  
  /**
   * 增加标签关联
   */
  incrementTagAssociation(tag1, tag2, increment = 1) {
    if (!this.tagGraph.has(tag1)) {
      this.tagGraph.set(tag1, new Map());
    }
    
    const associations = this.tagGraph.get(tag1);
    const currentWeight = associations.get(tag2) || 0;
    associations.set(tag2, currentWeight + increment);
  }
  
  /**
   * 搜索资源
   */
  search(query, options = {}) {
    const cacheKey = this.createCacheKey(query, options);
    
    // 检查缓存
    if (this.searchCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.searchCache.get(cacheKey);
    }
    
    this.stats.cacheMisses++;
    this.stats.searchesPerformed++;
    
    const startTime = Date.now();
    
    // 解析查询
    const parsedQuery = this.parseQuery(query);
    
    // 执行搜索
    let results;
    if (parsedQuery.mode === 'simple') {
      results = this.simpleSearch(parsedQuery.tags, options);
    } else if (parsedQuery.mode === 'complex') {
      results = this.complexSearch(parsedQuery, options);
    } else {
      results = this.semanticSearch(parsedQuery.text, options);
    }
    
    // 排序结果
    results.sort((a, b) => b.score - a.score);
    
    // 应用限制
    if (options.limit && results.length > options.limit) {
      results = results.slice(0, options.limit);
    }
    
    const duration = Date.now() - startTime;
    
    const searchResult = {
      query,
      results,
      total: results.length,
      duration,
      parsedQuery
    };
    
    // 缓存结果
    if (this.searchCache.size >= this.config.cacheSize) {
      this.evictOldestCacheEntries();
    }
    this.searchCache.set(cacheKey, searchResult);
    
    this.emit('searchPerformed', searchResult);
    
    if (this.config.debug) {
      console.log(`🔍 搜索完成: ${query} → ${results.length}个结果 (${duration}ms)`);
    }
    
    return searchResult;
  }
  
  /**
   * 简单搜索（标签匹配）
   */
  simpleSearch(tags, options) {
    const results = [];
    const tagSet = new Set(tags);
    
    // 查找包含所有标签的资源
    for (const [resourceId, resource] of this.resources.entries()) {
      const resourceTags = resource.tags;
      
      // 检查标签匹配
      let matchScore = 0;
      let matchedTags = 0;
      
      for (const tag of tagSet) {
        if (resourceTags.has(tag)) {
          matchedTags++;
          matchScore += this.getTagWeight(tag);
        } else if (this.config.enableFuzzyMatch) {
          // 模糊匹配
          const fuzzyMatch = this.findSimilarTag(tag, Array.from(resourceTags));
          if (fuzzyMatch) {
            matchedTags += 0.5; // 模糊匹配得分减半
            matchScore += this.getTagWeight(fuzzyMatch) * 0.5;
          }
        }
      }
      
      if (matchedTags > 0) {
        const coverage = matchedTags / tagSet.size;
        const tagWeight = matchScore / matchedTags;
        const recency = this.calculateRecencyScore(resource);
        
        const score = (coverage * 0.4) + (tagWeight * 0.3) + (recency * 0.3);
        
        if (score >= (options.minScore || this.config.similarityThreshold)) {
          results.push({
            resourceId,
            score,
            coverage,
            matchedTags: matchedTags,
            tags: Array.from(resource.tags),
            content: resource.content,
            metadata: resource.metadata
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * 复杂搜索（支持 AND/OR/NOT）
   */
  complexSearch(parsedQuery, options) {
    // 这里可以实现更复杂的查询逻辑
    // 暂时回退到简单搜索
    return this.simpleSearch(parsedQuery.tags, options);
  }
  
  /**
   * 语义搜索（基于内容相似度）
   */
  semanticSearch(text, options) {
    // 这里可以实现基于向量或嵌入的语义搜索
    // 暂时使用基于标签的搜索
    
    // 从文本提取标签
    const extractedTags = this.extractTagsFromText(text);
    return this.simpleSearch(extractedTags, options);
  }
  
  /**
   * 解析查询
   */
  parseQuery(query) {
    query = query.trim().toLowerCase();
    
    // 检查是否包含逻辑运算符
    if (query.includes(' and ') || query.includes(' or ') || query.includes(' not ')) {
      return {
        mode: 'complex',
        text: query,
        tags: this.extractTagsFromText(query)
      };
    }
    
    // 检查是否是标签列表（逗号分隔）
    if (query.includes(',')) {
      const tags = query.split(',').map(tag => tag.trim()).filter(Boolean);
      return {
        mode: 'simple',
        text: query,
        tags
      };
    }
    
    // 默认语义搜索
    return {
      mode: 'semantic',
      text: query,
      tags: this.extractTagsFromText(query)
    };
  }
  
  /**
   * 从文本提取标签
   */
  extractTagsFromText(text) {
    const tags = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // 检查每个词是否是已知标签
    for (const word of words) {
      if (this.tags.has(word)) {
        tags.push(word);
      } else if (this.config.enableFuzzyMatch) {
        // 尝试模糊匹配
        const similarTag = this.findSimilarTag(word, Array.from(this.tags.keys()));
        if (similarTag) {
          tags.push(similarTag);
        }
      }
    }
    
    return tags;
  }
  
  /**
   * 查找相似标签
   */
  findSimilarTag(tag, tagList) {
    const cacheKey = `similarity:${tag}:${tagList.sort().join(',')}`;
    
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey);
    }
    
    this.stats.similarityCalculations++;
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const candidate of tagList) {
      const score = this.calculateStringSimilarity(tag, candidate);
      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    
    this.similarityCache.set(cacheKey, bestMatch);
    return bestMatch;
  }
  
  /**
   * 计算字符串相似度（简单实现）
   */
  calculateStringSimilarity(str1, str2) {
    // 简单实现：基于编辑距离
    // 生产环境可以使用更复杂的算法
    
    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;
    
    // 计算共同字符比例
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * 计算标签权重
   */
  getTagWeight(tagName) {
    const tag = this.tags.get(tagName);
    return tag ? (tag.metadata.weight || 1.0) : 1.0;
  }
  
  /**
   * 计算资源时效性分数
   */
  calculateRecencyScore(resource) {
    const indexedTime = new Date(resource.metadata.indexed).getTime();
    const now = Date.now();
    const ageInDays = (now - indexedTime) / (1000 * 60 * 60 * 24);
    
    // 指数衰减：越新分数越高
    return Math.exp(-ageInDays / 30); // 30天半衰期
  }
  
  /**
   * 创建缓存键
   */
  createCacheKey(query, options) {
    return JSON.stringify({
      query,
      limit: options.limit,
      minScore: options.minScore
    });
  }
  
  /**
   * 淘汰