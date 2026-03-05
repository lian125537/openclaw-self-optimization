# OpenClaw 自我优化系统

基于 GitHub Actions 的自动化自我优化系统，实现 OpenClaw 能力的几何增长。

## 🎯 目标

- 自动化能力追踪和分析
- 智能技能推荐和安装
- 每日自动优化流程
- 实现能力的指数级增长

## 📁 项目结构

```
openclaw-self-optimization/
├── .github/
│   └── workflows/
│       ├── daily-analysis.yml      # 每日能力分析
│       ├── skill-recommendation.yml # 技能推荐
│       └── auto-install.yml        # 自动安装
├── scripts/
│   ├── analyze-capabilities.py     # 能力分析脚本
│   ├── recommend-skills.py         # 技能推荐脚本
│   ├── auto-install.py             # 自动安装脚本
│   └── utils/
│       └── openclaw_helper.py      # OpenClaw 辅助函数
├── data/
│   ├── capability-metrics.json     # 能力指标数据
│   ├── skill-usage.json            # 技能使用统计
│   └── recommendations.json        # 推荐记录
├── docs/
│   ├── optimization-log.md         # 优化日志
│   └── capability-report.md        # 能力报告模板
└── config/
    └── settings.yml                # 系统配置
```

## 🚀 快速开始

### 1. 配置 GitHub 认证

```bash
# 方法 1: 使用 GitHub CLI (推荐)
gh auth login

# 方法 2: 使用 Personal Access Token
gh auth login --with-token < your-token.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
GITHUB_TOKEN=your_github_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. 启动自动化系统

```bash
# 手动运行一次分析
python scripts/analyze-capabilities.py

# 或直接使用 GitHub Actions
# 系统会每天凌晨 2 点自动运行
```

## 📊 能力指标

系统会追踪以下指标：

- **技能数量**：已安装技能 vs 总技能
- **技能使用频率**：每个技能的使用次数
- **任务成功率**：任务执行成功比例
- **响应速度**：平均响应时间
- **自动化程度**：自动化任务占比

## 🔧 核心功能

### 1. 能力分析
- 每日自动分析 OpenClaw 状态
- 识别能力缺口和优化机会
- 生成详细的能力报告

### 2. 智能推荐
- 基于任务模式推荐技能
- 考虑技能依赖关系
- 生成安装优先级

### 3. 自动安装
- 一键安装推荐技能
- 自动化依赖处理
- 安装验证和测试

### 4. 效果追踪
- 记录优化前后对比
- 追踪能力增长趋势
- 生成可视化报告

## 📈 预期效果

| 阶段 | 自动化程度 | 更迭速度 | 能力增长 |
|------|------------|----------|----------|
| 当前 | 65/100 | 每周 1-2 次 | 线性增长 |
| 系统上线后 | 85/100 | 每天自动 | 指数增长 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License