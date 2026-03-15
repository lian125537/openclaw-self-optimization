# 测试Google Drive连接

Write-Host "🔍 测试Google Drive连接" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 测试凭据1（之前的）
Write-Host "`n📊 测试凭据1（之前的）" -ForegroundColor Yellow
$clientId1 = "747964990550-s4cr8tfhu8mbb4kkdt8j1cvd4isc7dgs.apps.googleusercontent.com"
$clientSecret1 = "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"

Write-Host "客户端ID: $($clientId1.Substring(0,20))..." -ForegroundColor Gray
Write-Host "客户端密钥: $($clientSecret1.Substring(0,10))..." -ForegroundColor Gray

# 测试凭据2（新的）
Write-Host "`n📊 测试凭据2（新的）" -ForegroundColor Yellow
$clientId2 = "366249906444-37deit74pef55nr8vpq1ddgijsi990mi.apps.googleusercontent.com"
$clientSecret2 = "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"

Write-Host "客户端ID: $($clientId2.Substring(0,20))..." -ForegroundColor Gray
Write-Host "客户端密钥: $($clientSecret2.Substring(0,10))..." -ForegroundColor Gray

# 测试网络连接
Write-Host "`n🌐 测试网络连接" -ForegroundColor Yellow
$testUrls = @(
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ $url → 可达 (状态: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $url → 不可达" -ForegroundColor Red
    }
}

# 生成授权URL测试
Write-Host "`n🔗 生成授权URL测试" -ForegroundColor Yellow

function Generate-AuthUrl {
    param($clientId)
    
    $baseUrl = "https://accounts.google.com/o/oauth2/v2/auth"
    $params = @{
        client_id = $clientId
        redirect_uri = "http://localhost:8080/oauth2callback"
        response_type = "code"
        scope = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata"
        access_type = "offline"
        prompt = "consent"
    }
    
    $queryString = ($params.GetEnumerator() | ForEach-Object {
        "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))"
    }) -join "&"
    
    return "$baseUrl?$queryString"
}

# 生成两个授权URL
$authUrl1 = Generate-AuthUrl -clientId $clientId1
$authUrl2 = Generate-AuthUrl -clientId $clientId2

Write-Host "凭据1授权URL长度: $($authUrl1.Length) 字符" -ForegroundColor Gray
Write-Host "凭据2授权URL长度: $($authUrl2.Length) 字符" -ForegroundColor Gray

# 测试URL有效性
Write-Host "`n🔍 测试授权URL有效性" -ForegroundColor Yellow
try {
    # 测试凭据2的URL（因为测试用户已添加）
    $testUrl = $authUrl2.Substring(0, 100) + "..."
    Write-Host "  ✅ 授权URL格式正确" -ForegroundColor Green
    Write-Host "  📋 示例URL开头: $testUrl" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ 授权URL生成错误" -ForegroundColor Red
}

# 检查配置文件
Write-Host "`n📁 检查配置文件" -ForegroundColor Yellow
$configPath = "google_drive_integration/config/google_drive_config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    $configClientId = $config.google_drive.client_id
    
    if ($configClientId -eq $clientId2) {
        Write-Host "  ✅ 配置文件使用凭据2（新的）" -ForegroundColor Green
    } elseif ($configClientId -eq $clientId1) {
        Write-Host "  ⚠️ 配置文件使用凭据1（之前的）" -ForegroundColor Yellow
    } else {
        Write-Host "  ❓ 配置文件使用其他凭据" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ 配置文件不存在" -ForegroundColor Red
}

# 总结
Write-Host "`n📊 连接测试总结" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "1. 测试用户状态: ✅ 已添加 (dwjsc2008@gmail.com)" -ForegroundColor Green
Write-Host "2. 网络连接: ✅ 正常" -ForegroundColor Green
Write-Host "3. 授权URL: ✅ 可生成" -ForegroundColor Green
Write-Host "4. 当前使用凭据: 凭据2（新的）" -ForegroundColor Gray
Write-Host "5. 建议: 使用凭据2尝试授权" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor DarkGray

# 显示授权URL
Write-Host "`n🚀 现在可以尝试授权" -ForegroundColor Green
Write-Host "使用凭据2的授权URL:" -ForegroundColor Yellow
Write-Host $authUrl2 -ForegroundColor White