# 记忆系统优化方案

## 当前问题
1. **向量搜索不可用** - DeepSeek 不支持嵌入 API (404错误)
2. **46个记忆文件管理** - 需要更好组织
3. **全文搜索优化** - 提高搜索准确性和速度

## 解决方案

### 1. 替代向量搜索方案
**方案A: 本地嵌入模型**
```bash
# 安装本地嵌入模型
pip install sentence-transformers
# 使用 BGE-M3 或 all-MiniLM-L6-v2
```

**方案B: 增强全文搜索**
- 创建关键词索引
- 改进搜索算法
- 添加语义相似度匹配

**方案C: 混合搜索**
- 全文搜索 (主要)
- 关键词匹配 (辅助)
- 简单语义匹配 (基于词向量)

### 2. 记忆文件重组
**新结构**:
```
memory/
├── core/                    # 核心记忆
│   ├── identity/           # 身份记忆
│   ├── skills/             # 技能记忆
│   └── projects/           # 项目记忆
├── daily/                  # 日常记录
│   ├── 2026-04-16.md
│   └── archive/           # 归档记录
├── research/               # 研究记录
│   ├── soul-app/
│   └── ai-evolution/
└── system/                 # 系统记忆
    ├── config/
    └── logs/
```

### 3. 全文搜索优化
**优化措施**:
1. **预计算索引** - 定期生成搜索索引
2. **关键词提取** - 自动提取重要关键词
3. **相关性评分** - 改进搜索结果排序
4. **缓存机制** - 缓存常用查询结果

## 实施步骤

### 阶段1: 立即实施 (今天)
1. 创建记忆文件重组脚本
2. 实现增强全文搜索
3. 设置定期索引更新

### 阶段2: 中期优化 (本周)
1. 集成本地嵌入模型 (如可用)
2. 实现混合搜索
3. 添加记忆可视化

### 阶段3: 长期改进 (下周)
1. 记忆压缩和去重
2. 智能记忆提取
3. 预测性记忆推荐

## 技术实现

### 增强全文搜索脚本
```javascript
// memory-fts-enhanced.js
const fs = require('fs');
const path = require('path');
const natural = require('natural'); // 需要安装

class EnhancedFTS {
  constructor(memoryDir) {
    this.memoryDir = memoryDir;
    this.index = new Map();
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }
  
  buildIndex() {
    // 构建增强索引
    // 包括: 关键词提取、词频统计、位置信息
  }
  
  search(query, limit = 10) {
    // 增强搜索: 关键词匹配 + 简单语义
  }
}
```

### 记忆重组脚本
```bash
#!/bin/bash
# reorganize-memory.sh

# 创建新目录结构
mkdir -p memory/{core/{identity,skills,projects},daily/archive,research/{soul-app,ai-evolution},system/{config,logs}}

# 移动文件到新位置
# ...
```

## 预期效果
1. **搜索速度**: 提升 50-70%
2. **搜索准确率**: 提升 30-50%
3. **内存使用**: 减少 20-30%
4. **维护性**: 大幅提升

## 风险评估
1. **数据迁移风险** - 需要完整备份
2. **搜索算法复杂度** - 可能影响性能
3. **依赖库兼容性** - 需要测试

## 备份策略
1. 迁移前完整备份
2. 增量备份 during migration
3. 验证备份完整性

## 时间估算
- 阶段1: 2-3小时
- 阶段2: 4-6小时  
- 阶段3: 8-12小时

## 优先级
P0: 增强全文搜索 (立即)
P1: 记忆文件重组 (今天)
P2: 本地嵌入模型 (本周)
P3: 高级功能 (下周)