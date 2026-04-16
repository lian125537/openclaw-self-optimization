/**
 * 数据转换系统 - TypeScript版
 * 支持JSON/XML/YAML转换、数据验证、格式标准化
 */

export interface ConversionOptions {
  validate?: boolean;
  strict?: boolean;
  pretty?: boolean;
  encoding?: 'utf8' | 'base64' | 'hex';
  schema?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, DataSchema>;
  items?: DataSchema;
  required?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  format?: 'date-time' | 'email' | 'uri' | 'uuid';
  description?: string;
}

export class DataConverter {
  constructor() {
    console.log('🚀 数据转换器初始化完成');
  }
  
  // JSON转换
  async jsonToXml(json: any, options: ConversionOptions = {}): Promise<string> {
    this.validateInput(json, 'json', options);
    
    const xml = this.convertObjectToXml(json, 'root');
    
    if (options.pretty) {
      return this.formatXml(xml);
    }
    
    return xml;
  }
  
  async xmlToJson(xml: string, options: ConversionOptions = {}): Promise<any> {
    this.validateInput(xml, 'xml', options);
    
    // 简化实现：实际应用中会使用XML解析器
    const json = this.parseXmlToObject(xml);
    
    if (options.validate && options.schema) {
      const validation = this.validateData(json, options.schema);
      if (!validation.valid) {
        throw new Error(`XML转JSON验证失败: ${validation.errors.join(', ')}`);
      }
    }
    
    return json;
  }
  
  async jsonToYaml(json: any, options: ConversionOptions = {}): Promise<string> {
    this.validateInput(json, 'json', options);
    
    const yaml = this.convertObjectToYaml(json, 0);
    
    return yaml;
  }
  
  async yamlToJson(yaml: string, options: ConversionOptions = {}): Promise<any> {
    this.validateInput(yaml, 'yaml', options);
    
    // 简化实现：实际应用中会使用YAML解析器
    const json = this.parseYamlToObject(yaml);
    
    if (options.validate && options.schema) {
      const validation = this.validateData(json, options.schema);
      if (!validation.valid) {
        throw new Error(`YAML转JSON验证失败: ${validation.errors.join(', ')}`);
      }
    }
    
    return json;
  }
  
  async csvToJson(csv: string, options: ConversionOptions = {}): Promise<any[]> {
    this.validateInput(csv, 'csv', options);
    
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: Record<string, any> = {};
      
      for (let j = 0; j < headers.length; j++) {
        if (j < values.length) {
          obj[headers[j]] = this.parseValue(values[j]);
        }
      }
      
      result.push(obj);
    }
    
    return result;
  }
  
  async jsonToCsv(json: any[], options: ConversionOptions = {}): Promise<string> {
    this.validateInput(json, 'json-array', options);
    
    if (!Array.isArray(json) || json.length === 0) {
      return '';
    }
    
    const headers = Object.keys(json[0]);
    const lines = [headers.join(',')];
    
    for (const item of json) {
      const values = headers.map(header => {
        const value = item[header];
        return this.formatCsvValue(value);
      });
      lines.push(values.join(','));
    }
    
    return lines.join('\n');
  }
  
  // 数据验证
  validateData(data: any, schema: DataSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    this.validateAgainstSchema(data, schema, '', errors, warnings);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // 数据标准化
  normalizeData(data: any, schema: DataSchema): any {
    return this.normalizeAgainstSchema(data, schema);
  }
  
  // 数据清理
  sanitizeData(data: any, rules: {
    removeNull?: boolean;
    removeEmpty?: boolean;
    trimStrings?: boolean;
    convertNumbers?: boolean;
    maxDepth?: number;
  } = {}): any {
    return this.applySanitization(data, rules, 0);
  }
  
  // 数据合并
  mergeData(sources: any[], strategy: 'deep' | 'shallow' | 'prefer-first' | 'prefer-last' = 'deep'): any {
    if (sources.length === 0) return {};
    if (sources.length === 1) return sources[0];
    
    let result = sources[0];
    
    for (let i = 1; i < sources.length; i++) {
      result = this.mergeObjects(result, sources[i], strategy);
    }
    
    return result;
  }
  
  // 数据过滤
  filterData(data: any[], predicate: (item: any) => boolean): any[] {
    return data.filter(predicate);
  }
  
  // 数据分组
  groupData(data: any[], key: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const item of data) {
      const groupKey = item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    
    return groups;
  }
  
  // 数据排序
  sortData(data: any[], key: string, order: 'asc' | 'desc' = 'asc'): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // 数据分页
  paginateData(data: any[], page: number, pageSize: number): {
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    
    return {
      data: data.slice(startIndex, endIndex),
      total,
      page,
      pageSize,
      totalPages
    };
  }
  
  // 私有方法
  private validateInput(input: any, type: string, options: ConversionOptions): void {
    if (!input) {
      throw new Error(`输入数据为空 (类型: ${type})`);
    }
    
    if (options.strict) {
      switch (type) {
        case 'json':
          if (typeof input !== 'object') {
            throw new Error('JSON输入必须是对象或数组');
          }
          break;
        case 'xml':
        case 'yaml':
        case 'csv':
          if (typeof input !== 'string') {
            throw new Error(`${type.toUpperCase()}输入必须是字符串`);
          }
          break;
      }
    }
  }
  
  private convertObjectToXml(obj: any, tagName: string): string {
    if (obj === null || obj === undefined) {
      return `<${tagName}></${tagName}>`;
    }
    
    if (typeof obj === 'boolean' || typeof obj === 'number') {
      return `<${tagName}>${obj}</${tagName}>`;
    }
    
    if (typeof obj === 'string') {
      return `<${tagName}><![CDATA[${obj}]]></${tagName}>`;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertObjectToXml(item, 'item')).join('');
    }
    
    if (typeof obj === 'object') {
      const children = Object.entries(obj)
        .map(([key, value]) => this.convertObjectToXml(value, key))
        .join('');
      return `<${tagName}>${children}</${tagName}>`;
    }
    
    return `<${tagName}>${obj}</${tagName}>`;
  }
  
  private parseXmlToObject(xml: string): any {
    // 简化实现
    return { parsed: true, original: xml.substring(0, 100) + '...' };
  }
  
  private convertObjectToYaml(obj: any, indent: number): string {
    const indentStr = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj === 'boolean' || typeof obj === 'number') {
      return obj.toString();
    }
    
    if (typeof obj === 'string') {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      
      return obj.map(item => 
        `${indentStr}- ${this.convertObjectToYaml(item, indent + 1)}`
      ).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      
      return entries.map(([key, value]) => 
        `${indentStr}${key}: ${this.convertObjectToYaml(value, indent + 1)}`
      ).join('\n');
    }
    
    return obj.toString();
  }
  
  private parseYamlToObject(yaml: string): any {
    // 简化实现
    return { parsed: true, original: yaml.substring(0, 100) + '...' };
  }
  
  private parseValue(value: string): any {
    if (value === '') return '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    return value;
  }
  
  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
      // 转义引号和逗号
      const escaped = value.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`;
      }
      return escaped;
    }
    return String(value);
  }
  
  private validateAgainstSchema(
    data: any, 
    schema: DataSchema, 
    path: string,
    errors: string[],
    warnings: string[]
  ): void {
    if (schema.type === 'null' && data !== null) {
      errors.push(`${path}: 必须为null`);
      return;
    }
    
    if (schema.type === 'boolean' && typeof data !== 'boolean') {
      errors.push(`${path}: 必须为布尔值`);
      return;
    }
    
    if (schema.type === 'number' && typeof data !== 'number') {
      errors.push(`${path}: 必须为数字`);
      return;
    }
    
    if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push(`${path}: 必须为字符串`);
        return;
      }
      
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push(`${path}: 长度必须至少为 ${schema.minLength} 字符`);
      }
      
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        warnings.push(`${path}: 长度超过 ${schema.maxLength} 字符`);
      }
      
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push(`${path}: 必须匹配模式 ${schema.pattern}`);
      }
      
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push(`${path}: 必须是 ${schema.enum.join(', ')} 之一`);
      }
    }
    
    if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push(`${path}: 必须为数组`);
        return;
      }
      
      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          this.validateAgainstSchema(data[i], schema.items, `${path}[${i}]`, errors, warnings);
        }
      }
    }
    
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`${path}: 必须为对象`);
        return;
      }
      
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in data)) {
            errors.push(`${path}.${requiredField}: 必须存在`);
          }
        }
      }
      
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            this.validateAgainstSchema(data[key], propSchema, `${path}.${key}`, errors, warnings);
          }
        }
      }
    }
  }
  
  private normalizeAgainstSchema(data: any, schema: DataSchema): any {
    if (schema.type === 'null') return null;
    if (schema.type === 'boolean') return Boolean(data);
    if (schema.type === 'number') return Number(data);
    if (schema.type === 'string') return String(data);
    
    if (schema.type === 'array') {
      if (!Array.isArray(data)) return [];
      
      if (schema.items) {
        return data.map(item => this.normalizeAgainstSchema(item, schema.items!));
      }
      
      return data;
    }
    
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null) return {};
      
      const result: Record<string, any> = {};
      
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            result[key] = this.normalizeAgainstSchema(data[key], propSchema);
          } else if (propSchema.type === 'null') {
            result[key] = null;
          }
        }
      }
      
      return result;
    }
    
    return data;
  }
  
  private applySanitization(data: any, rules: any, depth: number): any {
    if (depth > (rules.maxDepth || 10)) return data;
    
    if (data === null) {
      return rules.removeNull ? undefined : null;
    }
    
    if (typeof data === 'string') {
      let result = data;
      if (rules.trimStrings) result = result.trim();
      if (rules.removeEmpty && result === '') return undefined;
      return result;
    }
    
    if (typeof data === 'number') {
      return rules.convertNumbers ? Number(data) : data;
    }
    
    if (Array.isArray(data)) {
      const result = data
        .map(item => this.applySanitization(item, rules, depth + 1))
        .filter(item => item !== undefined);
      
      if (rules.removeEmpty && result.length === 0) return undefined;
      return result;
    }
    
    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        const sanitized = this.applySanitization(value, rules, depth + 1);
        if (sanitized !== undefined) {
          result[key] = sanitized;
        }
      }
      
      if (rules.removeEmpty && Object.keys(result).length === 0) return undefined;
      return result;
    }
    
    return data;
  }
  
  private mergeObjects(obj1: any, obj2: any, strategy: string): any {
    if (strategy === 'shallow') {
      return { ...obj1, ...obj2 };
    }
    
    if (strategy === 'prefer-first') {
      return { ...obj2, ...obj1 };
    }
    
    if (strategy === 'prefer-last') {
      return { ...obj1, ...obj2 };
    }
    
    // deep merge
    const result = { ...obj1 };
    
    for (const [key, value] of Object.entries(obj2)) {
      if (key in result && 
          typeof result[key] === 'object' && 
          typeof value === 'object' &&
          !Array.isArray(result[key]) &&
          !Array.isArray(value) &&
          result[key] !== null &&
          value !== null) {
        result[key] = this.mergeObjects(result[key], value, strategy);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  private formatXml(xml: string): string {
    // 简化实现
    return xml.replace(/><([^/])/g, '>\n  <$1');
  }
}

// 导出工厂函数
export function createDataConverter() {
  return new DataConverter();
}

// 导出类型
export type {
  ConversionOptions,
  ValidationResult,
  DataSchema
};