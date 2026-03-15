# 每月 Downloads 目录清理脚本（简化版）
Write-Host "=== 每月 Downloads 目录清理 ===" -ForegroundColor Cyan

# 定义要保留的文件
$keepFiles = @(
    "client_secret_2_366249906444-4n4ag7q4npgg931iq6ks0c2hdo68emf0.apps.googleusercontent.com.json",
    "gogcli_0.11.0_windows_amd64.zip",
    "gogcli-main.zip"
)

# 下载目录路径
$downloadsPath = "C:\Users\yodat\Downloads"

# 获取所有文件
$allFiles = Get-ChildItem -Path $downloadsPath -File

Write-Host "找到 $($allFiles.Count) 个文件" -ForegroundColor Yellow

# 统计信息
$deletedCount = 0
$keptCount = 0

foreach ($file in $allFiles) {
    if ($keepFiles -contains $file.Name) {
        # 保留文件
        $keptCount++
        Write-Host "保留: $($file.Name)" -ForegroundColor Green
    } else {
        # 删除文件
        try {
            $file | Remove-Item -Force -ErrorAction Stop
            $deletedCount++
            Write-Host "删除: $($file.Name)" -ForegroundColor Yellow
        } catch {
            Write-Host "无法删除: $($file.Name)" -ForegroundColor Red
        }
    }
}

# 显示清理报告
Write-Host "`n清理完成!" -ForegroundColor Cyan
Write-Host "保留文件: $keptCount" -ForegroundColor Green
Write-Host "删除文件: $deletedCount" -ForegroundColor Yellow

# 显示保留的文件
Write-Host "`n保留的文件列表:" -ForegroundColor Cyan
foreach ($file in $keepFiles) {
    Write-Host "  - $file" -ForegroundColor White
}