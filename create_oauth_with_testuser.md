# 🚀 创建带测试用户的OAuth客户端指南

## 🎯 问题
在Google Cloud控制台找不到"测试用户"配置选项

## 🚀 解决方案
创建新的OAuth客户端，在创建过程中确保配置测试用户

## 📋 具体步骤

### 步骤1：删除现有的OAuth客户端（可选）
```
1. 访问：https://console.cloud.google.com/apis/credentials
2. 找到现有的OAuth客户端
3. 点击删除（可选，如果不删除，可以创建新的）
```

### 步骤2：重新配置OAuth同意屏幕
```
1. 访问：https://console.cloud.google.com/apis/credentials/consent
2. 点击"编辑应用"
3. 确保完成所有配置：
   - 应用名称：OpenClaw Memory System
   - 用户支持邮箱：dwjsc2008@gmail.com
   - 受众群体：外部
   - 范围：添加 drive.file 和 drive.metadata
   - 测试用户：添加 dwjsc2008@gmail.com
4. 保存所有配置
```

### 步骤3：创建新的OAuth客户端
```
1. 访问：https://console.cloud.google.com/apis/credentials
2. 点击"创建凭据" → "OAuth 2.0客户端ID"
3. 应用类型：桌面应用
4. 名称：OpenClaw Desktop Client v2
5. 创建
6. 复制新的客户端ID和密钥
```

## 🔧 替代方案：使用gcloud命令行

### 安装Google Cloud CLI
```bash
# 下载并安装gcloud CLI
# 然后配置：
gcloud init
gcloud auth login
```

### 通过命令行配置测试用户
```bash
# 设置项目
gcloud config set project openclaw-memory-system

# 配置OAuth同意屏幕
gcloud alpha iap oauth-brands create \
  --application_title="OpenClaw Memory System" \
  --support_email="dwjsc2008@gmail.com"

# 添加测试用户
gcloud alpha iap oauth-brands add-iam-policy-binding \
  --member="user:dwjsc2008@gmail.com" \
  --role="roles/iap.httpsResourceAccessor"
```

## 💡 为什么找不到测试用户选项

### 可能原因：
1. **界面更新** - Google更新了界面设计
2. **权限问题** - 需要特定权限才能看到
3. **配置顺序** - 需要先完成其他配置
4. **区域限制** - 某些区域可能有不同界面

### 解决方法：
1. **使用搜索功能** - 在控制台搜索"测试用户"
2. **查看所有菜单** - 仔细查看每个菜单选项
3. **使用API** - 通过API直接配置
4. **创建新的** - 重新开始配置流程

## 🎯 现在建议的操作

### 选项A：重新开始配置
```
1. 删除现有的OAuth客户端
2. 重新配置OAuth同意屏幕
3. 确保添加测试用户
4. 创建新的OAuth客户端
```

### 选项B：使用现有的，尝试授权
```
1. 使用现有的客户端ID和密钥
2. 尝试授权，看是否还需要测试用户
3. 如果不需要，继续使用
```

### 选项C：分步截图指导
```
1. 你截图每个页面
2. 我用文字描述每个步骤
3. 我们一步步完成配置
```

## ✅ 我已经准备好的

### 技术实现已就绪，等待：
1. ✅ 正确的客户端ID和密钥
2. ✅ 测试用户配置完成
3. ✅ 授权成功

## 🚀 现在请选择

波哥，请选择：
- **A**：重新开始配置
- **B**：使用现有的尝试授权
- **C**：分步截图指导

**请告诉我你的选择！** 🎯