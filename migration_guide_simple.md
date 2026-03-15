# 📦 简单迁移指南：电脑 → 小主机

## 🎯 目标
将电脑上的OpenClaw配置迁移到小主机，保持账号、模型、记忆完全一致。

## 📋 迁移内容
- ✅ OpenClaw配置（config.json, models.json）
- ✅ 工作空间文件（workspace/）
- ✅ Google Drive集成配置
- ✅ 记忆同步状态

## 🚀 简单迁移步骤

### 步骤1：在电脑上准备迁移包
```powershell
# 1. 创建迁移目录
$migrationDir = "C:\OpenClaw_Migration_$(Get-Date -Format 'yyyyMMdd')"
New-Item -ItemType Directory -Path $migrationDir -Force

# 2. 复制配置文件
Copy-Item "$env:USERPROFILE\.openclaw\config.json" -Destination "$migrationDir\"
Copy-Item "$env:USERPROFILE\.openclaw\models.json" -Destination "$migrationDir\"

# 3. 复制工作空间（排除大文件）
$workspaceSource = "$env:USERPROFILE\.openclaw\workspace"
$workspaceDest = "$migrationDir\workspace"
Copy-Item $workspaceSource -Destination $workspaceDest -Recurse -Exclude "*.log", "*.tmp", "cache", "temp"

# 4. 复制Google Drive集成配置
$googleDriveSource = "$env:USERPROFILE\.openclaw\workspace\google_drive_integration"
if (Test-Path $googleDriveSource) {
    Copy-Item $googleDriveSource -Destination "$migrationDir\google_drive_integration" -Recurse
}

# 5. 创建迁移说明文件
@"
# OpenClaw迁移包
迁移时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
来源电脑: $env:COMPUTERNAME
目标设备: 小主机

包含内容：
1. OpenClaw配置文件
2. 模型配置文件
3. 工作空间文件
4. Google Drive集成配置

注意事项：
1. 记忆文件已存储在Google Drive，无需迁移
2. 需要在小主机重新配置网络
3. 需要更新客户端连接地址
"@ | Out-File "$migrationDir\README.md" -Encoding UTF8

# 6. 压缩为ZIP文件
Compress-Archive -Path "$migrationDir\*" -DestinationPath "$migrationDir.zip" -Force

Write-Host "✅ 迁移包已创建: $migrationDir.zip" -ForegroundColor Green
```

### 步骤2：将迁移包复制到U盘
```
1. 插入U盘
2. 复制 $migrationDir.zip 到U盘
3. 安全弹出U盘
```

### 步骤3：在小主机上恢复

#### 如果小主机是Ubuntu：
```bash
# 1. 插入U盘，挂载
sudo mkdir -p /mnt/usb
sudo mount /dev/sdb1 /mnt/usb  # 根据实际情况调整设备名

# 2. 复制迁移包
cp /mnt/usb/OpenClaw_Migration_*.zip ~/

# 3. 解压
unzip ~/OpenClaw_Migration_*.zip -d ~/

# 4. 恢复配置文件
mkdir -p ~/.openclaw
cp ~/OpenClaw_Migration_*/config.json ~/.openclaw/
cp ~/OpenClaw_Migration_*/models.json ~/.openclaw/

# 5. 恢复工作空间
cp -r ~/OpenClaw_Migration_*/workspace ~/.openclaw/

# 6. 恢复Google Drive配置
if [ -d ~/OpenClaw_Migration_*/google_drive_integration ]; then
    cp -r ~/OpenClaw_Migration_*/google_drive_integration ~/.openclaw/workspace/
fi
```

#### 如果小主机是Windows：
```powershell
# 1. 插入U盘，复制迁移包
# 2. 解压ZIP文件
# 3. 复制文件到对应位置
Copy-Item "迁移包路径\config.json" -Destination "$env:USERPROFILE\.openclaw\"
Copy-Item "迁移包路径\models.json" -Destination "$env:USERPROFILE\.openclaw\"
Copy-Item "迁移包路径\workspace" -Destination "$env:USERPROFILE\.openclaw\" -Recurse
```

### 步骤4：在小主机安装OpenClaw

#### Ubuntu安装：
```bash
# 1. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 安装OpenClaw
sudo npm install -g openclaw

# 3. 验证安装
openclaw --version
```

#### Windows安装：
```powershell
# 1. 安装Node.js（如果未安装）
# 下载地址：https://nodejs.org/

# 2. 安装OpenClaw
npm install -g openclaw

# 3. 验证安装
openclaw --version
```

### 步骤5：配置和启动

#### 通用配置：
```bash
# 1. 检查配置文件
ls -la ~/.openclaw/

# 2. 启动OpenClaw网关
openclaw gateway start

# 3. 检查服务状态
openclaw gateway status

# 4. 获取小主机IP地址
ip addr show  # Linux
ipconfig      # Windows
```

### 步骤6：测试连接
```bash
# 在小主机测试
curl http://localhost:18789/api/status

# 在电脑测试（替换为小主机IP）
curl http://小主机IP:18789/api/status
```

### 步骤7：更新电脑客户端配置
```
修改桌面客户端配置：
原连接：http://localhost:18789
新连接：http://小主机IP:18789
```

## 🔧 验证迁移成功

### 验证1：账号一致性
```
1. 在小主机运行：openclaw config show
2. 确认API密钥、模型配置与电脑相同
```

### 验证2：记忆同步
```
1. 在小主机运行记忆同步测试
2. 确认可以访问Google Drive中的记忆
3. 确认记忆文件内容一致
```

### 验证3：功能测试
```
1. 通过电脑客户端连接小主机
2. 测试聊天功能
3. 测试文件操作
4. 测试记忆访问
```

## 💡 重要注意事项

### 网络配置
```
• 小主机需要固定IP地址
• 防火墙需要开放18789端口
• 电脑需要能访问小主机IP
```

### 数据一致性
```
• 记忆文件：通过Google Drive自动同步
• 配置文件：通过迁移包手动同步
• 临时文件：不需要迁移
```

### 服务管理
```
• 小主机需要设置OpenClaw自动启动
• 需要监控服务状态
• 需要定期备份配置
```

## 🚀 快速迁移脚本

### 电脑端导出脚本（save_config.ps1）：
```powershell
# 导出OpenClaw配置
$backupFile = "openclaw_config_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
$tempDir = "$env:TEMP\openclaw_backup_$(Get-Random)"

New-Item -ItemType Directory -Path $tempDir -Force

# 复制重要文件
Copy-Item "$env:USERPROFILE\.openclaw\config.json" -Destination "$tempDir\"
Copy-Item "$env:USERPROFILE\.openclaw\models.json" -Destination "$tempDir\"
Copy-Item "$env:USERPROFILE\.openclaw\workspace\*" -Destination "$tempDir\workspace\" -Recurse -Exclude "*.log", "*.tmp"

# 创建说明文件
@"
OpenClaw配置备份
时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
电脑: $env:COMPUTERNAME
用户: $env:USERNAME

恢复步骤：
1. 安装OpenClaw
2. 复制文件到 ~/.openclaw/
3. 启动服务
"@ | Out-File "$tempDir\README.txt" -Encoding UTF8

# 压缩
Compress-Archive -Path "$tempDir\*" -DestinationPath $backupFile -Force

Write-Host "✅ 配置已导出: $backupFile" -ForegroundColor Green
Remove-Item $tempDir -Recurse -Force
```

### 小主机端导入脚本（restore_config.sh）：
```bash
#!/bin/bash
# 恢复OpenClaw配置

BACKUP_FILE=$1
RESTORE_DIR="$HOME/openclaw_restore"

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <备份文件.zip>"
    exit 1
fi

# 解压
unzip "$BACKUP_FILE" -d "$RESTORE_DIR"

# 恢复配置
mkdir -p ~/.openclaw
cp "$RESTORE_DIR/config.json" ~/.openclaw/
cp "$RESTORE_DIR/models.json" ~/.openclaw/

if [ -d "$RESTORE_DIR/workspace" ]; then
    cp -r "$RESTORE_DIR/workspace" ~/.openclaw/
fi

echo "✅ 配置恢复完成"
echo "请运行: openclaw gateway start"
```

## 📊 迁移检查清单

### 准备阶段
- [ ] 备份电脑上的重要数据
- [ ] 准备U盘（8GB+）
- [ ] 记录小主机网络信息

### 导出阶段
- [ ] 运行导出脚本
- [ ] 复制文件到U盘
- [ ] 验证导出文件完整性

### 导入阶段
- [ ] 在小主机安装OpenClaw
- [ ] 复制迁移文件
- [ ] 恢复配置文件

### 测试阶段
- [ ] 启动小主机OpenClaw服务
- [ ] 测试本地连接
- [ ] 测试电脑远程连接
- [ ] 验证所有功能正常

### 切换阶段
- [ ] 更新电脑客户端配置
- [ ] 停止电脑上的OpenClaw服务
- [ ] 验证服务切换成功

## 🎯 迁移成功标志

### 功能正常
- [ ] 电脑可以连接小主机OpenClaw
- [ ] 聊天功能正常
- [ ] 记忆访问正常
- [ ] 文件操作正常

### 数据一致
- [ ] 账号配置相同
- [ ] 模型配置相同
- [ ] 记忆数据同步
- [ ] 工作空间文件一致

### 性能达标
- [ ] 响应速度可接受
- [ ] 网络延迟合理
- [ ] 服务稳定运行

---

**🎉 按照这个指南，可以顺利将OpenClaw迁移到小主机，保持所有配置一致！**