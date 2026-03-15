# 🚀 设置局域网共享，用于小主机安装

Write-Host "🚀 设置OpenClaw局域网共享" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 1. 获取网络信息
Write-Host "1. 📡 获取网络信息..." -ForegroundColor Yellow

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -eq "Dhcp" }).IPAddress | Select-Object -First 1
$computerName = $env:COMPUTERNAME

Write-Host "  计算机名: $computerName" -ForegroundColor Gray
Write-Host "  IP地址: $ipAddress" -ForegroundColor Gray

# 2. 创建共享目录
Write-Host "`n2. 📁 创建共享目录..." -ForegroundColor Yellow

$sharePath = "C:\OpenClaw_Share"
New-Item -ItemType Directory -Path $sharePath -Force | Out-Null

Write-Host "  共享目录: $sharePath" -ForegroundColor Gray

# 3. 复制OpenClaw配置到共享目录
Write-Host "`n3. 📦 复制OpenClaw配置..." -ForegroundColor Yellow

# 复制配置文件
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
        Copy-Item $file -Destination $sharePath -Force
        Write-Host "   ✅ $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
}

# 复制工作空间
$workspaceSource = "$env:USERPROFILE\.openclaw\workspace"
if (Test-Path $workspaceSource) {
    $workspaceDest = "$sharePath\workspace"
    New-Item -ItemType Directory -Path $workspaceDest -Force | Out-Null
    
    # 复制重要文件
    Get-ChildItem $workspaceSource -File -Include "*.md", "*.ps1", "*.json", "*.txt", "*.js", "*.css" | 
        Where-Object { $_.FullName -notlike "*\logs\*" -and $_.FullName -notlike "*\cache\*" } |
        ForEach-Object {
            Copy-Item $_.FullName -Destination $workspaceDest -Force
            Write-Host "   📄 $(Split-Path $_.FullName -Leaf)" -ForegroundColor Gray
        }
    
    Write-Host "   ✅ 工作空间文件已复制" -ForegroundColor Green
}

# 4. 创建安装脚本
Write-Host "`n4. 🔧 创建安装脚本..." -ForegroundColor Yellow

$installScript = @'
#!/bin/bash
# OpenClaw局域网安装脚本

echo "🚀 OpenClaw局域网安装脚本"
echo "================================"

# 获取电脑IP（从参数或手动输入）
if [ -n "$1" ]; then
    PC_IP="$1"
else
    read -p "请输入电脑IP地址: " PC_IP
fi

echo "连接电脑: $PC_IP"

# 创建临时目录
TEMP_DIR="/tmp/openclaw_install_$(date +%s)"
mkdir -p $TEMP_DIR
cd $TEMP_DIR

# 从电脑下载文件
echo "1. 从电脑下载文件..."
wget -q "http://$PC_IP:8000/config.json" || echo "⚠️ config.json 下载失败"
wget -q "http://$PC_IP:8000/models.json" || echo "⚠️ models.json 下载失败"
wget -q "http://$PC_IP:8000/IDENTITY.md" || echo "⚠️ IDENTITY.md 下载失败"
wget -q "http://$PC_IP:8000/USER.md" || echo "⚠️ USER.md 下载失败"
wget -q "http://$PC_IP:8000/SOUL.md" || echo "⚠️ SOUL.md 下载失败"
wget -q "http://$PC_IP:8000/MEMORY.md" || echo "⚠️ MEMORY.md 下载失败"

# 下载工作空间
echo "2. 下载工作空间..."
wget -q "http://$PC_IP:8000/workspace.tar.gz" && tar -xzf workspace.tar.gz || echo "⚠️ 工作空间下载失败"

# 创建OpenClaw目录
echo "3. 创建OpenClaw目录..."
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace

# 复制配置文件
echo "4. 复制配置文件..."
cp config.json ~/.openclaw/ 2>/dev/null || echo "⚠️ config.json 不存在"
cp models.json ~/.openclaw/ 2>/dev/null || echo "⚠️ models.json 不存在"
cp IDENTITY.md ~/.openclaw/ 2>/dev/null || echo "⚠️ IDENTITY.md 不存在"
cp USER.md ~/.openclaw/ 2>/dev/null || echo "⚠️ USER.md 不存在"
cp SOUL.md ~/.openclaw/ 2>/dev/null || echo "⚠️ SOUL.md 不存在"
cp MEMORY.md ~/.openclaw/ 2>/dev/null || echo "⚠️ MEMORY.md 不存在"

if [ -d "workspace" ]; then
    cp -r workspace/* ~/.openclaw/workspace/ 2>/dev/null
    echo "   ✅ 工作空间已复制"
fi

# 安装Node.js
echo "5. 检查Node.js安装..."
if ! command -v node &> /dev/null; then
    echo "   ⚠️ Node.js未安装，正在安装..."
    
    if [ -f /etc/debian_version ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
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

# 清理临时文件
cd ~
rm -rf $TEMP_DIR

echo ""
echo "🎉 安装完成！"
echo "================================"
echo "下一步操作："
echo "1. 启动OpenClaw: openclaw gateway start"
echo "2. 检查状态: openclaw gateway status"
echo "3. 测试连接: curl http://localhost:18789/api/status"
echo ""
echo "📝 配置文件位置: ~/.openclaw/"
echo ""
'@

$installScript | Out-File "$sharePath\install_openclaw.sh" -Encoding UTF8
Write-Host "   ✅ Linux安装脚本已创建" -ForegroundColor Green

# 5. 创建简单的HTTP服务器
Write-Host "`n5. 🌐 创建HTTP服务器..." -ForegroundColor Yellow

$serverScript = @'
# 简单的Python HTTP服务器
Write-Host "🌐 启动HTTP文件服务器..." -ForegroundColor Cyan
Write-Host "服务器地址: http://' + $ipAddress + ':8000' -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow

# 压缩工作空间
$workspacePath = "' + $sharePath + '\workspace"
if (Test-Path $workspacePath) {
    Compress-Archive -Path "$workspacePath\*" -DestinationPath "' + $sharePath + '\workspace.tar.gz" -Force
    Write-Host "工作空间已压缩为 workspace.tar.gz" -ForegroundColor Green
}

# 启动Python HTTP服务器
cd "' + $sharePath + '"
python -m http.server 8000
'@

$serverScript | Out-File "$sharePath\start_server.ps1" -Encoding UTF8
Write-Host "   ✅ HTTP服务器脚本已创建" -ForegroundColor Green

# 6. 创建小主机连接指南
Write-Host "`n6. 📋 创建连接指南..." -ForegroundColor Yellow

$guideContent = @'
# 🚀 OpenClaw局域网安装指南

## 📡 网络信息
- **电脑IP地址**: ' + $ipAddress + '
- **电脑名称**: ' + $computerName + '
- **共享目录**: ' + $sharePath + '
- **HTTP服务器**: http://' + $ipAddress + ':8000

## 🖥️ 小主机安装步骤

### 步骤1：连接到电脑
```bash
# 测试网络连接
ping ' + $ipAddress + '

# 如果ping不通，检查：
# 1. 两台设备在同一网络
# 2. 防火墙允许ICMP
# 3. 网络配置正确
```

### 步骤2：下载安装脚本
```bash
# 方法A：使用wget直接下载
wget http://' + $ipAddress + ':8000/install_openclaw.sh
chmod +x install_openclaw.sh

# 方法B：使用curl
curl -O http://' + $ipAddress + ':8000/install_openclaw.sh
chmod +x install_openclaw.sh
```

### 步骤3：运行安装脚本
```bash
# 自动获取电脑IP
./install_openclaw.sh ' + $ipAddress + '

# 或者手动输入
./install_openclaw.sh
```

### 步骤4：验证安装
```bash
# 检查Node.js
node --version

# 检查OpenClaw
openclaw --version

# 启动服务
openclaw gateway start

# 检查状态
openclaw gateway status
```

## 📦 可用文件
通过HTTP服务器可以下载以下文件：

1. **配置文件**
   - http://' + $ipAddress + ':8000/config.json
   - http://' + $ipAddress + ':8000/models.json
   - http://' + $ipAddress + ':8000/IDENTITY.md
   - http://' + $ipAddress + ':8000/USER.md
   - http://' + $ipAddress + ':8000/SOUL.md
   - http://' + $ipAddress + ':8000/MEMORY.md

2. **工作空间**（压缩包）
   - http://' + $ipAddress + ':8000/workspace.tar.gz

3. **安装脚本**
   - http://' + $ipAddress + ':8000/install_openclaw.sh

## 🔧 手动安装（如果脚本失败）

### 1. 手动下载文件
```bash
# 创建目录
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace

# 下载配置文件
wget http://' + $ipAddress + ':8000/config.json -O ~/.openclaw/config.json
wget http://' + $ipAddress + ':8000/models.json -O ~/.openclaw/models.json

# 下载工作空间
wget http://' + $ipAddress + ':8000/workspace.tar.gz
tar -xzf workspace.tar.gz -C ~/.openclaw/workspace/
```

### 2. 安装Node.js和OpenClaw
```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装OpenClaw
sudo npm install -g openclaw
```

### 3. 启动服务
```bash
openclaw gateway start
```

## 🛠️ 故障排除

### 网络问题
```
1. 无法ping通电脑
   • 检查两台设备IP是否在同一网段
   • 检查防火墙设置
   • 尝试关闭防火墙临时测试

2. 无法访问HTTP服务器
   • 检查Python服务器是否运行
   • 检查端口8000是否被占用
   • 检查防火墙是否允许端口8000
```

### 安装问题
```
1. Node.js安装失败
   • 手动下载Node.js安装包
   • 使用系统包管理器安装

2. OpenClaw安装失败
   • 检查网络连接
   • 使用npm install -g openclaw --verbose查看详细错误
   • 尝试使用cnpm（中国镜像）
```

### 服务问题
```
1. 端口冲突
   • 修改config.json中的端口号
   • 停止占用端口的其他服务

2. 权限问题
   • 使用sudo运行
   • 检查文件权限
```

## 📞 快速帮助

### 在电脑上操作：
```powershell
# 查看服务器状态
Get-NetTCPConnection -LocalPort 8000

# 重启HTTP服务器
cd ' + $sharePath + '
python -m http.server 8000
```

### 在小主机上操作：
```bash
# 测试连接
curl http://' + $ipAddress + ':8000/

# 查看下载的文件
ls -la
```

---

**安装时间：' + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + '**
**电脑IP：' + $ipAddress + '**
**共享目录：' + $sharePath + '**
'@

$guideContent | Out-File "$sharePath\LAN_INSTALL_GUIDE.md" -Encoding UTF8
Write-Host "   ✅ 连接指南已创建" -ForegroundColor Green

# 7. 总结
Write-Host "`n🎉 局域网共享设置完成！" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "📡 电脑IP地址: $ipAddress" -ForegroundColor White
Write-Host "📁 共享目录: $sharePath" -ForegroundColor White
Write-Host "🌐 HTTP服务器: http://$ipAddress:8000" -ForegroundColor White
Write-Host "📋 安装指南: $sharePath\LAN_INSTALL_GUIDE.md" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor DarkGray

Write-Host "`n🚀 现在请在小主机上操作：" -ForegroundColor Cyan
Write-Host "1. 确保小主机和电脑在同一网络" -ForegroundColor White
Write-Host "2. 在小主机上运行安装脚本" -ForegroundColor White
Write-Host "3. 按照指南完成安装" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor DarkGray