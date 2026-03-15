# Gmail 设置检查脚本
Write-Host "=== Gmail 监控配置检查 ===" -ForegroundColor Cyan

# 1. 检查 gog CLI 安装
Write-Host "`n1. 检查 gog CLI 安装..." -ForegroundColor Yellow
try {
    $version = & gog --version
    Write-Host "✅ gog CLI 已安装: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ gog CLI 未安装" -ForegroundColor Red
}

# 2. 检查服务账号配置
Write-Host "`n2. 检查服务账号配置..." -ForegroundColor Yellow
try {
    $authList = & gog auth list
    if ($authList -match "dwcjs2008@gmail.com") {
        Write-Host "✅ 服务账号已配置: dwcjs2008@gmail.com" -ForegroundColor Green
    } else {
        Write-Host "❌ 服务账号未配置" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 无法检查服务账号配置" -ForegroundColor Red
}

# 3. 检查服务账号文件
Write-Host "`n3. 检查服务账号文件..." -ForegroundColor Yellow
$saFile = "$env:APPDATA\gogcli\sa-*.json"
if (Test-Path $saFile) {
    $file = Get-ChildItem $saFile | Select-Object -First 1
    Write-Host "✅ 服务账号文件存在: $($file.Name)" -ForegroundColor Green
    
    # 检查文件内容
    $content = Get-Content $file.FullName | ConvertFrom-Json
    Write-Host "   客户邮箱: $($content.client_email)" -ForegroundColor Cyan
    Write-Host "   项目ID: $($content.project_id)" -ForegroundColor Cyan
    Write-Host "   类型: $($content.type)" -ForegroundColor Cyan
} else {
    Write-Host "❌ 服务账号文件不存在" -ForegroundColor Red
}

# 4. 检查网络代理设置
Write-Host "`n4. 检查网络代理设置..." -ForegroundColor Yellow
$proxySettings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
if ($proxySettings.ProxyEnable -eq 1) {
    Write-Host "✅ 系统代理已启用: $($proxySettings.ProxyServer)" -ForegroundColor Green
} else {
    Write-Host "❌ 系统代理未启用" -ForegroundColor Red
}

# 5. 检查环境变量
Write-Host "`n5. 检查环境变量..." -ForegroundColor Yellow
$httpProxy = [Environment]::GetEnvironmentVariable("HTTP_PROXY", "User")
$httpsProxy = [Environment]::GetEnvironmentVariable("HTTPS_PROXY", "User")
if ($httpProxy -and $httpsProxy) {
    Write-Host "✅ HTTP_PROXY: $httpProxy" -ForegroundColor Green
    Write-Host "✅ HTTPS_PROXY: $httpsProxy" -ForegroundColor Green
} else {
    Write-Host "❌ 环境变量未设置" -ForegroundColor Red
}

# 6. 测试网络连接
Write-Host "`n6. 测试网络连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ 网络连接正常 (状态码: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 网络连接失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. 测试 Gmail API 连接
Write-Host "`n7. 测试 Gmail API 连接..." -ForegroundColor Yellow
try {
    # 设置临时环境变量
    $env:HTTP_PROXY = "http://127.0.0.1:10792"
    $env:HTTPS_PROXY = "http://127.0.0.1:10792"
    
    # 尝试获取 Gmail 配置文件
    $gogResult = & gog gmail search "newer_than:1d" --max 1 --account dwcjs2008@gmail.com 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Gmail API 连接正常" -ForegroundColor Green
    } else {
        Write-Host "❌ Gmail API 连接失败" -ForegroundColor Red
        Write-Host "   错误: $gogResult" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Gmail API 测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. 提供解决方案
Write-Host "`n=== 解决方案建议 ===" -ForegroundColor Cyan
Write-Host "如果遇到问题，请按以下顺序检查：" -ForegroundColor Yellow
Write-Host "1. 确保 Google Cloud Console 中已启用 Gmail API" -ForegroundColor White
Write-Host "2. 确保服务账号有访问 Gmail 的权限" -ForegroundColor White
Write-Host "3. 检查服务账号是否需要域委派权限" -ForegroundColor White
Write-Host "4. 参考 GitHub 上的 gogcli 项目获取更多帮助" -ForegroundColor White

Write-Host "`nGitHub 项目: https://github.com/steipete/gogcli" -ForegroundColor Cyan