#!/usr/bin/env pwsh
# 自动学习记录脚本 - 编码修复版 (UTF-8 BOM)
# 使用: .\.learnings\record_learning.ps1 -Type "Skill Mastery" -Content "学习内容"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Skill Mastery", "Tool Proficiency", "Cognitive Insights", "Optimization Innovations", "Pattern Recognition", "Security Hardening")]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Content,
    
    [Parameter(Mandatory=$false)]
    [string]$Source = "Unknown",
    
    [Parameter(Mandatory=$false)]
    [array]$ApplicationScenarios = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$ExpectedBenefit = "",
    
    [Parameter(Mandatory=$false)]
    [array]$ActionPlan = @(),
    
    [Parameter(Mandatory=$false)]
    [int]$ImportanceScore = 5,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verified = $false
)

# 获取当前时间
$timestamp = Get-Date -Format "yyyy-MM-dd"
$time = Get-Date -Format "HH:mm"
$learningFile = "C:\Users\yodat\.openclaw\workspace\.learnings\LEARNINGS.md"

# 类型表情符号
$typeEmoji = @{
    "Skill Mastery" = "🎯"
    "Tool Proficiency" = "🔧"
    "Cognitive Insights" = "💡"
    "Optimization Innovations" = "🚀"
    "Pattern Recognition" = "🔄"
    "Security Hardening" = "🛡️"
}

# 验证状态
$verifiedStatus = "⏳待验证"
if ($Verified.IsPresent) {
    $verifiedStatus = "✅已验证"
}

# 构建应用场景字符串
$scenariosStr = ""
if ($ApplicationScenarios.Count -gt 0) {
    foreach ($scenario in $ApplicationScenarios) {
        $scenariosStr += "- $scenario`n"
    }
} else {
    $scenariosStr = "- [暂无具体应用场景]"
}

# 构建行动计划字符串
$planStr = ""
if ($ActionPlan.Count -gt 0) {
    foreach ($plan in $ActionPlan) {
        $planStr += "1. $plan`n"
    }
} else {
    $planStr = "1. [暂无具体行动计划]"
}

# 构建学习记录
$learningRecord = @"

## $($typeEmoji[$Type]) 学习类型: $Type
**获取日期**: $timestamp $time
**来源**: $Source

**学习内容**:
$Content

**应用场景**:
$scenariosStr
**验证状态**: $verifiedStatus

**预期收益**:
$ExpectedBenefit

**行动计划**:
$planStr
**重要性评分**: $ImportanceScore/10

---
"@

# 读取现有内容，找到合适位置插入
try {
    $content = Get-Content $learningFile -Raw -Encoding UTF8
    
    # 找到"每周学习总结记录"的位置
    if ($content -match "(## 📅 每周学习总结记录.*?)(?=($|##))") {
        $beforeSection = $matches[1]
        $afterSection = $content.Substring($matches.Index + $matches.Length)
        
        # 在每周总结前插入
        $newContent = $content.Replace($beforeSection, "$learningRecord`n`n$beforeSection")
        Set-Content -Path $learningFile -Value $newContent -Encoding UTF8 -NoNewline
    } else {
        # 如果找不到该部分，在末尾追加
        Add-Content -Path $learningFile -Value "`n`n$learningRecord" -Encoding UTF8
    }
} catch {
    # 如果文件不存在或读取失败，创建新文件
    $fileContent = "# 📚 学习日志 (LEARNINGS.md)`n`n" +
                   "**启动日期**: $timestamp  $time GMT+8`n" +
                   "**模式**: proactive-agent 自我进化模式`n" +
                   "**维护者**: 史蒂夫·乔布斯`n`n" +
                   "---`n`n" +
                   "## 📝 学习记录`n`n" +
                   "$learningRecord`n" +
                   "## 📅 每周学习总结记录`n`n" +
                   "### 第1周: 2026年3月第3周`n" +
                   "**总结日期**: 2026-03-22 (周日)`n" +
                   "**总结内容**: [待生成]"
    
    Set-Content -Path $learningFile -Value $fileContent -Encoding UTF8
}

Write-Host "📚 学习已记录: $($typeEmoji[$Type]) $Type" -ForegroundColor Cyan
