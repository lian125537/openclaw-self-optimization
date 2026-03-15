# 自动化配置代理脚本
# 用于解决命令行工具无法访问 Google 服务的问题

# 获取系统代理设置
$proxySettings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"

# 检查代理是否启用
if ($proxySettings.ProxyEnable -eq 1) {
    Write-Host "系统代理已启用" -ForegroundColor Green
    
    # 获取代理服务器地址
    $proxyServer = $proxySettings.ProxyServer
    Write-Host "代理服务器: $proxyServer" -ForegroundColor Yellow
    
    # 设置环境变量
    $env:HTTP_PROXY = "http://$proxyServer"
    $env:HTTPS_PROXY = "http://$proxyServer"
    Write-Host "环境变量已设置" -ForegroundColor Green
    
    # 测试网络连接
    Write-Host "测试网络连接..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 10
        Write-Host "网络连接正常" -ForegroundColor Green
    } catch {
        Write-Host "网络连接失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "系统代理未启用" -ForegroundColor Red
    Write-Host "请先在系统设置中启用代理" -ForegroundColor Yellow
}

# 显示当前配置
Write-Host "当前配置：" -ForegroundColor Cyan
Write-Host "HTTP_PROXY: $env:HTTP_PROXY"
Write-Host "HTTPS_PROXY: $env:HTTPS_PROXY"

# 保存配置到文件
$config = @{
    ProxyServer = $proxySettings.ProxyServer
    ProxyEnabled = $proxySettings.ProxyEnable -eq 1
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$config | ConvertTo-Json | Out-File -FilePath "C:\Users\yodat\.openclaw\workspace\proxy_config.json"
Write-Host "配置已保存到 proxy_config.json" -ForegroundColor Green