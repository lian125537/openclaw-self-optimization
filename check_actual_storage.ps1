# 检查Google Drive实际存储情况

Write-Host "🔍 检查Google Drive实际存储情况" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 加载令牌
$tokenPath = "google_drive_integration\config\tokens.json"
if (-not (Test-Path $tokenPath)) {
    Write-Host "❌ 令牌文件不存在，请先完成授权" -ForegroundColor Red
    exit 1
}

$tokens = Get-Content $tokenPath -Raw | ConvertFrom-Json
$accessToken = $tokens.access_token

# 获取详细的存储信息
Write-Host "📊 获取Google Drive存储详情..." -ForegroundColor Yellow

$url = "https://www.googleapis.com/drive/v3/about?fields=user,storageQuota"
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

try {
    $driveInfo = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ Google Drive存储信息：" -ForegroundColor Green
    Write-Host "=" * 40 -ForegroundColor DarkGray
    
    # 用户信息
    Write-Host "👤 用户信息：" -ForegroundColor Yellow
    Write-Host "  名称: $($driveInfo.user.displayName)" -ForegroundColor Gray
    Write-Host "  邮箱: $($driveInfo.user.emailAddress)" -ForegroundColor Gray
    
    # 存储配额
    Write-Host "`n💾 存储配额：" -ForegroundColor Yellow
    
    $limitGB = [math]::Round($driveInfo.storageQuota.limit/1GB, 2)
    $usageGB = [math]::Round($driveInfo.storageQuota.usage/1GB, 2)
    $usageInDriveGB = [math]::Round($driveInfo.storageQuota.usageInDrive/1GB, 2)
    
    Write-Host "  总空间: $limitGB GB" -ForegroundColor Gray
    
    if ($driveInfo.storageQuota.usage -gt 0) {
        $usagePercent = [math]::Round(($driveInfo.storageQuota.usage / $driveInfo.storageQuota.limit) * 100, 2)
        Write-Host "  已使用: $usageGB GB ($usagePercent%)" -ForegroundColor Gray
    }
    
    if ($driveInfo.storageQuota.usageInDrive -gt 0) {
        $usageInDrivePercent = [math]::Round(($driveInfo.storageQuota.usageInDrive / $driveInfo.storageQuota.limit) * 100, 2)
        Write-Host "  Drive使用: $usageInDriveGB GB ($usageInDrivePercent%)" -ForegroundColor Gray
    }
    
    # 计算剩余空间
    $remainingGB = [math]::Round(($driveInfo.storageQuota.limit - $driveInfo.storageQuota.usage)/1GB, 2)
    Write-Host "  剩余空间: $remainingGB GB" -ForegroundColor Gray
    
    # 检查是否是2TB
    $is2TB = $driveInfo.storageQuota.limit -ge (2 * 1TB)
    
    if ($is2TB) {
        Write-Host "`n🎉 状态: ✅ 已拥有2TB存储空间！" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ 状态: 当前不是2TB存储" -ForegroundColor Yellow
        
        # 显示当前套餐信息
        Write-Host "`n📋 当前存储套餐：" -ForegroundColor Yellow
        
        if ($limitGB -eq 15) {
            Write-Host "  套餐: Google免费套餐 (15GB)" -ForegroundColor Gray
            Write-Host "  建议: 升级到Google One 2TB套餐" -ForegroundColor Yellow
        } elseif ($limitGB -eq 100) {
            Write-Host "  套餐: Google One 100GB套餐" -ForegroundColor Gray
            Write-Host "  建议: 升级到2TB套餐" -ForegroundColor Yellow
        } elseif ($limitGB -eq 200) {
            Write-Host "  套餐: Google One 200GB套餐" -ForegroundColor Gray
            Write-Host "  建议: 升级到2TB套餐" -ForegroundColor Yellow
        } else {
            Write-Host "  套餐: 自定义套餐 ($limitGB GB)" -ForegroundColor Gray
        }
    }
    
    # 列出主要文件类型
    Write-Host "`n📁 主要文件类型分析：" -ForegroundColor Yellow
    
    $fileTypes = @{
        "application/vnd.google-apps.document" = "Google文档"
        "application/vnd.google-apps.spreadsheet" = "Google表格"
        "application/vnd.google-apps.presentation" = "Google幻灯片"
        "application/vnd.google-apps.folder" = "文件夹"
        "image/jpeg" = "JPEG图片"
        "image/png" = "PNG图片"
        "application/pdf" = "PDF文件"
        "video/mp4" = "MP4视频"
        "text/plain" = "文本文件"
    }
    
    foreach ($mimeType in $fileTypes.Keys) {
        $query = "mimeType='$mimeType' and trashed=false"
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
        $listUrl = "https://www.googleapis.com/drive/v3/files?q=$encodedQuery&fields=files(size)"
        
        try {
            $response = Invoke-RestMethod -Uri $listUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
            
            if ($response.files) {
                $totalSize = ($response.files | Measure-Object -Property size -Sum).Sum
                if ($totalSize -gt 0) {
                    $sizeMB = [math]::Round($totalSize/1MB, 2)
                    Write-Host "  $($fileTypes[$mimeType]): $sizeMB MB" -ForegroundColor Gray
                }
            }
        } catch {
            # 跳过错误
        }
    }
    
    # 列出我们的OpenClaw文件夹
    Write-Host "`n📂 OpenClaw文件夹：" -ForegroundColor Yellow
    
    $folderConfigPath = "google_drive_integration\config\folders.json"
    if (Test-Path $folderConfigPath) {
        $folders = Get-Content $folderConfigPath -Raw | ConvertFrom-Json
        
        foreach ($folder in $folders.PSObject.Properties) {
            if ($folder.Name -like "*_folder_id") {
                $folderId = $folder.Value
                $folderName = $folder.Name.Replace("_folder_id", "").Replace("_", " ")
                
                # 获取文件夹信息
                $folderUrl = "https://www.googleapis.com/drive/v3/files/$folderId?fields=name,size"
                try {
                    $folderInfo = Invoke-RestMethod -Uri $folderUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
                    
                    if ($folderInfo.size) {
                        $folderSizeMB = [math]::Round($folderInfo.size/1MB, 2)
                        Write-Host "  $folderName: $folderSizeMB MB" -ForegroundColor Gray
                    } else {
                        Write-Host "  $folderName: 空文件夹" -ForegroundColor Gray
                    }
                } catch {
                    Write-Host "  $folderName: 无法获取大小" -ForegroundColor Gray
                }
            }
        }
    }
    
    Write-Host "=" * 60 -ForegroundColor DarkGray
    
    # 总结
    if ($is2TB) {
        Write-Host "🎉 完美！你已拥有2TB Google Drive存储空间！" -ForegroundColor Green
        Write-Host "🚀 OpenClaw记忆系统可以充分利用2TB空间存储记忆！" -ForegroundColor Green
    } else {
        Write-Host "📋 当前存储情况：" -ForegroundColor Yellow
        Write-Host "  • 总空间: $limitGB GB" -ForegroundColor White
        Write-Host "  • 已使用: $usageGB GB" -ForegroundColor White
        Write-Host "  • 剩余: $remainingGB GB" -ForegroundColor White
        
        Write-Host "`n💡 建议：" -ForegroundColor Cyan
        Write-Host "  1. 如需2TB空间，请升级到Google One 2TB套餐" -ForegroundColor White
        Write-Host "  2. 当前空间足够存储大量记忆文件" -ForegroundColor White
        Write-Host "  3. 我们的记忆系统会自动优化存储使用" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ 获取存储信息失败: $($_.Exception.Message)" -ForegroundColor Red
}