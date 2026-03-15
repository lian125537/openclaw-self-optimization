# 🔐 获取OAuth 2.0客户端凭据指南
# 波哥需要获取的正确凭据

## 🎯 目标
获取访问Google Drive所需的OAuth 2.0客户端ID和密钥

## 📍 正确的位置和步骤

### 步骤1：访问Google Cloud控制台
1. 打开：**https://console.cloud.google.com**
2. 确保选择了正确的项目：**`openclaw-memory-system`**

### 步骤2：导航到凭据页面
1. 左侧菜单点击：**API和服务** → **凭据**
2. 你应该看到类似这样的页面：
   ```
   +-------------------------------+
   |       凭据页面               |
   |                               |
   |  [创建凭籍]                  |
   |                               |
   |  OAuth 2.0客户端ID (0)       |
   |  API密钥 (1)                 |
   |  服务账号 (0)                |
   +-------------------------------+
   ```

### 步骤3：创建OAuth 2.0客户端ID
1. 点击蓝色的 **"创建凭据"** 按钮
2. 在下拉菜单中选择：**"OAuth 2.0客户端ID"**

### 步骤4：配置应用类型
```
你会看到表单：
应用类型： [选择] ← 点击这里
名称：OpenClaw Desktop Client

点击"应用类型"下拉框，选择："桌面应用"
```

### 步骤5：创建并获取凭据
1. 点击 **"创建"** 按钮
2. **重要**：会弹出对话框显示凭据：
   ```
   OAuth 2.0客户端已创建
   
   客户端ID
   1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   
   客户端密钥
   GOCSPX-abcdefghijklmnopqrstuvwxyz
   
   [确定]
   ```
3. **立即复制**这两个值！

## 📋 需要复制的信息

### 正确格式示例：
```json
{
  "client_id": "1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
  "client_secret": "GOCSPX-abcdefghijklmnopqrstuvwxyz"
}
```

### 错误格式（API密钥）：
```json
{
  "api_key": "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx"  ← 这不是我们需要的！
}
```

## 🔍 如何区分

### OAuth客户端ID特征：
- 以数字开头，以`.apps.googleusercontent.com`结尾
- 格式：`数字-字母.apps.googleusercontent.com`
- 示例：`1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

### OAuth客户端密钥特征：
- 以`GOCSPX-`开头
- 包含字母和数字
- 示例：`GOCSPX-abcdefghijklmnopqrstuvwxyz`

### API密钥特征：
- 以`AIzaSy`开头
- 39个字符长度
- 示例：`AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## ⚠️ 常见问题

### 问题1：看不到"OAuth 2.0客户端ID"选项
```
原因：可能没有配置OAuth同意屏幕
解决：
1. 左侧菜单点击"API和服务" → "OAuth同意屏幕"
2. 配置外部用户类型
3. 填写必要信息
4. 然后返回凭据页面
```

### 问题2：创建时没有"桌面应用"选项
```
原因：可能选择了错误的项目
解决：
1. 确认项目是"openclaw-memory-system"
2. 或者创建新项目
```

### 问题3：凭据创建后找不到
```
解决：
1. 在凭据页面查看"OAuth 2.0客户端ID"部分
2. 点击客户端名称查看详情
3. 可以重新生成密钥
```

## 🚀 如果你已经创建了API密钥

### 不需要删除API密钥，但需要额外创建OAuth凭据：
1. API密钥可以保留（可能其他用途）
2. **额外创建**OAuth 2.0客户端ID
3. 两个可以共存

## 📊 验证你获取的是正确的凭据

### 快速检查：
1. **客户端ID**是否以`.apps.googleusercontent.com`结尾？ ✅
2. **客户端密钥**是否以`GOCSPX-`开头？ ✅
3. 如果是，就是正确的！

### 如果不是：
1. 你获取的是API密钥 ❌
2. 需要按照上述步骤创建OAuth凭据
3. API密钥不能用于访问私有Google Drive

## 💡 为什么我们需要OAuth而不是API密钥

### Google Drive访问要求：
```
操作              API密钥   OAuth 2.0
读取公开文件      ✅        ✅
读取用户私有文件  ❌        ✅
写入用户文件      ❌        ✅
创建用户文件夹    ❌        ✅
删除用户文件      ❌        ✅
```

### 我们的需求：
- ✅ 需要读取你的私有记忆文件
- ✅ 需要写入新的记忆文件
- ✅ 需要创建记忆文件夹
- ✅ 需要修改和删除文件

因此**必须使用OAuth 2.0**！

## 🔧 下一步

### 当你获取到正确的凭据后：
1. 将`client_id`和`client_secret`发给我
2. 我会生成授权URL
3. 你在浏览器中授权
4. 我们继续后续集成

### 如果你遇到困难：
1. 截图发给我看
2. 描述具体问题
3. 我提供针对性指导

## 🎯 总结

### 你需要：
1. **OAuth 2.0客户端ID**（不是API密钥）
2. **OAuth 2.0客户端密钥**（不是API密钥）

### 位置：
Google Cloud控制台 → API和服务 → 凭据 → 创建凭据 → OAuth 2.0客户端ID

### 应用类型：
**桌面应用**

波哥，请确认你获取的是**OAuth 2.0客户端凭据**，而不是**API密钥**！🎯