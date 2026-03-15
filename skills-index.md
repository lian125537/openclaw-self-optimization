# OpenClaw 技能索引
## Steve Jobs "疯狂般的美好" 方法

### 🔍 技能审核状态
*审核日期：2026-03-14*
*审核人员：Steve Jobs 思维模式*

### 📊 总体统计
- **总技能数**：44 个
- **已验证**：3 个（正在验证中）
- **需要依赖**：取决于每个技能
- **平台特定**：需要进一步检查

### ✅ 已检查技能

#### 1. Camera (相机技能)
- **状态**：✅ 可用
- **描述**：从 MacBook 摄像头拍摄照片
- **平台**：macOS (需要 avfoundation)
- **依赖**：ffmpeg
- **备注**：支持双摄像头(Brio/FaceTime)，需要5秒预热

#### 2. Vision Sandbox (视觉沙箱)
- **状态**：✅ 可用
- **描述**：通过 Gemini 的代码执行框进行视觉分析
- **平台**：跨平台
- **依赖**：uv, GEMINI_API_KEY
- **备注**：用于UI审计、空间定位、视觉推理

#### 3. Coding (编码风格)
- **状态**：✅ 可用
- **描述**：记录和适应用户编码偏好
- **平台**：跨平台
- **依赖**：无
- **备注**：本地存储，仅从显式反馈学习

### 📋 待检查技能类别

#### 平台集成类
- android-remote-control
- things-mac (macOS only)
- calendar
- slack
- discord-chat
- trello
- notion
- sonoscli
- spotify-player

#### AI与自动化类
- adaptive-reasoning
- agent-browser
- agentic-coding
- agentic-workflow-automation
- ai-web-automation
- automation-workflows
- browser-automation
- computer-vision-expert

#### 生产力类
- email-daily-summary
- file-manager
- planning-with-files
- proactive-agent
- summarize
- task-planning

#### 系统与性能类
- health-guardian
- llm-speedtest
- performance-profiler
- response-speed-test
- token-budget-monitor
- token-manager

#### 其他核心功能
- 1password
- elite-longterm-memory
- gog
- goplaces
- memory-hygiene
- nano-pdf
- obsidian-cli-official
- self-improving-agent
- session-logs
- tavily-search
- unified-reasoning

### 🚀 加载计划

#### 阶段1：核心基础设施技能
1. **health-guardian** - 系统健康检查
2. **file-manager** - 文件管理
3. **browser-automation** - 浏览器自动化

#### 阶段2：AI和智能技能
1. **agentic-coding** - 智能编码
2. **adaptive-reasoning** - 自适应推理
3. **computer-vision-expert** - 计算机视觉

#### 阶段3：平台集成技能
1. **calendar** - 日历集成
2. **slack** - Slack集成
3. **trello** - Trello集成

### ⚠️ 潜在问题
1. **平台兼容性**：部分技能可能是macOS特定（things-mac）
2. **依赖管理**：某些需要外部工具（ffmpeg, uv）
3. **API密钥**：需要GEMINI_API_KEY等环境变量
4. **配置需求**：第三方服务集成需要配置

### 💡 Steve Jobs的建议
根据我的设计哲学：

1. **质量 > 数量**：优先加载高质量的、经过测试的技能
2. **简单性**：避免复杂的依赖链
3. **用户感知**：技能的"启用"应该是无缝的

### 📝 行动项目
1. 创建技能依赖检查脚本
2. 验证关键技能的可用性
3. 设置必要的环境变量
4. 创建技能使用指南

---

*"创新区分领导者与跟随者。"
- Steve Jobs*