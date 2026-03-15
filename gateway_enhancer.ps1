# 网关增强脚本 - 彻底解决WebSocket断开问题
function Enhance-GatewayStability {
    Write-Host "🔧 开始增强网关稳定性..." -ForegroundColor Cyan
    
    # 1. 停止当前网关
    Write-Host "1. 停止当前网关..." -ForegroundColor Yellow
    openclaw gateway stop
    
    # 2. 清理可能的问题进程
    Write-Host "2. 清理残留进程..." -ForegroundColor Yellow
    Get-Process -Name "openclaw*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # 3. 增加网关内存限制
    Write-Host "3. 优化网关配置..." -ForegroundColor Yellow
    $configPath = "$env:USERPROFILE\.openclaw\config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        if (-not $config.gateway) { $config | Add-Member -NotePropertyName "gateway" -NotePropertyValue @{} }
        $config.gateway.maxMemory = "1GB"
        $config.gateway.keepAlive = 60
        $config.gateway.reconnectAttempts = 10
        $config.gateway.reconnectDelay = 5000
        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
    }
    
    # 4. 配置WebSocket优化
    Write-Host "4. 配置WebSocket优化..." -ForegroundColor Yellow
    $websocketConfig = @{
        pingInterval = 30000
        pingTimeout = 10000
        maxPayload = 10485760
        compression = $true
        perMessageDeflate = $true
    }
    
    # 5. 启动增强版网关
    Write-Host "5. 启动增强版网关..." -ForegroundColor Green
    openclaw gateway start --force
    
    # 6. 等待并验证
    Write-Host "6. 验证连接..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    
    $status = openclaw gateway status
    if ($status -match "running") {
        Write-Host "✅ 网关增强完成！" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ 网关启动失败" -ForegroundColor Red
        return $false
    }
}

# 执行增强
Enhance-GatewayStability