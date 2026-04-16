/**
 * SemanticTagSystem - 语义标签系统（简化版）
 * 实现 VCP 的语义标签功能
 */

class SemanticTagSystem {
  constructor(options = {}) {
    this.tags = new Map(); // tag -> {resources: Set, metadata}
    this.resources = new Map(); // id -> {tags: Set, content, metadata}
    this.tagGraph = new Map(); // tag -> Map<relatedTag, weight>
    this.cache = new Map();
    
    this.stats = {
      tags: 0,
      resources: 0,
      searches: 0
    };
    
    console.log('🔖 SemanticTagSystem 初始化');
  }
  
  // 创建标签
  createTag(name, metadata = {}) {
    if (!this.tags.has(name)) {
      this.tags.set(name, {
        resources: new Set(),
        metadata: {created: new Date(), ...metadata}
      });
      this.tagGraph.set(name, new Map());
      this.stats.tags++;
    }
    return this.tags.get(name);
  }
  
  // 索引资源
  indexResource(id, content, tags = [], metadata = {}) {
    const resource = {
      id,
      content,
      tags: new Set(tags),
      metadata: {indexed: new Date(), ...metadata}
    };
    
    this.resources.set(id, resource);
    this.stats.resources++;
    
    // 关联标签
    tags.forEach(tag => {
      const tagObj = this.createTag(tag);
      tagObj.resources.add(id);
      
      // 更新标签图
      tags.forEach(otherTag => {
        if (tag !== otherTag) {
          const graph = this.tagGraph.get(tag);
          const current = graph.get(otherTag) || 0;
          graph.set(otherTag, current + 1);
        }
      });
    });
    
    return resource;
  }
  
  // 搜索
  search(query, options = {}) {
    this.stats.searches++;
    
    const tags = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results = [];
    
    for (const [id, resource] of this.resources) {
      let score = 0;
      let matched = 0;
      
      for (const tag of tags) {
        if (resource.tags.has(tag)) {
          score += 1.0;
          matched++;
        } else {
          // 模糊匹配
          for (const resourceTag of resource.tags) {
            if (resourceTag.includes(tag) || tag.includes(resourceTag)) {
              score += 0.5;
              matched++;
              break;
            }
          }
        }
      }
      
      if (matched > 0) {
        const coverage = matched / tags.length;
        const finalScore = (score / matched) * coverage;
        
        if (finalScore >= (options.minScore || 0.3)) {
          results.push({
            id,
            score: finalScore,
            tags: Array.from(resource.tags),
            content: resource.content.substring(0, 100) + '...',
            metadata: resource.metadata
          });
        }
      }
    }
    
    // 排序
    results.sort((a, b) => b.score - a.score);
    
    // 限制数量
    const limit = options.limit || 10;
    return results.slice(0, limit);
  }
  
  // 获取相关标签
  getRelatedTags(tag, limit = 5) {
    if (!this.tagGraph.has(tag)) return [];
    
    const related = Array.from(this.tagGraph.get(tag).entries())
      .map(([relatedTag, weight]) => ({tag: relatedTag, weight}))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
    
    return related;
  }
  
  // 获取资源
  getResource(id) {
    return this.resources.get(id);
  }
  
  // 获取标签
  getTag(name) {
    return this.tags.get(name);
  }
  
  // 统计
  getStats() {
    return {
      ...this.stats,
      tagGraphSize: this.tagGraph.size
    };
  }
  
  // 批量索引
  batchIndex(items) {
    let count = 0;
    for (const item of items) {
      this.indexResource(
        item.id || `item_${Date.now()}_${count}`,
        item.content,
        item.tags || [],
        item.metadata || {}
      );
      count++;
    }
    return count;
  }
}

module.exports = SemanticTagSystem;