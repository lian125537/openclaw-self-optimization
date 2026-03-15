# DeepSeek API 密钥更新脚本
# 使用方法: .\update-deepseek-key.ps1 "your-api-key-here"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$configPath = "$env:USERPROFILE\.openclaw\openclaw.json"

if (-not (Test-Path $configPath)) {
    Write-Error "配置文件不存在: $configPath"
    exit 1
}

# 读取配置文件
$configContent = Get-Content -Path $configPath -Raw

# 替换 API 密钥占位符
$updatedContent = $configContent -replace '"apiKey": "YOUR_DEEPSEEK_API_KEY"', "`"apiKey`": `"$ApiKey`""

# 写回配置文件
Set-Content -Path $configPath -Value $updatedContent -NoNewline

Write-Host "✅ DeepSeek API 密钥已更新！" -ForegroundColor Green
Write-Host "请重启 OpenClaw Gateway 使配置生效:" -ForegroundColor Yellow
Write-Host "  openclaw gateway restart" -ForegroundColor Cyan