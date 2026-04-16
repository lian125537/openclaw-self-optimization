// 增强全文搜索系统
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnhancedMemorySearch {
  constructor(memoryDir = './memory') {
    this.memoryDir = path.resolve(memoryDir);
    this.indexFile = path.join(this.memoryDir, '.search-index.json');
    this.index = this.loadIndex();
    this.fileCache = new Map();
  }
  
  // 加载或创建索引
  loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = fs.readFileSync(this.indexFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('索引加载失败，创建新索引:', error.message);
    }
    
    return {
      version: '1.0',
      created: new Date().toISOString(),
      files: {},
      keywords: {},
      stats: {
        totalFiles: 0,
        totalWords: 0,
        lastUpdated: null
      }
    };
  }
  
  // 保存索引
  saveIndex() {
    this.index.stats.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
  }
  
  // 构建索引
  async buildIndex() {
    console.log('🔍 构建记忆搜索索引...');
    
    // 获取所有记忆文件
    const files = this.getAllMemoryFiles();
    console.log(`找到 ${files.length} 个记忆文件`);
    
    this.index.files = {};
    this.index.keywords = {};
    
    let totalWords = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.memoryDir, file);
        
        // 提取关键词（简单实现）
        const keywords = this.extractKeywords(content);
        const wordCount = content.split(/\s+/).length;
        
        this.index.files[relativePath] = {
          path: relativePath,
          size: content.length,
          wordCount,
          keywords: keywords.slice(0, 20), // 取前20个关键词
          modified: fs.statSync(file).mtime.toISOString(),
          indexed: new Date().toISOString()
        };
        
        // 更新关键词索引
        keywords.forEach(keyword => {
          if (!this.index.keywords[keyword]) {
            this.index.keywords[keyword] = [];
          }
          if (!this.index.keywords[keyword].includes(relativePath)) {
            this.index.keywords[keyword].push(relativePath);
          }
        });
        
        totalWords += wordCount;
        
        // 缓存文件内容
        this.fileCache.set(relativePath, content);
        
      } catch (error) {
        console.log(`❌ 索引文件失败: ${file}`, error.message);
      }
    }
    
    this.index.stats = {
      totalFiles: files.length,
      totalWords,
      lastUpdated: new Date().toISOString()
    };
    
    this.saveIndex();
    console.log('✅ 索引构建完成');
    return this.index;
  }
  
  // 获取所有记忆文件
  getAllMemoryFiles() {
    const files = [];
    
    function scanDir(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          // 跳过某些目录
          if (!['node_modules', '.git', 'cache', 'logs'].includes(item.name)) {
            scanDir(fullPath);
          }
        } else if (item.isFile() && item.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    if (fs.existsSync(this.memoryDir)) {
      scanDir(this.memoryDir);
    }
    
    return files;
  }
  
  // 提取关键词（简单实现）
  extractKeywords(text) {
    // 移除Markdown标记
    let cleanText = text
      .replace(/[#*`~\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    
    // 分割单词
    const words = cleanText.split(/\s+/);
    
    // 过滤常见词和短词
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
      'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', '的', '了',
      '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
      '看', '好', '自己', '这'
    ]);
    
    // 统计词频
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // 按频率排序并返回
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }
  
  // 搜索记忆
  search(query, options = {}) {
    const {
      limit = 10,
      minScore = 0.1,
      includeContent = false
    } = options;
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // 计算文件相关性分数
    const scores = {};
    
    Object.entries(this.index.files).forEach(([filePath, fileInfo]) => {
      let score = 0;
      
      // 关键词匹配
      queryWords.forEach(word => {
        // 检查文件名
        if (filePath.toLowerCase().includes(word)) {
          score += 3;
        }
        
        // 检查关键词
        if (fileInfo.keywords.some(kw => kw.includes(word))) {
          score += 2;
        }
        
        // 检查关键词索引
        if (this.index.keywords[word] && this.index.keywords[word].includes(filePath)) {
          score += 5;
        }
      });
      
      // 时间衰减（越新的文件分数越高）
      const fileDate = new Date(fileInfo.modified);
      const daysOld = (new Date() - fileDate) / (1000 * 60 * 60 * 24);
      const timeBonus = Math.max(0, 10 - daysOld) / 10; // 10天内有效
      score += timeBonus;
      
      if (score > minScore) {
        scores[filePath] = {
          score,
          fileInfo,
          matches: queryWords.filter(word => 
            filePath.toLowerCase().includes(word) ||
            fileInfo.keywords.some(kw => kw.includes(word))
          )
        };
      }
    });
    
    // 排序结果
    const results = Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([filePath, data]) => {
        const result = {
          file: filePath,
          score: data.score.toFixed(2),
          matches: data.matches,
          metadata: {
            size: data.fileInfo.size,
            wordCount: data.fileInfo.wordCount,
            modified: data.fileInfo.modified
          }
        };
        
        // 包含内容片段
        if (includeContent) {
          try {
            const content = this.fileCache.get(filePath) || 
                           fs.readFileSync(path.join(this.memoryDir, filePath), 'utf8');
            
            // 找到包含查询词的部分
            const lines = content.split('\n');
            const relevantLines = lines.filter(line => 
              queryWords.some(word => line.toLowerCase().includes(word))
            ).slice(0, 3);
            
            if (relevantLines.length > 0) {
              result.snippet = relevantLines.join(' ... ');
            }
          } catch (error) {
            // 忽略读取错误
          }
        }
        
        return result;
      });
    
    return {
      query,
      totalResults: Object.keys(scores).length,
      results,
      searchTime: new Date().toISOString()
    };
  }
  
  // 获取文件内容
  getFileContent(filePath) {
    try {
      const fullPath = path.join(this.memoryDir, filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`无法读取文件: ${filePath} - ${error.message}`);
    }
  }
  
  // 更新单个文件索引
  updateFileIndex(filePath) {
    const fullPath = path.join(this.memoryDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`文件不存在: ${filePath}`);
      return false;
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const keywords = this.extractKeywords(content);
      const wordCount = content.split(/\s+/).length;
      
      this.index.files[filePath] = {
        path: filePath,
        size: content.length,
        wordCount,
        keywords: keywords.slice(0, 20),
        modified: fs.statSync(fullPath).mtime.toISOString(),
        indexed: new Date().toISOString()
      };
      
      // 更新关键词索引
      keywords.forEach(keyword => {
        if (!this.index.keywords[keyword]) {
          this.index.keywords[keyword] = [];
        }
        if (!this.index.keywords[keyword].includes(filePath)) {
          this.index.keywords[keyword].push(filePath);
        }
      });
      
      this.fileCache.set(filePath, content);
      this.saveIndex();
      
      console.log(`✅ 更新索引: ${filePath}`);
      return true;
      
    } catch (error) {
      console.log(`❌ 更新索引失败: ${filePath}`, error.message);
      return false;
    }
  }
  
  // 获取统计信息
  getStats() {
    return {
      ...this.index.stats,
      indexedFiles: Object.keys(this.index.files).length,
      uniqueKeywords: Object.keys(this.index.keywords).length,
      cacheSize: this.fileCache.size
    };
  }
}

// 命令行接口
if (require.main === module) {
  const search = new EnhancedMemorySearch();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      search.buildIndex();
      break;
      
    case 'search':
      const query = process.argv.slice(3).join(' ');
      if (!query) {
        console.log('请输入搜索词');
        process.exit(1);
      }
      const results = search.search(query, { includeContent: true });
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'stats':
      console.log(JSON.stringify(search.getStats(), null, 2));
      break;
      
    case 'update':
      const file = process.argv[3];
      if (!file) {
        console.log('请输入文件路径');
        process.exit(1);
      }
      search.updateFileIndex(file);
      break;
      
    default:
      console.log('用法:');
      console.log('  node memory-fts-enhanced.js build          # 构建索引');
      console.log('  node memory-fts-enhanced.js search <词>    # 搜索');
      console.log('  node memory-fts-enhanced.js stats          # 统计信息');
      console.log('  node memory-fts-enhanced.js update <文件>  # 更新单个文件');
      break;
  }
}

module.exports = EnhancedMemorySearch;