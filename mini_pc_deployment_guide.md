# 🖥️ 小主机OpenClaw服务器部署指南

## 🎯 目标
将闲置小主机部署为24/7运行的OpenClaw服务器，解决"本地部署不能关机"问题。

## 📋 所需设备
- 小主机（Intel NUC、Minisforum、Beelink等）
- 电源适配器
- 网线（推荐有线连接）
- 显示器、键盘、鼠标（初始设置用）
- U盘（8GB+，用于安装系统）

## 🚀 部署方案选择

### 方案A：Ubuntu Server + Docker（推荐）
```
优势：
• 轻量级，资源占用少
• 稳定性好，适合24/7运行
• Docker容器化，易于管理
• 社区支持好，文档丰富
```

### 方案B：Windows 10/11 + Docker Desktop
```
优势：
• 如果你熟悉Windows
• 图形界面方便管理
• 兼容现有Windows应用
```

### 方案C：Proxmox VE虚拟化
```
优势：
• 专业虚拟化平台
• 可运行多个虚拟机
• 高级管理功能
• 适合进阶用户
```

## 📦 推荐方案：Ubuntu Server + Docker

### 步骤1：准备安装介质
```
1. 下载Ubuntu Server 22.04 LTS
   https://ubuntu.com/download/server

2. 使用Rufus或balenaEtcher制作启动U盘
3. 插入小主机，从U盘启动
```

### 步骤2：安装Ubuntu Server
```
1. 选择语言：English或中文
2. 选择安装类型：Ubuntu Server
3. 配置网络：
   • 主机名：openclaw-server
   • 用户：openclaw（或你的用户名）
   • 密码：设置强密码
4. 磁盘分区：使用整个磁盘
5. 选择安装的软件包：
   • ✅ OpenSSH server（重要！）
   • ✅ Docker（重要！）
   • 其他根据需要选择
6. 等待安装完成，重启
```

### 步骤3：初始配置
```bash
# 1. 登录系统
ssh openclaw@小主机IP

# 2. 更新系统
sudo apt update && sudo apt upgrade -y

# 3. 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 4. 配置静态IP（可选但推荐）
sudo nano /etc/netplan/00-installer-config.yaml
# 添加：
# network:
#   ethernets:
#     eth0:
#       dhcp4: no
#       addresses: [192.168.1.100/24]
#       gateway4: 192.168.1.1
#       nameservers:
#         addresses: [8.8.8.8, 1.1.1.1]
sudo netplan apply
```

### 步骤4：安装和配置Docker
```bash
# 1. 安装Docker（如果安装时没选）
sudo apt install docker.io docker-compose -y

# 2. 添加用户到docker组
sudo usermod -aG docker $USER
# 注销重新登录生效

# 3. 测试Docker安装
docker --version
docker run hello-world
```

### 步骤5：部署OpenClaw Docker容器

#### 方法A：使用官方镜像（如果有）
```bash
# 如果OpenClaw有官方Docker镜像
docker pull openclaw/openclaw:latest
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  openclaw/openclaw:latest
```

#### 方法B：自定义Docker部署
```bash
# 1. 创建项目目录
mkdir -p ~/openclaw-docker
cd ~/openclaw-docker

# 2. 创建Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装OpenClaw
RUN npm install -g openclaw

# 创建配置目录
RUN mkdir -p /root/.openclaw

# 暴露端口
EXPOSE 18789

# 启动命令
CMD ["openclaw", "gateway", "start"]
EOF

# 3. 构建镜像
docker build -t openclaw-custom .

# 4. 运行容器
docker run -d \
  --name openclaw \
  --restart unless-stopped \
  -p 18789:18789 \
  -v openclaw_data:/root/.openclaw \
  openclaw-custom
```

### 步骤6：配置Google Drive集成
```bash
# 1. 进入容器
docker exec -it openclaw /bin/sh

# 2. 在容器内配置Google Drive
# 复制现有的google_drive_integration文件夹到容器
docker cp google_drive_integration openclaw:/root/.openclaw/workspace/

# 3. 测试连接
cd /root/.openclaw/workspace/google_drive_integration
node test_connection.js
```

### 步骤7：配置自动启动和监控
```bash
# 1. 设置容器自动重启
docker update --restart unless-stopped openclaw

# 2. 创建监控脚本
cat > ~/monitor_openclaw.sh << 'EOF'
#!/bin/bash
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' openclaw 2>/dev/null)

if [ "$CONTAINER_STATUS" != "running" ]; then
    echo "$(date): OpenClaw容器停止，正在重启..." >> ~/openclaw_monitor.log
    docker restart openclaw
fi
EOF

chmod +x ~/monitor_openclaw.sh

# 3. 添加到cron定时任务
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitor_openclaw.sh") | crontab -
```

### 步骤8：配置远程访问
```bash
# 1. 配置SSH密钥登录（更安全）
# 在本地电脑生成密钥
ssh-keygen -t ed25519

# 复制公钥到服务器
ssh-copy-id openclaw@小主机IP

# 2. 禁用密码登录（可选，更安全）
sudo nano /etc/ssh/sshd_config
# 修改：
# PasswordAuthentication no
sudo systemctl restart sshd
```

### 步骤9：优化系统设置
```bash
# 1. 禁用不必要的服务
sudo systemctl disable --now bluetooth
sudo systemctl disable --now cups

# 2. 配置swap（如果内存小）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. 配置日志轮转
sudo nano /etc/logrotate.d/openclaw
# 添加：
# /var/lib/docker/containers/*/*.log {
#   rotate 7
#   daily
#   compress
#   missingok
#   delaycompress
#   copytruncate
# }
```

## 📊 功耗和性能优化

### 功耗优化
```bash
# 1. 启用CPU省电模式
sudo apt install cpufrequtils
sudo cpufreq-set -g powersave

# 2. 禁用不必要的内核模块
sudo nano /etc/modprobe.d/blacklist.conf
# 添加不需要的模块，如：
# blacklist bluetooth
# blacklist snd_hda_intel

# 3. 调整磁盘休眠时间
sudo hdparm -S 120 /dev/sda
```

### 性能监控
```bash
# 安装监控工具
sudo apt install htop nmon iotop

# 查看资源使用
htop
docker stats
```

## 🔄 与现有系统集成

### 1. 迁移现有配置
```bash
# 从现有电脑复制配置
scp -r user@电脑IP:~/.openclaw/* openclaw@小主机IP:~/.openclaw/
```

### 2. 更新客户端配置
```
# 修改桌面客户端，连接到小主机
# 原：http://localhost:18789
# 新：http://小主机IP:18789
```

### 3. 测试连接
```bash
# 在电脑上测试
curl http://小主机IP:18789/api/status
ping 小主机IP
```

## 🛡️ 安全配置

### 基本安全
```bash
# 1. 配置防火墙
sudo ufw allow 22/tcp
sudo ufw allow 18789/tcp
sudo ufw enable

# 2. 定期更新
sudo apt update && sudo apt upgrade -y

# 3. 安装fail2ban防暴力破解
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 备份策略
```bash
# 1. 创建备份脚本
cat > ~/backup_openclaw.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mnt/backup/openclaw"

mkdir -p $BACKUP_DIR

# 备份Docker卷
docker run --rm -v openclaw_data:/data -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/openclaw_data_$DATE.tar.gz -C /data .

# 备份配置
tar czf $BACKUP_DIR/openclaw_config_$DATE.tar.gz ~/.openclaw

echo "Backup completed at $(date)" >> $BACKUP_DIR/backup.log
EOF

chmod +x ~/backup_openclaw.sh

# 2. 设置定时备份
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup_openclaw.sh") | crontab -
```

## 🚀 高级功能

### 1. 配置反向代理（可选）
```bash
# 安装Nginx
sudo apt install nginx

# 配置反向代理
sudo nano /etc/nginx/sites-available/openclaw
# 添加：
# server {
#     listen 80;
#     server_name openclaw.yourdomain.com;
#     
#     location / {
#         proxy_pass http://localhost:18789;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#     }
# }
sudo ln -s /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2. 配置SSL证书（可选）
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d openclaw.yourdomain.com
```

### 3. 配置监控面板
```bash
# 安装Grafana + Prometheus
docker run -d --name=grafana -p 3000:3000 grafana/grafana
docker run -d --name=prometheus -p 9090:9090 prom/prometheus
```

## 📝 部署检查清单

### 硬件准备
- [ ] 小主机通电测试
- [ ] 连接显示器和键盘
- [ ] 连接网线
- [ ] 准备U盘安装介质

### 系统安装
- [ ] 制作Ubuntu Server启动U盘
- [ ] 安装Ubuntu Server
- [ ] 配置网络和用户
- [ ] 安装必要软件包

### Docker部署
- [ ] 安装Docker和Docker Compose
- [ ] 构建或拉取OpenClaw镜像
- [ ] 运行OpenClaw容器
- [ ] 配置数据持久化

### 集成配置
- [ ] 迁移现有配置
- [ ] 配置Google Drive集成
- [ ] 测试API连接
- [ ] 更新客户端配置

### 优化和安全
- [ ] 配置防火墙
- [ ] 设置自动备份
- [ ] 配置监控和告警
- [ ] 优化系统设置

## 💡 维护建议

### 日常维护
```
1. 每周检查系统日志
2. 每月更新系统和软件
3. 定期清理Docker镜像和容器
4. 监控存储空间使用
```

### 故障排除
```
1. 服务无法访问 → 检查防火墙和端口
2. 容器停止 → 查看Docker日志
3. 存储满 → 清理日志和备份
4. 网络问题 → 检查IP和DNS
```

### 升级计划
```
1. 定期备份重要数据
2. 测试新版本后再升级
3. 保持系统更新
4. 监控安全公告
```

## 📊 成本估算

### 硬件成本
```
• 小主机：已有（零成本）
• 电费：约5-10W，24小时约0.12-0.24度电
• 月电费：约3.6-7.2度电，2-4元
```

### 软件成本
```
• 操作系统：Ubuntu Server（免费）
• Docker：免费
• OpenClaw：免费
• 总成本：零
```

## 🎯 优势总结

### 技术优势
```
• 24/7可用性：解决关机问题
• 专业服务器：比手机更稳定
• Docker容器化：易于管理和迁移
• 可扩展性：随时添加新服务
```

### 成本优势
```
• 硬件零成本：利用闲置设备
• 电费极低：每月仅几元
• 软件全免费：开源解决方案
```

### 管理优势
```
• 远程管理：SSH随时访问
• 自动备份：数据安全有保障
• 监控告警：问题及时发现
• 易于维护：标准Linux环境
```

---

**🎉 使用小主机作为OpenClaw服务器，完美解决所有问题！**