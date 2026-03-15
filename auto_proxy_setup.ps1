# 自动化代理配置脚本
# 功能：自动检测并配置系统代理，解决命令行工具无法访问Google服务的问题

# 步骤1：检测系统代理设置
Write-Host "步骤1: 检测系统代理设置..." -ForegroundColor Yellow
$proxySettings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

if ($proxySettings.ProxyEnable -eq 1) {
    Write-Host "✅ 系统代理已启用" -ForegroundColor Green
    $proxyServer = $proxySettings.ProxyServer
    Write-Host "📋 代理服务器: $proxyServer" -ForegroundColor Cyan
    
    # 步骤2：设置环境变量
    Write-Host "步骤2: 设置环境变量..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://$proxyServer", "User")
    [Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://$proxyServer", "User")
    Write-Host "✅ 环境变量已设置" -ForegroundColor Green
    
    # 步骤3：测试网络连接
    Write-Host "步骤3: 测试网络连接..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ 网络连接正常" -ForegroundColor Green
        Write-Host "状态码: $($response.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 网络连接失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # 步骤4：测试Gmail API连接
    Write-Host "步骤4: 测试Gmail API连接..." -ForegroundColor Yellow
    try {
        # 设置临时环境变量用于当前会话
        $env:HTTP_PROXY = "http://$proxyServer"
        $env:HTTPS_PROXY = "http://$proxyServer"
        
        # 测试Google API连接
        $apiResponse = Invoke-WebRequest -Uri "https://gmail.googleapis.com/gmail/v1/users/me/profile" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ Gmail API连接正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ Gmail API连接失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "提示: 可能需要配置OAuth认证" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ 系统代理未启用" -ForegroundColor Red
    Write-Host "请在系统设置中启用代理服务器" -ForegroundColor Yellow
}

# 步骤5：保存配置信息
Write-Host "步骤5: 保存配置信息..." -ForegroundColor Yellow
$config = @{
    ProxyEnabled = $proxySettings.ProxyEnable -eq 1
    ProxyServer = $proxySettings.ProxyServer
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    EnvironmentVariablesSet = $true
    NetworkTestSuccess = $false
}

# 尝试网络测试
try {
    Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 5 | Out-Null
    $config.NetworkTestSuccess = $true
} catch {
    $config.NetworkTestSuccess = $false
}

$config | ConvertTo-Json | Out-File -FilePath "C:\Users\yodat\.openclaw\workspace\proxy_config.json"
Write-Host "✅ 配置已保存到 proxy_config.json" -ForegroundColor Green

# 步骤6：显示总结
Write-Host "`n=== 自动化代理配置总结 ===" -ForegroundColor Cyan
Write-Host "代理状态: $(if ($config.ProxyEnabled) { '已启用' } else { '未启用' })" -ForegroundColor $(if ($config.ProxyEnabled) { 'Green' } else { 'Red' })
Write-Host "代理服务器: $($config.ProxyServer)" -ForegroundColor Cyan
Write-Host "环境变量: $(if ($config.EnvironmentVariablesSet) { '已设置' } else { '未设置' })" -ForegroundColor $(if ($config.EnvironmentVariablesSet) { 'Green' } else { 'Red' })
Write-Host "网络测试: $(if ($config.NetworkTestSuccess) { '通过' } else { '失败' })" -ForegroundColor $(if ($config.NetworkTestSuccess) { 'Green' } else { 'Red' })

if ($config.ProxyEnabled -and $config.NetworkTestSuccess) {
    Write-Host "`n自动化配置完成！现在可以使用Gmail监控功能了。" -ForegroundColor Green
} else {
    Write-Host "`n需要手动解决的问题：" -ForegroundColor Yellow
    if (-not $config.ProxyEnabled) {
        Write-Host "1. 在系统设置中启用代理服务器" -ForegroundColor Yellow
    }
    if (-not $config.NetworkTestSuccess) {
        Write-Host "2. 检查网络连接或VPN设置" -ForegroundColor Yellow
    }
}