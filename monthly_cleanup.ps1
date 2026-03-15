# 每月 Downloads 目录清理脚本
# 执行频率：每月一次
# 功能：自动清理无用文件，保留 essential 文件

Write-Host "=== 每月 Downloads 目录清理 ===" -ForegroundColor Cyan
Write-Host "执行时间: $(Get-Date)" -ForegroundColor Yellow

# 定义要保留的文件（essential 文件）
$keepFiles = @(
    "client_secret_2_366249906444-4n4ag7q4npgg931iq6ks0c2hdo68emf0.apps.googleusercontent.com.json",
    "gogcli_0.11.0_windows_amd64.zip",
    "gogcli-main.zip"
)

# 下载目录路径
$downloadsPath = "C:\Users\yodat\Downloads"

# 获取所有文件
$allFiles = Get-ChildItem -Path $downloadsPath -File

Write-Host "`n找到 $($allFiles.Count) 个文件" -ForegroundColor Yellow

# 统计信息
$totalSize = 0
$deletedCount = 0
$keptCount = 0
$deletedSize = 0

foreach ($file in $allFiles) {
    $totalSize += $file.Length
    
    if ($keepFiles -contains $file.Name) {
        # 保留文件
        $keptCount++
        Write-Host "✅ 保留: $($file.Name) ($([math]::Round($file.Length/1MB, 2)) MB)" -ForegroundColor Green
    } else {
        # 删除文件
        try {
            $fileSize = $file.Length
            $file | Remove-Item -Force -ErrorAction Stop
            $deletedCount++
            $deletedSize += $fileSize
            Write-Host "🗑️  删除: $($file.Name) ($([math]::Round($fileSize/1MB, 2)) MB)" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ 无法删除: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 显示清理报告
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "清理完成报告" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan

Write-Host "总文件数: $($allFiles.Count)" -ForegroundColor White
Write-Host "保留文件: $keptCount" -ForegroundColor Green
Write-Host "删除文件: $deletedCount" -ForegroundColor Yellow
Write-Host "释放空间: $([math]::Round($deletedSize/1MB, 2)) MB" -ForegroundColor Green
Write-Host "总占用空间: $([math]::Round($totalSize/1MB, 2)) MB" -ForegroundColor White

# 显示保留的文件
Write-Host "`n保留的文件列表:" -ForegroundColor Cyan
foreach ($file in $keepFiles) {
    $filePath = Join-Path $downloadsPath $file
    if (Test-Path $filePath) {
        $fileInfo = Get-Item $filePath
        Write-Host "  - $file ($([math]::Round($fileInfo.Length/1MB, 2)) MB)" -ForegroundColor White
    }
}

# 记录到日志
$logPath = "C:\Users\yodat\.openclaw\workspace\cleanup_logs"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force
}

$logFile = Join-Path $logPath "cleanup_$(Get-Date -Format 'yyyy-MM-dd').log"
$logContent = @"
清理时间: $(Get-Date)
总文件数: $($allFiles.Count)
保留文件: $keptCount
删除文件: $deletedCount
释放空间: $([math]::Round($deletedSize/1MB, 2)) MB

保留文件:
$($keepFiles -join "`n")

删除文件列表:
$(Get-ChildItem $downloadsPath -File | Where-Object { $keepFiles -notcontains $_.Name } | ForEach-Object { "  - $($_.Name)" } | Out-String)
"@

$logContent | Out-File -FilePath $logFile -Encoding UTF8
Write-Host "`n日志已保存: $logFile" -ForegroundColor Cyan

Write-Host "`n✅ 每月清理任务完成!" -ForegroundColor Green