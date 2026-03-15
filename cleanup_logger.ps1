# 清理日志记录器
param([string]$Message, [string]$Level = "INFO")

$logDir = "C:\Users\yodat\.openclaw\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$logFile = "$logDir\weekly_cleanup.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logEntry = "[$timestamp] [$Level] $Message"

Add-Content -Path $logFile -Value $logEntry
Write-Output $logEntry