# 浏览器WebSocket优化指南

## 问题症状
- `disconnected (1006): no reason`
- 聊天连接突然断开
- 需要刷新页面重新连接

## 解决方案

### 1. 浏览器设置优化
1. **禁用硬件加速**
   - Chrome: 设置 → 系统 → 关闭"使用硬件加速模式"
   - Edge: 设置 → 系统 → 关闭"使用硬件加速"

2. **清除缓存和Cookie**
   - Ctrl+Shift+Delete → 选择"所有时间"
   - 勾选"Cookie"和"缓存图片和文件"

3. **禁用扩展程序**
   - 临时禁用所有扩展
   - 特别是广告拦截器和安全软件

### 2. 网络设置优化
1. **关闭代理**
   - 设置 → 网络和Internet → 代理
   - 关闭"使用代理服务器"

2. **DNS设置**
   - 使用稳定DNS: 8.8.8.8 和 1.1.1.1

### 3. 备用访问方式
1. **使用不同浏览器**
   - Chrome → Edge 或 Firefox
   - 测试哪个更稳定

2. **使用无痕模式**
   - Ctrl+Shift+N 打开无痕窗口
   - 访问 OpenClaw Control UI

## 自动重连脚本

在浏览器控制台运行以下代码自动重连：

```javascript
// 自动重连脚本
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 5000;

function setupAutoReconnect() {
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        
        ws.addEventListener('close', (event) => {
            if (event.code === 1006) {
                console.log('WebSocket断开 (1006)，尝试重连...');
                attemptReconnect();
            }
        });
        
        return ws;
    };
}

function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`重连尝试 ${reconnectAttempts}/${maxReconnectAttempts}`);
        
        setTimeout(() => {
            window.location.reload();
        }, reconnectDelay);
    } else {
        console.log('达到最大重连次数，请手动刷新页面');
    }
}

// 启动自动重连
setupAutoReconnect();
console.log('WebSocket自动重连已启用');
```

## 长期解决方案

### 1. 使用桌面应用
考虑使用OpenClaw桌面客户端，避免浏览器限制。

### 2. 配置本地代理
设置本地代理服务器，优化WebSocket连接。

### 3. 网络环境优化
确保网络稳定，避免WiFi信号波动。