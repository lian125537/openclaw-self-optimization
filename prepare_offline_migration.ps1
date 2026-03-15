# 📦 准备OpenClaw离线迁移包

Write-Host "📦 准备OpenClaw离线迁移包" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 创建迁移目录
$migrationDate = Get-Date -Format "yyyyMMdd_HHmm"
$migrationDir = "C:\OpenClaw_Migration_$migrationDate"
$zipFile = "$migrationDir.zip"

Write-Host "1. 创建迁移目录: $migrationDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null

# 1. 复制配置文件
Write-Host "2. 复制配置文件..." -ForegroundColor Yellow

$configFiles = @(
    "$env:USERPROFILE\.openclaw\config.json",
    "$env:USERPROFILE\.openclaw\models.json",
    "$env:USERPROFILE\.openclaw\IDENTITY.md",
    "$env:USERPROFILE\.openclaw\USER.md",
    "$env:USERPROFILE\.openclaw\SOUL.md",
    "$env:USERPROFILE\.openclaw\MEMORY.md"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $migrationDir -Force
        Write-Host "   ✅ $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ $(Split-Path $file -Leaf) (不存在)" -ForegroundColor Yellow
    }
}

# 2. 复制工作空间（排除大文件和临时文件）
Write-Host "3. 复制工作空间..." -ForegroundColor Yellow

$workspaceSource = "$env:USERPROFILE\.openclaw\workspace"
$workspaceDest = "$migrationDir\workspace"

if (Test-Path $workspaceSource) {
    New-Item -ItemType Directory -Path $workspaceDest -Force | Out-Null
    
    # 复制重要文件
    $importantFiles = Get-ChildItem $workspaceSource -File -Include "*.md", "*.ps1", "*.json", "*.txt", "*.js", "*.css" | 
        Where-Object { $_.FullName -notlike "*\logs\*" -and $_.FullName -notlike "*\cache\*" -and $_.FullName -notlike "*\temp\*" }
    
    foreach ($file in $importantFiles) {
        $relativePath = $file.FullName.Replace($workspaceSource, "").TrimStart('\')
        $destPath = Join-Path $workspaceDest $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $file.FullName -Destination $destPath -Force
        Write-Host "   📄 $relativePath" -ForegroundColor Gray
    }
    
    Write-Host "   ✅ 工作空间文件复制完成" -ForegroundColor Green
}

# 3. 特别复制Google Drive集成配置
Write-Host "4. 复制Google Drive集成配置..." -ForegroundColor Yellow

$googleDriveConfig = "$env:USERPROFILE\.openclaw\workspace\google_drive_integration"
if (Test-Path $googleDriveConfig) {
    $googleDriveDest = "$migrationDir\google_drive_integration"
    Copy-Item $googleDriveConfig -Destination $googleDriveDest -Recurse -Force
    Write-Host "   ✅ Google Drive配置已复制" -ForegroundColor Green
    
    # 移除敏感信息（令牌文件）
    $tokenFile = "$googleDriveDest\config\tokens.json"
    if (Test-Path $tokenFile) {
        $tokens = Get-Content $tokenFile -Raw | ConvertFrom-Json
        # 只保留client_id，移除access_token和refresh_token
        $tokens | Add-Member -NotePropertyName "note" -NotePropertyValue "令牌需要重新授权" -Force
        $tokens.PSObject.Properties.Remove('access_token')
        $tokens.PSObject.Properties.Remove('refresh_token')
        $tokens | ConvertTo-Json -Depth 3 | Out-File $tokenFile -Encoding UTF8
        Write-Host "   🔒 已移除敏感令牌信息" -ForegroundColor Yellow
    }
}

# 4. 创建安装脚本
Write-Host "5. 创建安装脚本..." -ForegroundColor Yellow

$installScript = @'
#!/bin/bash
# OpenClaw迁移安装脚本

echo "🚀 OpenClaw迁移安装脚本"
echo "================================"

# 检查是否以root运行
if [ "$EUID" -eq 0 ]; then
    echo "⚠️ 请不要以root用户运行此脚本"
    echo "请使用普通用户运行：bash install_openclaw.sh"
    exit 1
fi

# 创建目录
echo "1. 创建OpenClaw目录..."
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace

# 复制配置文件
echo "2. 复制配置文件..."
cp config.json ~/.openclaw/ 2>/dev/null || echo "⚠️ config.json 不存在"
cp models.json ~/.openclaw/ 2>/dev/null || echo "⚠️ models.json 不存在"
cp IDENTITY.md ~/.openclaw/ 2>/dev/null || echo "⚠️ IDENTITY.md 不存在"
cp USER.md ~/.openclaw/ 2>/dev/null || echo "⚠️ USER.md 不存在"
cp SOUL.md ~/.openclaw/ 2>/dev/null || echo "⚠️ SOUL.md 不存在"
cp MEMORY.md ~/.openclaw/ 2>/dev/null || echo "⚠️ MEMORY.md 不存在"

# 复制工作空间
echo "3. 复制工作空间..."
if [ -d "workspace" ]; then
    cp -r workspace/* ~/.openclaw/workspace/ 2>/dev/null
    echo "   ✅ 工作空间已复制"
fi

# 复制Google Drive配置
echo "4. 复制Google Drive配置..."
if [ -d "google_drive_integration" ]; then
    cp -r google_drive_integration ~/.openclaw/workspace/ 2>/dev/null
    echo "   ✅ Google Drive配置已复制"
fi

# 安装Node.js（如果未安装）
echo "5. 检查Node.js安装..."
if ! command -v node &> /dev/null; then
    echo "   ⚠️ Node.js未安装，正在安装..."
    
    # 检测系统类型
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif [ "$(uname)" == "Darwin" ]; then
        # macOS
        echo "   ⚠️ 请在macOS上使用Homebrew安装Node.js："
        echo "   brew install node"
        exit 1
    else
        echo "   ❌ 不支持的系统，请手动安装Node.js"
        exit 1
    fi
else
    echo "   ✅ Node.js已安装: $(node --version)"
fi

# 安装OpenClaw
echo "6. 安装OpenClaw..."
if ! command -v openclaw &> /dev/null; then
    sudo npm install -g openclaw
    echo "   ✅ OpenClaw已安装"
else
    echo "   ✅ OpenClaw已安装: $(openclaw --version)"
fi

# 配置Google Drive令牌（如果需要）
echo "7. 配置Google Drive..."
if [ -f "google_drive_integration/config/tokens.json" ]; then
    echo "   ⚠️ 需要重新授权Google Drive"
    echo "   请运行以下命令重新授权："
    echo "   cd ~/.openclaw/workspace/google_drive_integration/auth"
    echo "   bash reauthorize.sh"
fi

# 创建启动脚本
echo "8. 创建启动脚本..."
cat > ~/start_openclaw.sh << 'EOF'
#!/bin/bash
echo "🚀 启动OpenClaw..."
openclaw gateway start --daemon
echo "✅ OpenClaw已启动"
echo "访问地址: http://localhost:18789"
echo "查看状态: openclaw gateway status"
EOF

chmod +x ~/start_openclaw.sh

# 创建系统服务（可选）
echo "9. 创建系统服务（可选）..."
read -p "是否创建系统服务？(y/n): " create_service
if [ "$create_service" == "y" ]; then
    cat > /tmp/openclaw.service << EOF
[Unit]
Description=OpenClaw AI Assistant
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER
ExecStart=/usr/bin/openclaw gateway start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/openclaw.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable openclaw
    echo "   ✅ 系统服务已创建"
    echo "   启动服务: sudo systemctl start openclaw"
    echo "   查看状态: sudo systemctl status openclaw"
fi

echo ""
echo "🎉 安装完成！"
echo "================================"
echo "下一步操作："
echo "1. 启动OpenClaw: ~/start_openclaw.sh"
echo "2. 检查状态: openclaw gateway status"
echo "3. 测试连接: curl http://localhost:18789/api/status"
echo "4. 配置Google Drive授权（如果需要）"
echo ""
echo "📝 配置文件位置: ~/.openclaw/"
echo "🔧 工作空间位置: ~/.openclaw/workspace/"
echo ""
'@

$installScript | Out-File "$migrationDir\install_openclaw.sh" -Encoding UTF8
Write-Host "   ✅ 安装脚本已创建" -ForegroundColor Green

# 5. 创建Windows安装脚本（备用）
Write-Host "6. 创建Windows安装脚本..." -ForegroundColor Yellow

$windowsScript = @'
@echo off
echo 📦 OpenClaw Windows迁移安装脚本
echo ================================

REM 创建目录
echo 1. 创建OpenClaw目录...
if not exist "%USERPROFILE%\.openclaw" mkdir "%USERPROFILE%\.openclaw"
if not exist "%USERPROFILE%\.openclaw\workspace" mkdir "%USERPROFILE%\.openclaw\workspace"

REM 复制配置文件
echo 2. 复制配置文件...
if exist "config.json" copy "config.json" "%USERPROFILE%\.openclaw\"
if exist "models.json" copy "models.json" "%USERPROFILE%\.openclaw\"
if exist "IDENTITY.md" copy "IDENTITY.md" "%USERPROFILE%\.openclaw\"
if exist "USER.md" copy "USER.md" "%USERPROFILE%\.openclaw\"
if exist "SOUL.md" copy "SOUL.md" "%USERPROFILE%\.openclaw\"
if exist "MEMORY.md" copy "MEMORY.md" "%USERPROFILE%\.openclaw\"

REM 复制工作空间
echo 3. 复制工作空间...
if exist "workspace" xcopy "workspace" "%USERPROFILE%\.openclaw\workspace\" /E /I /Y

REM 复制Google Drive配置
echo 4. 复制Google Drive配置...
if exist "google_drive_integration" xcopy "google_drive_integration" "%USERPROFILE%\.openclaw\workspace\google_drive_integration\" /E /I /Y

REM 检查Node.js
echo 5. 检查Node.js安装...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo    ⚠️ Node.js未安装
    echo    请从 https://nodejs.org/ 下载并安装Node.js
    pause
    exit /b 1
) else (
    echo    ✅ Node.js已安装
    node --version
)

REM 安装OpenClaw
echo 6. 安装OpenClaw...
where openclaw >nul 2>nul
if %errorlevel% neq 0 (
    echo   正在安装OpenClaw...
    npm install -g openclaw
    echo   ✅ OpenClaw已安装
) else (
    echo   ✅ OpenClaw已安装
    openclaw --version
)

REM 创建启动脚本
echo 7. 创建启动脚本...
echo @echo off > "%USERPROFILE%\start_openclaw.bat"
echo echo 🚀 启动OpenClaw... >> "%USERPROFILE%\start_openclaw.bat"
echo openclaw gateway start >> "%USERPROFILE%\start_openclaw.bat"
echo echo ✅ OpenClaw已启动 >> "%USERPROFILE%\start_openclaw.bat"
echo echo 访问地址: http://localhost:18789 >> "%USERPROFILE%\start_openclaw.bat"
echo echo 查看状态: openclaw gateway status >> "%USERPROFILE%\start_openclaw.bat"
echo pause >> "%USERPROFILE%\start_openclaw.bat"

echo.
echo 🎉 安装完成！
echo ================================
echo 下一步操作：
echo 1. 启动OpenClaw: 双击 start_openclaw.bat
echo 2. 检查状态: openclaw gateway status
echo 3. 测试连接: curl http://localhost:18789/api/status
echo 4. 配置Google Drive授权（如果需要）
echo.
echo 📝 配置文件位置: %USERPROFILE%\.openclaw\
echo 🔧 工作空间位置: %USERPROFILE%\.openclaw\workspace\
echo.
pause
'@

$windowsScript | Out-File "$migrationDir\install_openclaw.bat" -Encoding ASCII
Write-Host "   ✅ Windows安装脚本已创建" -ForegroundColor Green

# 6. 创建说明文档
Write-Host "7. 创建说明文档..." -ForegroundColor Yellow

$readmeContent = @'
# 📦 OpenClaw离线迁移包

## 📋 包含内容
1. **配置文件**
   - config.json - OpenClaw主配置
   - models.json - AI模型配置
   - IDENTITY.md - 身份文件
   - USER.md - 用户信息
   - SOUL.md - 灵魂文件
   - MEMORY.md - 长期记忆

2. **工作空间文件**
   - 所有重要的项目文件
   - 脚本和工具
   - 文档和笔记

3. **Google Drive集成配置**
   - 客户端ID和配置
   - 文件夹结构定义
   - 同步脚本

4. **安装脚本**
   - install_openclaw.sh - Linux/macOS安装脚本
   - install_openclaw.bat - Windows安装脚本

## 🚀 安装步骤

### Linux/macOS
```bash
# 1. 解压迁移包
unzip OpenClaw_Migration_*.zip

# 2. 进入目录
cd OpenClaw_Migration_*

# 3. 运行安装脚本
bash install_openclaw.sh
```

### Windows
```batch
# 1. 解压迁移包
# 2. 进入目录
# 3. 双击运行 install_openclaw.bat
```

## 🔧 安装后配置

### 1. 启动OpenClaw
```bash
# Linux/macOS
~/start_openclaw.sh

# Windows
双击 start_openclaw.bat
```

### 2. 检查状态
```bash
openclaw gateway status
curl http://localhost:18789/api/status
```

### 3. 配置Google Drive授权
```bash
cd ~/.openclaw/workspace/google_drive_integration/auth
# 重新运行授权流程
```

## 📝 重要说明

### 安全注意事项
- Google Drive令牌已移除，需要重新授权
- 确保小主机网络连接正常
- 建议配置防火墙规则

### 网络配置
- 小主机需要固定IP地址
- 开放18789端口
- 确保电脑可以访问小主机

### 数据一致性
- 记忆文件通过Google Drive同步
- 配置文件通过此迁移包同步
- 建议定期备份配置

## 🆘 故障排除

### 常见问题
1. **Node.js未安装** - 按照脚本提示安装
2. **端口冲突** - 修改config.json中的端口
3. **权限问题** - 确保有正确的文件权限
4. **网络问题** - 检查防火墙和网络连接

### 获取帮助
- 查看OpenClaw文档
- 检查日志文件
- 联系技术支持

---

**迁移时间：$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))**
**来源电脑：$env:COMPUTERNAME**
**创建者：OpenClaw迁移工具**
'@

$readmeContent | Out-File "$migrationDir\README.md" -Encoding UTF8
Write-Host