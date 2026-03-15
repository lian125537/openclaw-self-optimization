# 每周清理脚本 - 由88创建
# 执行时间：每周日凌晨2点

# 导入日志模块
. "$PWD\cleanup_logger.ps1"

Write-Log "=== 每周系统清理开始 ===" "INFO"
Write-Host "=== 每周系统清理开始 ===" -ForegroundColor Green
Write-Host "开始时间: $(Get-Date)" -ForegroundColor Yellow

# 1. 清理Windows临时文件
Write-Host "清理Windows临时文件..." -ForegroundColor Cyan
Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue

# 2. 清理用户临时文件
Write-Host "清理用户临时文件..." -ForegroundColor Cyan
Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# 3. 清理浏览器缓存（Edge）
Write-Host "清理Edge浏览器缓存..." -ForegroundColor Cyan
$edgeCache = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
if (Test-Path $edgeCache) {
    Remove-Item "$edgeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. 清理下载文件夹（保留最近7天的文件）
Write-Host "清理下载文件夹（7天前）..." -ForegroundColor Cyan
$downloads = [Environment]::GetFolderPath("Downloads")
$cutoffDate = (Get-Date).AddDays(-7)
Get-ChildItem $downloads -File | Where-Object {$_.LastWriteTime -lt $cutoffDate} | Remove-Item -Force -ErrorAction SilentlyContinue

# 5. 清理回收站
Write-Host "清空回收站..." -ForegroundColor Cyan
Clear-RecycleBin -Force -ErrorAction SilentlyContinue

# 6. 停止不必要的服务
Write-Host "停止不必要的服务..." -ForegroundColor Cyan
$servicesToStop = @("Apple Mobile Device Service", "Bonjour Service", "i4ToolsService")
foreach ($service in $servicesToStop) {
    try {
        Stop-Service $service -Force -ErrorAction Stop
        Write-Host "  ✓ $service 已停止" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $service 停止失败: $_" -ForegroundColor Red
    }
}

Write-Log "=== 每周清理完成 ===" "INFO"
Write-Host "=== 每周清理完成 ===" -ForegroundColor Green
Write-Host "完成时间: $(Get-Date)" -ForegroundColor Yellow
Write-Host "释放空间: 请查看磁盘清理报告" -ForegroundColor Magenta

# 记录磁盘空间变化
$diskBefore = Get-PSDrive C | Select-Object Used, Free
Write-Log "清理前磁盘空间: 已用 $([math]::Round($diskBefore.Used/1GB,2))GB, 可用 $([math]::Round($diskBefore.Free/1GB,2))GB" "INFO"