# 📱 手机服务器部署方案

## 🎯 目标
使用旧手机作为24/7运行的OpenClaw服务器，解决"本地部署不能关机"问题。

## 📱 所需设备
- 旧Android手机（Android 7.0+）
- 充电器和数据线
- 稳定的Wi-Fi网络

## 🚀 部署步骤

### 步骤1：准备手机
```
1. 恢复出厂设置（可选）
2. 开启开发者选项
3. 开启USB调试
4. 连接Wi-Fi
5. 设置永不休眠
```

### 步骤2：安装Termux
```
1. 从F-Droid下载Termux
2. 安装基本工具：
   pkg update && pkg upgrade
   pkg install nodejs-lts python git curl wget
```

### 步骤3：部署OpenClaw
```bash
# 1. 克隆OpenClaw
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env
# 编辑.env文件，配置你的设置
```

### 步骤4：配置Google Drive集成
```bash
# 1. 复制现有配置
# 从电脑复制google_drive_integration文件夹到手机

# 2. 测试连接
cd google_drive_integration
node test_connection.js
```

### 步骤5：设置自动启动
```bash
# 1. 创建启动脚本
cat > ~/start_openclaw.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/openclaw
npm start
EOF

chmod +x ~/start_openclaw.sh

# 2. 设置Termux启动时自动运行
echo '~/start_openclaw.sh' >> ~/.bashrc
```

### 步骤6：优化手机设置
```
1. 关闭所有不必要的应用
2. 设置屏幕常亮（或使用Keep Screen On应用）
3. 关闭自动更新
4. 设置性能模式为"省电"
5. 连接充电器并保持充电
```

## 🔧 高级配置

### 1. 远程访问
```bash
# 安装SSH服务器
pkg install openssh
sshd
# 设置密码
passwd
```

### 2. 监控和日志
```bash
# 安装监控工具
pkg install htop vim nano

# 查看日志
tail -f ~/openclaw/logs/*.log
```

### 3. 自动备份
```bash
# 创建备份脚本
cat > ~/backup_openclaw.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /sdcard/openclaw_backup_$DATE.tar.gz ~/openclaw
echo "Backup completed at $(date)"
EOF

chmod +x ~/backup_openclaw.sh
```

## 📊 功耗估算

### 旧手机功耗：
```
• 待机状态：1-2W
• 轻度使用：2-3W
• 24小时运行：约0.05度电/天
• 月耗电量：约1.5度电
• 电费成本：约1元/月
```

### 对比电脑：
```
• 电脑待机：30-50W
• 24小时运行：约1度电/天
• 月耗电量：约30度电
• 电费成本：约20元/月
```

## 🛡️ 可靠性措施

### 1. 防止过热
```
• 不要放在被子或枕头下
• 保持通风良好
• 避免阳光直射
```

### 2. 防止断电
```
• 使用质量好的充电器
• 避免频繁插拔
• 考虑使用UPS（可选）
```

### 3. 监控状态
```
• 定期检查手机温度
• 监控电池健康度
• 查看服务器日志
```

## 🔄 与现有系统集成

### 1. 迁移配置
```
# 从电脑复制配置文件
scp user@电脑IP:~/.openclaw/workspace/config/* termux@手机IP:~/openclaw/config/
```

### 2. 测试连接
```bash
# 在电脑上测试连接手机服务器
ping 手机IP
curl http://手机IP:18789/api/status
```

### 3. 更新客户端配置
```
# 修改桌面客户端，连接到手机服务器
# 而不是localhost:18789
```

## 🚀 部署检查清单

### 准备阶段
- [ ] 旧手机充电并测试
- [ ] 安装Termux和基础工具
- [ ] 配置Wi-Fi和网络
- [ ] 设置永不休眠

### 部署阶段
- [ ] 克隆OpenClaw代码
- [ ] 安装Node.js依赖
- [ ] 配置环境变量
- [ ] 复制Google Drive配置

### 测试阶段
- [ ] 启动OpenClaw服务
- [ ] 测试API访问
- [ ] 验证Google Drive连接
- [ ] 测试记忆同步

### 优化阶段
- [ ] 设置自动启动
- [ ] 配置远程访问
- [ ] 设置监控和日志
- [ ] 创建备份脚本

## 💡 使用建议

### 日常维护
```
1. 每周检查一次手机状态
2. 每月清理一次日志文件
3. 定期更新OpenClaw版本
4. 监控存储空间使用
```

### 故障处理
```
1. 服务停止 → 重启Termux
2. 无法连接 → 检查Wi-Fi和IP
3. 存储满 → 清理日志和缓存
4. 手机过热 → 暂停服务冷却
```

### 升级计划
```
1. 稳定运行1个月后，考虑自动化监控
2. 需要更多功能时，升级到树莓派
3. 业务增长时，迁移到云服务器
```

## 🎯 优势总结

### 成本优势
```
• 设备成本：零（利用旧手机）
• 电费成本：约1元/月
• 维护成本：极低
```

### 技术优势
```
• 24/7可用性：解决关机问题
• 低功耗：环保节能
• 稳定性：手机设计为长期运行
• 便携性：随时移动部署位置
```

### 管理优势
```
• 远程访问：可通过SSH管理
• 易于备份：整个系统可轻松备份
• 快速恢复：出现问题可快速重置
```

## 📞 支持

如有问题，可：
1. 查看Termux官方文档
2. 参考OpenClaw部署指南
3. 联系技术支持

---

**🎉 使用旧手机作为服务器，完美解决"本地部署不能关机"问题！**