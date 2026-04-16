/**
 * VCP Variable Engine - 变量替换引擎
 * 实现 VCP 语法的变量替换、组解析和引用解析
 */

const EventEmitter = require('events');

class VariableEngine extends EventEmitter {
  constructor() {
    super();
    
    // 变量存储: name -> value
    this.variables = new Map();
    
    // 组存储: "name::type" -> { content, tags, metadata }
    this.groups = new Map();
    
    // 引用缓存: groupName -> resolved content
    this.referenceCache = new Map();
    
    // 统计信息
    this.stats = {
      variablesRegistered: 0,
      groupsRegistered: 0,
      templatesParsed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    console.log('🔧 VariableEngine 初始化完成');
  }
  
  /**
   * 注册变量
   * @param {string} name - 变量名
   * @param {any} value - 变量值
   * @param {object} metadata - 元数据
   */
  registerVariable(name, value, metadata = {}) {
    if (typeof name !== 'string') {
      throw new Error('变量名必须是字符串');
    }
    
    const variable = {
      name,
      value: this.normalizeValue(value),
      metadata: {
        registeredAt: new Date(),
        updatedAt: new Date(),
        ...metadata
      }
    };
    
    this.variables.set(name, variable);
    this.stats.variablesRegistered++;
    
    this.emit('variableRegistered', variable);
    console.log(`📝 注册变量: ${name} = ${this.truncateValue(value)}`);
    
    return variable;
  }
  
  /**
   * 注册组
   * @param {string} name - 组名
   * @param {string} type - 组类型
   * @param {any} content - 组内容
   * @param {string[]} tags - 标签数组
   * @param {object} metadata - 元数据
   */
  registerGroup(name, type, content, tags = [], metadata = {}) {
    if (typeof name !== 'string' || typeof type !== 'string') {
      throw new Error('组名和类型必须是字符串');
    }
    
    const groupKey = this.createGroupKey(name, type);
    const group = {
      name,
      type,
      content: this.normalizeValue(content),
      tags: Array.isArray(tags) ? tags : [tags],
      metadata: {
        registeredAt: new Date(),
        updatedAt: new Date(),
        ...metadata
      }
    };
    
    this.groups.set(groupKey, group);
    this.stats.groupsRegistered++;
    
    // 清除相关缓存
    this.clearGroupCache(name);
    
    this.emit('groupRegistered', group);
    console.log(`📁 注册组: ${name}::${type} (${tags.length}个标签)`);
    
    return group;
  }
  
  /**
   * 解析模板
   * @param {string} template - 模板字符串
   * @param {object} options - 解析选项
   * @returns {string} 解析后的字符串
   */
  parseTemplate(template, options = {}) {
    if (typeof template !== 'string') {
      throw new Error('模板必须是字符串');
    }
    
    const startTime = Date.now();
    this.stats.templatesParsed++;
    
    // 步骤1: 替换变量 {{VarName}}
    let result = this.replaceVariables(template);
    
    // 步骤2: 解析组 [[Name::Type::Tag]]
    result = this.parseGroups(result);
    
    // 步骤3: 解析引用 《《GroupName》》
    result = this.parseReferences(result);
    
    const duration = Date.now() - startTime;
    
    this.emit('templateParsed', {
      originalLength: template.length,
      resultLength: result.length,
      duration,
      options
    });
    
    if (options.debug) {
      console.log(`🔍 模板解析完成: ${duration}ms`);
      console.log(`   原始长度: ${template.length}`);
      console.log(`   结果长度: ${result.length}`);
    }
    
    return result;
  }
  
  /**
   * 替换变量 {{VarName}}
   */
  replaceVariables(template) {
    return template.replace(/\{\{([^{}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      
      if (this.variables.has(trimmedName)) {
        const variable = this.variables.get(trimmedName);
        variable.metadata.accessedAt = new Date();
        variable.metadata.accessCount = (variable.metadata.accessCount || 0) + 1;
        
        return this.stringifyValue(variable.value);
      }
      
      // 变量未找到，保留原样或返回占位符
      if (options?.strict) {
        throw new Error(`变量未找到: ${trimmedName}`);
      }
      
      return match; // 保持原样
    });
  }
  
  /**
   * 解析组 [[Name::Type::Tag]]
   */
  parseGroups(template) {
    return template.replace(/\[\[([^\[\]]+)\]\]/g, (match, content) => {
      try {
        const parts = content.split('::').map(part => part.trim());
        if (parts.length < 2) {
          return `[INVALID_GROUP: ${content}]`;
        }
        
        const [name, type, ...tags] = parts;
        const groupKey = this.createGroupKey(name, type);
        
        if (this.groups.has(groupKey)) {
          const group = this.groups.get(groupKey);
          group.metadata.accessedAt = new Date();
          group.metadata.accessCount = (group.metadata.accessCount || 0) + 1;
          
          // 检查标签匹配
          if (tags.length > 0 && !this.tagsMatch(group.tags, tags)) {
            return `[GROUP_TAG_MISMATCH: ${name}::${type}]`;
          }
          
          return this.resolveGroupContent(group);
        }
        
        return `[GROUP_NOT_FOUND: ${name}::${type}]`;
      } catch (error) {
        return `[GROUP_PARSE_ERROR: ${content}]`;
      }
    });
  }
  
  /**
   * 解析引用 《《GroupName》》
   */
  parseReferences(template) {
    return template.replace(/《《([^《》]+)》》/g, (match, groupName) => {
      const trimmedName = groupName.trim();
      
      // 检查缓存
      if (this.referenceCache.has(trimmedName)) {
        this.stats.cacheHits++;
        return this.referenceCache.get(trimmedName);
      }
      
      this.stats.cacheMisses++;
      
      try {
        // 查找匹配的组
        const matchingGroups = this.findGroupsByName(trimmedName);
        
        if (matchingGroups.length === 0) {
          return `[REF_NOT_FOUND: ${trimmedName}]`;
        }
        
        if (matchingGroups.length > 1) {
          console.warn(`⚠️  多个组匹配引用 "${trimmedName}"，使用第一个`);
        }
        
        const group = matchingGroups[0];
        const resolvedContent = this.resolveGroupContent(group);
        
        // 缓存结果
        this.referenceCache.set(trimmedName, resolvedContent);
        
        return resolvedContent;
      } catch (error) {
        return `[REF_RESOLVE_ERROR: ${trimmedName}]`;
      }
    });
  }
  
  /**
   * 解析组内容
   */
  resolveGroupContent(group) {
    if (typeof group.content === 'function') {
      return group.content();
    }
    
    if (typeof group.content === 'object') {
      return JSON.stringify(group.content, null, 2);
    }
    
    return String(group.content);
  }
  
  /**
   * 查找同名组
   */
  findGroupsByName(name) {
    const groups = [];
    
    for (const [key, group] of this.groups.entries()) {
      if (group.name === name) {
        groups.push(group);
      }
    }
    
    return groups;
  }
  
  /**
   * 检查标签匹配
   */
  tagsMatch(groupTags, queryTags) {
    return queryTags.every(tag => groupTags.includes(tag));
  }
  
  /**
   * 创建组键
   */
  createGroupKey(name, type) {
    return `${name}::${type}`;
  }
  
  /**
   * 清除组缓存
   */
  clearGroupCache(groupName) {
    for (const [key] of this.referenceCache.entries()) {
      if (key === groupName) {
        this.referenceCache.delete(key);
      }
    }
  }
  
  /**
   * 标准化值
   */
  normalizeValue(value) {
    if (value === undefined || value === null) {
      return '';
    }
    
    if (typeof value === 'function' || typeof value === 'object') {
      return value;
    }
    
    return String(value);
  }
  
  /**
   * 字符串化值
   */
  stringifyValue(value) {
    if (typeof value === 'function') {
      try {
        return this.stringifyValue(value());
      } catch (error) {
        return `[Function Error: ${error.message}]`;
      }
    }
    
    if (value === undefined || value === null) {
      return '';
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    
    return String(value);
  }
  
  /**
   * 截断值用于日志
   */
  truncateValue(value, maxLength = 50) {
    const str = this.stringifyValue(value);
    if (str.length <= maxLength) {
      return str;
    }
    
    return str.substring(0, maxLength) + '...';
  }
  
  /**
   * 获取变量值
   */
  getVariable(name) {
    const variable = this.variables.get(name);
    return variable ? variable.value : undefined;
  }
  
  /**
   * 获取组
   */
  getGroup(name, type) {
    const groupKey = this.createGroupKey(name, type);
    const group = this.groups.get(groupKey);
    return group ? group.content : undefined;
  }
  
  /**
   * 列出所有变量
   */
  listVariables() {
    return Array.from(this.variables.entries()).map(([name, variable]) => ({
      name,
      value: variable.value,
      metadata: variable.metadata
    }));
  }
  
  /**
   * 列出所有组
   */
  listGroups() {
    return Array.from(this.groups.values()).map(group => ({
      name: group.name,
      type: group.type,
      tags: group.tags,
      metadata: group.metadata
    }));
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      variablesCount: this.variables.size,
      groupsCount: this.groups.size,
      cacheSize: this.referenceCache.size
    };
  }
  
  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      variablesRegistered: 0,
      groupsRegistered: 0,
      templatesParsed: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  /**
   * 清理缓存
   */
  clearCache() {
    this.referenceCache.clear();
    console.log('🧹 缓存已清理');
  }
  
  /**
   * 导出状态
   */
  exportState() {
    return {
      variables: Array.from(this.variables.entries()),
      groups: Array.from(this.groups.entries()),
      stats: this.stats,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 导入状态
   */
  importState(state) {
    if (!state || !state.variables || !state.groups) {
      throw new Error('无效的状态数据');
    }
    
    // 清空当前状态
    this.variables.clear();
    this.groups.clear();
    this.referenceCache.clear();
    
    // 导入变量
    for (const [name, variable] of state.variables) {
      this.variables.set(name, variable);
    }
    
    // 导入组
    for (const [key, group] of state.groups) {
      this.groups.set(key, group);
    }
    
    console.log(`📥 导入状态完成: ${state.variables.length}个变量, ${state.groups.length}个组`);
  }
}

module.exports = VariableEngine;