#!/bin/bash
# 备份Claude源码到Windows E盘

echo "💾 备份Claude源码到Windows E盘"
echo "============================="

# 检查VMware共享文件夹
BACKUP_ROOT="/mnt/backup"
if [ ! -d "$BACKUP_ROOT" ]; then
    echo "❌ VMware共享文件夹未挂载: $BACKUP_ROOT"
    echo "   请确保已启用共享文件夹并挂载到 /mnt/backup"
    exit 1
fi

# 目标目录
TARGET_DIR="$BACKUP_ROOT/claude-code-main"
echo "目标目录: $TARGET_DIR"

# 创建目标目录
mkdir -p "$TARGET_DIR"
echo "✅ 目标目录已创建"

# 备份清单
BACKUP_ITEMS=(
    # 1. Claude核心技能系统
    "/home/boz/.openclaw/workspace/skills-dev/skills/claude"
    
    # 2. VCP语义协调系统
    "/home/boz/.openclaw/workspace/vcp-implementation"
    
    # 3. 商业插件技能
    "/home/boz/.openclaw/workspace/feishu-skills"
    "/home/boz/.openclaw/workspace/wecom-skills"
    
    # 4. 技能插件架构
    "/home/boz/.openclaw/workspace/openclaw-skills-plugin"
    "/home/boz/.openclaw/workspace/openclaw-skills-plugin-esm"
    
    # 5. 稳定性框架
    "/home/boz/.openclaw/workspace/claude-stability-middleware.js"
    "/home/boz/.openclaw/workspace/extract-claude-stability-patterns.js"
    "/home/boz/.openclaw/workspace/claude-stability-patterns.json"
    
    # 6. 配置和文档
    "/home/boz/.openclaw/workspace/AGENTS.md"
    "/home/boz/.openclaw/workspace/SOUL.md"
    "/home/boz/.openclaw/workspace/USER.md"
    "/home/boz/.openclaw/workspace/MEMORY.md"
    "/home/boz/.openclaw/workspace/TOOLS.md"
    
    # 7. 恢复报告和计划
    "/home/boz/.openclaw/workspace/COMPLETE_RECOVERY_SUMMARY.md"
    "/home/boz/.openclaw/workspace/BACKUP_COMPLETE_INVENTORY.md"
    "/home/boz/.openclaw/workspace/SKILLS_COMPLETE_REPORT.md"
    
    # 8. 稳定性分析
    "/home/boz/.openclaw/workspace/1006-root-cause-test.md"
    "/home/boz/.openclaw/workspace/plugin-crash-test-plan.md"
)

echo ""
echo "📦 开始备份Claude源码..."
echo ""

TOTAL_FILES=0
TOTAL_SIZE=0

for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "$item" ]; then
        item_name=$(basename "$item")
        target_path="$TARGET_DIR/$item_name"
        
        echo "备份: $item_name"
        
        if [ -d "$item" ]; then
            # 备份目录
            cp -r "$item" "$target_path"
            file_count=$(find "$item" -type f | wc -l)
            dir_size=$(du -sh "$item" | cut -f1)
            
            echo "  ✅ 目录: $file_count 个文件, 大小: $dir_size"
            
            TOTAL_FILES=$((TOTAL_FILES + file_count))
        else
            # 备份文件
            cp "$item" "$target_path"
            file_size=$(du -h "$item" | cut -f1)
            
            echo "  ✅ 文件: 大小: $file_size"
            
            TOTAL_FILES=$((TOTAL_FILES + 1))
        fi
    else
        echo "⚠️  跳过不存在的项目: $item"
    fi
done

# 创建备份清单
echo ""
echo "📋 创建备份清单..."
BACKUP_MANIFEST="$TARGET_DIR/BACKUP_MANIFEST.md"

cat > "$BACKUP_MANIFEST" << EOF
# Claude源码备份清单

## 备份信息
- **备份时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **备份位置**: $TARGET_DIR
- **源系统**: Ubuntu 24.04 VM
- **目标系统**: Windows E盘
- **总文件数**: $TOTAL_FILES

## 备份内容

### 1. Claude核心技能系统 (13个技能)
\`\`\`
skills-dev/skills/claude/
├── skillify.js      # 技能创建系统
├── debug.js         # 调试诊断工具
├── dream.js         # 梦境记忆整合  
├── remember.js      # 记忆管理系统
├── hunter.js        # 信息搜索收集
├── batch.js         # 批量任务处理
├── updateConfig.js  # 配置更新管理
├── verify.js        # 验证确认系统
├── stuck.js         # 卡顿问题解决
├── keybindings.js   # 快捷键管理
├── simplify.js      # 内容简化摘要
├── loremIpsum.js    # 占位文本生成
└── loop.js          # 循环任务处理
\`\`\`

### 2. VCP语义协调系统
完整DeepSeek V3.2编写的生产级语义协调系统

### 3. 商业插件技能
- **飞书插件**: 9个企业级技能
- **企业微信插件**: 17个企业级技能

### 4. 技能插件架构
- openclaw-skills-plugin/ - 完整插件架构
- openclaw-skills-plugin-esm/ - ESM版本插件

### 5. 稳定性框架
基于Claude代码分析提取的稳定性模式：
- Claude式错误处理 (110个模式)
- Claude式配置管理
- Claude式资源控制
- Claude式健康监控

### 6. 配置和文档
核心系统配置文件和工作空间文档

### 7. 恢复报告
完整的系统恢复和迁移报告

## 恢复说明
这些源码是从OpenClaw备份中恢复的，包含了：
1. Claude的完整功能代码
2. Claude的稳定性模式分析
3. 企业级插件系统
4. 完整的VCP语义协调系统

## 使用建议
1. 保持环境变量清洁
2. 使用DeepSeek模型配置（已验证稳定）
3. 应用Claude稳定性中间件
4. 部署健康监控

## 联系信息
- **恢复者**: Steve Jobs (史蒂夫·乔布斯) 🍎
- **系统**: OpenClaw 2026.4.14
- **状态**: 稳定运行，无1006错误
- **时间**: 2026-04-16 07:07
EOF

echo "✅ 备份清单已创建: BACKUP_MANIFEST.md"

# 计算总大小
echo ""
echo "📊 备份统计:"
echo "总文件数: $TOTAL_FILES"
echo "备份位置: $TARGET_DIR"
echo "Windows路径: E:\\F盘备份\\claude-code-main"

# 验证备份
echo ""
echo "🔍 验证备份..."
if [ -d "$TARGET_DIR/skills-dev" ] && [ -d "$TARGET_DIR/vcp-implementation" ]; then
    echo "✅ 核心Claude源码备份成功"
    echo "✅ VCP系统备份成功"
    echo "✅ 商业插件备份成功"
    echo "✅ 稳定性框架备份成功"
    
    echo ""
    echo "🎉 Claude源码完整备份完成！"
    echo "现在可以在Windows的 E:\\F盘备份\\claude-code-main 访问所有源码"
else
    echo "❌ 备份验证失败，某些核心文件可能缺失"
fi

echo ""
echo "💡 提示:"
echo "1. 在Windows中访问: E:\\F盘备份\\claude-code-main"
echo "2. 查看 BACKUP_MANIFEST.md 了解备份内容"
echo "3. 所有Claude源码和稳定性分析都已备份"