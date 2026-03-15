# 清理 Downloads 目录脚本
Write-Host "=== 清理 Downloads 目录 ===" -ForegroundColor Cyan

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

Write-Host "`n找到 $($allFiles.Count) 个文件" -ForegroundColor Yellow
Write-Host "保留 $($keepFiles.Count) 个文件" -ForegroundColor Green

# 删除不需要的文件
$deletedCount = 0
$keptCount = 0

foreach ($file in $allFiles) {
    if ($keepFiles -contains $file.Name) {
        Write-Host "✅ 保留: $($file.Name)" -ForegroundColor Green
        $keptCount++
    } else {
        try {
            # 先移动到回收站（更安全）
            $shell = New-Object -ComObject Shell.Application
            $folder = $shell.Namespace(0x0A)  # 回收站
            $folder.MoveHere($file.FullName)
            
            Write-Host "🗑️  已移动到回收站: $($file.Name)" -ForegroundColor Yellow
            $deletedCount++
        } catch {
            Write-Host "❌ 无法删除: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n清理完成!" -ForegroundColor Cyan
Write-Host "保留文件: $keptCount" -ForegroundColor Green
Write-Host "删除文件: $deletedCount" -ForegroundColor Yellow

# 显示保留的文件
Write-Host "`n保留的文件列表:" -ForegroundColor Cyan
foreach ($file in $keepFiles) {
    Write-Host "  - $file" -ForegroundColor White
}