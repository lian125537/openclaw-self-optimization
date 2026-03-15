# 验证2TB存储空间

Write-Host "🔍 验证Google Drive 2TB存储空间" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor DarkGray

# 加载令牌
$tokenPath = "google_drive_integration\config\tokens.json"
if (-not (Test-Path $tokenPath)) {
    Write-Host "❌ 令牌文件不存在" -ForegroundColor Red
    exit 1
}

$tokens = Get-Content $tokenPath -Raw | ConvertFrom-Json
$accessToken = $tokens.access_token

Write-Host "📊 获取详细的存储配额信息..." -ForegroundColor Yellow

$url = "https://www.googleapis.com/drive/v3/about?fields=storageQuota,user"
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "✅ 获取存储信息成功" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor DarkGray
    
    # 显示原始数据
    Write-Host "📋 原始存储配额数据：" -ForegroundColor Yellow
    $response.storageQuota | Format-List | Out-String | Write-Host -ForegroundColor Gray
    
    # 计算各种单位
    $limit = $response.storageQuota.limit
    $usage = $response.storageQuota.usage
    $usageInDrive = $response.storageQuota.usageInDrive
    
    Write-Host "`n📊 存储容量分析：" -ForegroundColor Yellow
    
    # 以字节为单位显示
    Write-Host "  总限制: $limit 字节" -ForegroundColor Gray
    
    # 转换为各种单位
    $limitGB = [math]::Round($limit/1GB, 4)
    $limitTB = [math]::Round($limit/1TB, 4)
    
    $usageGB = [math]::Round($usage/1GB, 4)
    $usageTB = [math]::Round($usage/1TB, 4)
    
    $usageInDriveGB = [math]::Round($usageInDrive/1GB, 4)
    
    Write-Host "`n📈 单位转换：" -ForegroundColor Yellow
    Write-Host "  总空间: $limitGB GB ($limitTB TB)" -ForegroundColor Gray
    Write-Host "  已使用: $usageGB GB ($usageTB TB)" -ForegroundColor Gray
    Write-Host "  Drive使用: $usageInDriveGB GB" -ForegroundColor Gray
    
    # 计算剩余空间
    $remaining = $limit - $usage
    $remainingGB = [math]::Round($remaining/1GB, 4)
    $remainingTB = [math]::Round($remaining/1TB, 4)
    
    Write-Host "  剩余空间: $remainingGB GB ($remainingTB TB)" -ForegroundColor Gray
    
    # 计算使用百分比
    $usagePercent = [math]::Round(($usage / $limit) * 100, 4)
    Write-Host "  使用率: $usagePercent%" -ForegroundColor Gray
    
    # 判断是否是2TB
    Write-Host "`n🎯 2TB验证：" -ForegroundColor Yellow
    
    # 2TB = 2 * 1024^4 字节 = 2,199,023,255,552 字节
    $expected2TB = 2 * [math]::Pow(1024, 4)  # 2,199,023,255,552 字节
    $tolerance = 0.1 * $expected2TB  # 10%容差
    
    $isExactly2TB = $limit -eq $expected2TB
    $isCloseTo2TB = [math]::Abs($limit - $expected2TB) -lt $tolerance
    
    if ($isExactly2TB) {
        Write-Host "  ✅ 精确匹配：确实是2TB存储空间！" -ForegroundColor Green
        Write-Host "    理论值: $expected2TB 字节" -ForegroundColor Gray
        Write-Host "    实际值: $limit 字节" -ForegroundColor Gray
    } elseif ($isCloseTo2TB) {
        Write-Host "  ✅ 近似匹配：接近2TB存储空间" -ForegroundColor Green
        $differenceGB = [math]::Round(($limit - $expected2TB)/1GB, 2)
        Write-Host "    差异: $differenceGB GB" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️ 不是2TB存储空间" -ForegroundColor Yellow
        
        # 判断实际容量
        if ($limitGB -eq 15) {
            Write-Host "    实际容量: 15GB (Google免费套餐)" -ForegroundColor Gray
        } elseif ($limitGB -eq 100) {
            Write-Host "    实际容量: 100GB (Google One基础套餐)" -ForegroundColor Gray
        } elseif ($limitGB -eq 200) {
            Write-Host "    实际容量: 200GB (Google One标准套餐)" -ForegroundColor Gray
        } elseif ($limitGB -eq 2000) {
            Write-Host "    实际容量: 2TB (Google One高级套餐)" -ForegroundColor Gray
        } else {
            Write-Host "    实际容量: $limitGB GB" -ForegroundColor Gray
        }
    }
    
    # 显示用户信息
    Write-Host "`n👤 用户信息：" -ForegroundColor Yellow
    Write-Host "  名称: $($response.user.displayName)" -ForegroundColor Gray
    Write-Host "  邮箱: $($response.user.emailAddress)" -ForegroundColor Gray
    
    # 测试写入能力（创建测试文件）
    Write-Host "`n🧪 测试写入能力..." -ForegroundColor Yellow
    
    $testContent = @"
# Google Drive存储容量测试
测试时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
用户: $($response.user.emailAddress)
存储配额: $limitGB GB
已使用: $usageGB GB
剩余: $remainingGB GB

这是一个测试文件，用于验证Google Drive的写入能力。
文件大小: 约1KB
"@
    
    # 获取我们的记忆文件夹ID
    $folderConfigPath = "google_drive_integration\config\folders.json"
    if (Test-Path $folderConfigPath) {
        $folders = Get-Content $folderConfigPath -Raw | ConvertFrom-Json
        $memoryFolderId = $folders.memory_folder_id
        
        # 创建测试文件
        $testUrl = "https://www.googleapis.com/drive/v3/files"
        $testHeaders = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }
        
        $metadata = @{
            name = "storage_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
            parents = @($memoryFolderId)
        } | ConvertTo-Json
        
        try {
            $file = Invoke-RestMethod -Uri $testUrl -Method Post -Headers $testHeaders -Body $metadata -ErrorAction Stop
            
            # 上传内容
            $uploadUrl = "https://www.googleapis.com/upload/drive/v3/files/$($file.id)?uploadType=media"
            $uploadHeaders = @{
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "text/plain"
            }
            
            Invoke-RestMethod -Uri $uploadUrl -Method Patch -Headers $uploadHeaders -Body $testContent -ErrorAction Stop | Out-Null
            
            Write-Host "  ✅ 测试文件创建成功: $($file.id)" -ForegroundColor Green
            
            # 获取文件大小
            $fileUrl = "https://www.googleapis.com/drive/v3/files/$($file.id)?fields=size"
            $fileInfo = Invoke-RestMethod -Uri $fileUrl -Method Get -Headers $testHeaders -ErrorAction Stop
            
            if ($fileInfo.size) {
                $fileSizeKB = [math]::Round($fileInfo.size/1KB, 2)
                Write-Host "    文件大小: $fileSizeKB KB" -ForegroundColor Gray
            }
            
        } catch {
            Write-Host "  ⚠️ 测试文件创建失败: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # 总结
    Write-Host "`n🎯 验证总结：" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor DarkGray
    
    if ($isExactly2TB -or $isCloseTo2TB) {
        Write-Host "✅ 验证通过：你确实拥有2TB Google Drive存储空间！" -ForegroundColor Green
        Write-Host "  总容量: $limitGB GB" -ForegroundColor White
        Write-Host "  已使用: $usageGB GB" -ForegroundColor White
        Write-Host "  剩余: $remainingGB GB" -ForegroundColor White
        Write-Host "  使用率: $usagePercent%" -ForegroundColor White
        
        Write-Host "`n🚀 对于OpenClaw记忆系统：" -ForegroundColor Yellow
        Write-Host "  • 可用空间: $remainingGB GB" -ForegroundColor White
        Write-Host "  • 可存储: 数十年的记忆数据" -ForegroundColor White
        Write-Host "  • 可靠性: Google企业级存储" -ForegroundColor White
    } else {
        Write-Host "⚠️ 当前存储容量: $limitGB GB" -ForegroundColor Yellow
        Write-Host "  已使用: $usageGB GB" -ForegroundColor White
        Write-Host "  剩余: $remainingGB GB" -ForegroundColor White
        
        Write-Host "`n💡 建议：" -ForegroundColor Cyan
        Write-Host "  如需2TB空间，请升级到Google One 2TB套餐" -ForegroundColor White
        Write-Host "  当前空间也足够存储大量记忆文件" -ForegroundColor White
    }
    
    Write-Host "=" * 70 -ForegroundColor DarkGray
    
} catch {
    Write-Host "❌ 验证失败: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "错误详情: $errorBody" -ForegroundColor Red
    }
}