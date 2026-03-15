#!/usr/bin/env pwsh
# 自动错误记录脚本 - 编码修复版 (UTF-8 BOM)
# 使用: .\.learnings\record_error.ps1 -Level "Minor" -Source "skill-name" -Description "错误描述"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Critical", "Major", "Minor", "Optimization")]
    [string]$Level,
    
    [Parameter(Mandatory=$true)]
    [string]$Source,
    
    [Parameter(Mandatory=$true)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [string]$Type = "Error",
    
    [Parameter(Mandatory=$false)]
    [array]$Steps = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$Impact = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RootCause = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TempSolution = "",
    
    [Parameter(Mandatory=$false)]
    [string]$PermSolution = ""
)

# 获取当前时间和错误ID
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$date = Get-Date -Format "yyyyMMdd"
$errorFile = "C:\Users\yodat\.openclaw\workspace\.learnings\ERRORS.md"

# 读取现有错误数量
$errorCount = 0
if (Test-Path $errorFile) {
    $content = Get-Content $errorFile -Raw
    $matches = [regex]::Matches($content, "### 错误ID: ERR-$date-\d{3}")
    $errorCount = $matches.Count
}

$errorId = "ERR-$date-" + ($errorCount + 1).ToString("000")

# 等级表情符号
$levelEmoji = @{
    "Critical" = "🔴"
    "Major" = "🟡"
    "Minor" = "🟠"
    "Optimization" = "🔵"
}

# 构建重现步骤字符串
$stepsStr = ""
if ($Steps.Count -gt 0) {
    foreach ($step in $Steps) {
        $stepsStr += "1. $step`n"
    }
} else {
    $stepsStr = "1. [无重现步骤]"
}

# 构建错误记录
$errorRecord = @"
### 错误ID: $errorId
**日期**: $timestamp
**等级**: $($levelEmoji[$Level])
**来源**: $Source
**类型**: $Type

**描述**: $Description

**重现步骤**:
$stepsStr
**影响**: $Impact

**根本原因**: $RootCause

**临时解决方案**: $TempSolution

**永久解决方案**: $PermSolution

**状态**: 🔴未修复
**修复日期**: 
**修复验证**: 

---
"@

# 追加到错误文件
Add-Content -Path $errorFile -Value $errorRecord -Encoding UTF8

Write-Host "✅ 错误已记录: $errorId" -ForegroundColor Green
