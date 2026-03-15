# 自动化修复 Gmail 认证问题
Write-Host "=== 修复 Gmail 认证问题 ===" -ForegroundColor Cyan

# 1. 检查当前认证状态
Write-Host "`n1. 检查当前认证状态..." -ForegroundColor Yellow
try {
    $authList = & gog auth list
    Write-Host "当前认证配置：" -ForegroundColor Cyan
    Write-Host $authList -ForegroundColor White
} catch {
    Write-Host "无法检查认证状态" -ForegroundColor Red
}

# 2. 检查服务账号文件
Write-Host "`n2. 检查服务账号文件..." -ForegroundColor Yellow
$saFile = "$env:APPDATA\gogcli\sa-*.json"
if (Test-Path $saFile) {
    $file = Get-ChildItem $saFile | Select-Object -First 1
    Write-Host "服务账号文件: $($file.Name)" -ForegroundColor Green
    
    # 检查文件内容
    $content = Get-Content $file.FullName | ConvertFrom-Json
    Write-Host "客户端邮箱: $($content.client_email)" -ForegroundColor Cyan
    Write-Host "项目ID: $($content.project_id)" -ForegroundColor Cyan
    Write-Host "类型: $($content.type)" -ForegroundColor Cyan
    
    # 检查邮箱格式
    if ($content.client_email -match "@.*\.iam\.gserviceaccount\.com$") {
        Write-Host "✅ 服务账号邮箱格式正确" -ForegroundColor Green
    } else {
        Write-Host "⚠️  服务账号邮箱格式可能不正确" -ForegroundColor Yellow
        Write-Host "   应该类似于: your-service-account@project-id.iam.gserviceaccount.com" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 服务账号文件不存在" -ForegroundColor Red
}

# 3. 提供解决方案
Write-Host "`n3. 解决方案建议..." -ForegroundColor Yellow
Write-Host "如果遇到 invalid_grant 错误，请按以下步骤操作：" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "1. 在 Google Cloud Console 中：" -ForegroundColor Cyan
Write-Host "   - 启用 Gmail API" -ForegroundColor White
Write-Host "   - 检查服务账号权限" -ForegroundColor White
Write-Host "   - 配置域委派（如果使用 Google Workspace）" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "2. 重新配置服务账号：" -ForegroundColor Cyan
Write-Host "   gog auth service-account set your-email@gmail.com --key /path/to/service-account.json" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "3. 参考 GitHub 项目获取更多帮助：" -ForegroundColor Cyan
Write-Host "   https://github.com/steipete/gogcli" -ForegroundColor White

# 4. 自动化修复尝试
Write-Host "`n4. 尝试自动化修复..." -ForegroundColor Yellow
try {
    # 重新认证服务账号
    Write-Host "重新配置服务账号认证..." -ForegroundColor Yellow
    & gog auth service-account set dwcjs2008@gmail.com --key "$env:APPDATA\gogcli\sa-ZHdjanMyMDA4QGdtYWlsLmNvbQ.json"
    Write-Host "✅ 服务账号重新配置完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 自动化修复失败，需要手动操作" -ForegroundColor Red
}

Write-Host "`n=== 完成 ===" -ForegroundColor Cyan