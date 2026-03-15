# OpenClaw中文显示层工具
# 创建中文显示层，不修改原始英文配置

param(
    [string]$OpenClawDir = "$env:USERPROFILE\.openclaw",
    [switch]$CreateOnly = $false
)

Write-Host "🎯 OpenClaw中文显示层工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "目标: 创建中文显示层，保持原始配置兼容性" -ForegroundColor Yellow
Write-Host "目录: $OpenClawDir" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Gray

# 检查目录
if (-not (Test-Path $OpenClawDir)) {
    Write-Host "❌ 目录不存在: $OpenClawDir" -ForegroundColor Red
    exit 1
}

# 中英文映射配置
$chineseConfig = @{
    # 主配置文件映射
    "config.json" = @{
        "display_name" = "主配置文件"
        "fields" = @{
            "version" = "版本"
            "description" = "描述"
            "gateway" = "网关"
            "host" = "主机"
            "port" = "端口"
            "enabled" = "启用"
            "autoStart" = "自动启动"
            "maxMemory" = "最大内存"
            "keepAlive" = "保持连接"
            "models" = "模型"
            "defaultModel" = "默认模型"
            "provider" = "提供程序"
            "apiKey" = "API密钥"
            "baseURL" = "基础网址"
            "timeout" = "超时"
            "ui" = "界面"
            "theme" = "主题"
            "fontFamily" = "字体"
            "fontSize" = "字体大小"
            "language" = "语言"
            "timezone" = "时区"
            "plugins" = "插件"
            "enabledPlugins" = "启用插件"
            "autoLoad" = "自动加载"
            "pluginDir" = "插件目录"
            "skills" = "技能"
            "enabledSkills" = "启用技能"
            "skillDir" = "技能目录"
            "autoDiscover" = "自动发现"
            "tools" = "工具"
            "profile" = "配置文件"
            "enabledTools" = "启用工具"
            "permissionLevel" = "权限级别"
            "memory" = "记忆"
            "storagePath" = "存储路径"
            "autoSave" = "自动保存"
            "retentionDays" = "保留天数"
            "logs" = "日志"
            "level" = "级别"
            "output" = "输出"
            "filePath" = "文件路径"
            "maxSize" = "最大大小"
            "keepFiles" = "保留文件数"
            "network" = "网络"
            "proxy" = "代理"
            "retries" = "重试次数"
            "userAgent" = "用户代理"
            "security" = "安全"
            "enableAuth" = "启用认证"
            "allowedOrigins" = "允许的来源"
            "CORS" = "CORS"
            "rateLimit" = "速率限制"
            "maxRequests" = "最大请求数"
            "timeWindow" = "时间窗口"
        }
    }
    
    # 模型配置文件映射
    "models.json" = @{
        "display_name" = "模型配置文件"
        "fields" = @{
            "models" = "模型列表"
            "id" = "标识"
            "name" = "名称"
            "provider" = "提供程序"
            "apiKey" = "API密钥"
            "baseURL" = "基础网址"
            "model" = "模型名称"
            "contextLength" = "上下文长度"
            "maxTokens" = "最大令牌数"
            "temperature" = "温度"
            "enabled" = "启用"
            "default" = "默认"
            "description" = "描述"
            "defaultSettings" = "默认设置"
            "topP" = "顶部P"
            "frequencyPenalty" = "频率惩罚"
            "presencePenalty" = "存在惩罚"
            "stopSequences" = "停止序列"
            "streaming" = "流式传输"
        }
    }
}

# 创建中文显示层目录
$displayLayerDir = "$OpenClawDir\display\chinese"
if (-not (Test-Path $displayLayerDir)) {
    New-Item -ItemType Directory -Path $displayLayerDir -Force | Out-Null
    Write-Host "✅ 创建中文显示层目录: $displayLayerDir" -ForegroundColor Green
}

function Create-ChineseDisplay {
    param(
        [string]$ConfigFile,
        [hashtable]$Mapping
    )
    
    $fileName = Split-Path $ConfigFile -Leaf
    $outputFile = "$displayLayerDir\$fileName"
    
    Write-Host "  🔄 处理: $fileName" -ForegroundColor Gray
    
    try {
        # 读取原始配置文件
        $originalContent = Get-Content $ConfigFile -Raw -Encoding UTF8 -ErrorAction Stop
        $originalConfig = $originalContent | ConvertFrom-Json -ErrorAction Stop
        
        # 创建中文显示配置
        $chineseDisplay = @{
            "_meta" = @{
                "original_file" = $fileName
                "display_name" = $Mapping.display_name
                "created" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                "author" = "88技术助手"
            }
            "display" = @{}
        }
        
        # 递归处理配置对象
        function Process-Object {
            param(
                [PSObject]$Object,
                [hashtable]$FieldMap,
                [string]$Path = ""
            )
            
            $result = @{}
            
            foreach ($property in $Object.PSObject.Properties) {
                $propertyName = $property.Name
                $propertyValue = $property.Value
                $fullPath = if ($Path) { "$Path.$propertyName" } else { $propertyName }
                
                # 获取中文显示名
                $displayName = if ($FieldMap.ContainsKey($propertyName)) {
                    $FieldMap[$propertyName]
                } else {
                    $propertyName
                }
                
                # 处理不同类型的值
                if ($propertyValue -is [PSObject] -or $propertyValue -is [Hashtable]) {
                    # 对象类型，递归处理
                    $result[$displayName] = Process-Object -Object $propertyValue -FieldMap $FieldMap -Path $fullPath
                } elseif ($propertyValue -is [Array]) {
                    # 数组类型
                    $translatedArray = @()
                    foreach ($item in $propertyValue) {
                        if ($item -is [PSObject] -or $item -is [Hashtable]) {
                            $translatedArray += Process-Object -Object $item -FieldMap $FieldMap -Path "$fullPath[]"
                        } else {
                            $translatedArray += $item
                        }
                    }
                    $result[$displayName] = $translatedArray
                } else {
                    # 简单值类型
                    $result[$displayName] = $propertyValue
                }
            }
            
            return $result
        }
        
        # 处理主配置
        $chineseDisplay.display = Process-Object -Object $originalConfig -FieldMap $Mapping.fields
        
        # 保存中文显示配置
        $chineseDisplay | ConvertTo-Json -Depth 20 | Out-File $outputFile -Encoding UTF8 -Force
        Write-Host "    ✅ 创建中文显示文件: $(Split-Path $outputFile -Leaf)" -ForegroundColor Green
        
        # 创建对比文件
        $compareFile = "$displayLayerDir\${fileName}.compare.md"
        @"
# 配置文件对比: $fileName

## 原始配置 (英文)
\`\`\`json
$(($originalContent | ConvertFrom-Json | ConvertTo-Json -Depth 5).Substring(0, [math]::Min(1000, $originalContent.Length)))
...
\`\`\`

## 中文显示层
\`\`\`json
$(($chineseDisplay | ConvertTo-Json -Depth 5).Substring(0, [math]::Min(1000, ($chineseDisplay | ConvertTo-Json -Depth 5).Length)))
...
\`\`\`

## 字段映射
| 英文字段 | 中文显示 |
|----------|----------|
$(
    $mappingTable = ""
    foreach ($key in $Mapping.fields.Keys | Sort-Object) {
        $mappingTable += "| $key | $($Mapping.fields[$key]) |`n"
    }
    $mappingTable
)

## 使用说明
1. 原始配置文件保持不变: \`$ConfigFile\`
2. 中文显示文件: \`$outputFile\`
3. 在界面中加载中文显示层即可显示中文

---
*生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
"@ | Out-File $compareFile -Encoding UTF8 -Force
        
        Write-Host "    📄 创建对比文档: $(Split-Path $compareFile -Leaf)" -ForegroundColor Gray
        
    } catch {
        Write-Host "    ❌ 处理失败: $_" -ForegroundColor Red
    }
}

# 创建中文界面覆盖CSS
Write-Host "`n🎨 创建中文界面样式..." -ForegroundColor Yellow

$chineseCSS = @"
/* OpenClaw中文界面样式覆盖 */
/* 创建时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') */

:lang(zh) {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', sans-serif;
}

/* 配置界面中文标签 */
.config-label {
  font-weight: bold;
  color: #4fc3f7;
}

.config-value {
  color: #333;
}

/* 中文提示信息 */
.tooltip-zh {
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
}

/* 按钮中文文本 */
.btn-zh {
  font-family: 'Microsoft YaHei', sans-serif;
  font-weight: 500;
}

/* 表格中文表头 */
.table-header-zh {
  font-family: 'Microsoft YaHei', sans-serif;
  font-weight: bold;
  background-color: #f5f5f5;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  :lang(zh) {
    color: #e0e0e0;
  }
  
  .config-label {
    color: #4fc3f7;
  }
  
  .config-value {
    color: #b0b0b0;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  :lang(zh) {
    font-size: 14px;
  }
}
"@

$chineseCSS | Out-File "$displayLayerDir\chinese-ui.css" -Encoding UTF8
Write-Host "✅ 创建中文界面样式文件" -ForegroundColor Green

# 创建中文界面加载脚本
Write-Host "`n📜 创建中文界面加载脚本..." -ForegroundColor Yellow

$loaderScript = @"
// OpenClaw中文界面加载器
// 自动加载中文显示层

(function() {
  'use strict';
  
  console.log('🔧 加载OpenClaw中文界面...');
  
  // 加载中文CSS
  function loadChineseCSS() {
    const cssId = 'openclaw-chinese-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = '/display/chinese/chinese-ui.css';
      document.head.appendChild(link);
      console.log('✅ 加载中文CSS');
    }
  }
  
  // 翻译界面文本
  function translateUIText() {
    const translations = {
      // 通用界面文本
      'Settings': '设置',
      'Configuration': '配置',
      'Models': '模型',
      'Plugins': '插件',
      'Skills': '技能',
      'Tools': '工具',
      'Memory': '记忆',
      'Logs': '日志',
      'Status': '状态',
      'Help': '帮助',
      'About': '关于',
      
      // 按钮文本
      'Save': '保存',
      'Cancel': '取消',
      'Apply': '应用',
      'Reset': '重置',
      'Refresh': '刷新',
      'Start': '启动',
      'Stop': '停止',
      'Restart': '重启',
      
      // 配置标签
      'Host': '主机',
      'Port': '端口',
      'Enabled': '启用',
      'Disabled': '禁用',
      'Theme': '主题',
      'Font': '字体',
      'Size': '大小',
      'Color': '颜色',
      
      // 状态信息
      'Connected': '已连接',
      'Disconnected': '已断开',
      'Running': '运行中',
      'Stopped': '已停止',
      'Loading': '加载中',
      'Ready': '就绪'
    };
    
    // 遍历DOM元素进行翻译
    function translateElement(element) {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent.trim();
        if (translations[text]) {
          element.textContent = translations[text];
        }
      } else if (element.nodeType === Node.ELEMENT_NODE) {
        // 翻译属性
        ['placeholder', 'title', 'alt'].forEach(attr => {
          if (element.hasAttribute(attr)) {
            const value = element.getAttribute(attr);
            if (translations[value]) {
              element.setAttribute(attr, translations[value]);
            }
          }
        });
        
        // 递归处理子元素
        element.childNodes.forEach(translateElement);
      }
    }
    
    // 开始翻译
    translateElement(document.body);
    console.log('✅ 界面文本翻译完成');
  }
  
  // 初始化
  function init() {
    // 设置文档语言
    document.documentElement.lang = 'zh-CN';
    
    // 加载CSS
    loadChineseCSS();
    
    // 翻译界面文本
    setTimeout(translateUIText, 1000);
    
    // 监听DOM变化
    const observer = new MutationObserver(translateUIText);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🎉 OpenClaw中文界面加载完成');
  }
  
  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
"@

$loaderScript | Out-File "$displayLayerDir\chinese-loader.js" -Encoding UTF8
Write-Host "✅ 创建中文界面加载脚本" -ForegroundColor Green

# 处理配置文件
Write-Host "`n📄 处理配置文件..." -ForegroundColor Yellow

$configFiles = @(
    "$OpenClawDir\config.json",
    "$OpenClawDir\models.json"
)

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        $fileName = Split-Path $configFile -Leaf
        if ($chineseConfig.ContainsKey($fileName)) {
            Create-ChineseDisplay -ConfigFile $configFile -Mapping $chineseConfig[$fileName]
        } else {
            Write-Host "  ℹ️ 跳过: $fileName (无映射配置)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️ 文件不存在: $configFile" -ForegroundColor Yellow
    }
}

# 创建使用说明文档
Write-Host "`n📖 创建使用说明文档..." -ForegroundColor Yellow

$readmeContent = @"
# 📚 OpenClaw中文显示层使用说明

## 🎯 概述
本工具为OpenClaw创建了中文显示层，可以在不修改原始英文配置的情况下，在界面中显示中文。

## 📁 目录结构
\`\`\`
$OpenClawDir/
├── display/chinese/          # 中文显示层目录
│   ├── config.json          # 中文显示配置文件
│   ├── models.json         # 中文模型配置
│   ├── chinese-ui.css      # 中文界面样式
│   ├── chinese-loader.js   # 中文界面加载器
│   └── *.compare.md        # 配置对比文档
├── config.json              # 原始英文配置（保持不变）
├── models.json             # 原始英文配置（保持不变）
└── ...其他文件
\`\`\`

## 🚀 使用方法

### 方法一：自动加载（推荐）
1. 在OpenClaw界面中打开开发者工具（F12）
2. 在Console标签页中粘贴以下代码：
\`\`\`javascript
// 加载中文界面
fetch('/display/chinese/chinese-loader.js')
  .then(response => response.text())
  .then(script => eval(script))
  .then(() => console.log('✅ 中文界面加载成功'))
  .catch(err => console.error('❌ 加载失败:', err));
\`\`\`

### 方法二：手动注入
1. 在OpenClaw界面HTML的<head>部分添加：
\`\`\`html
<link rel="stylesheet" href="/display/chinese/chinese-ui.css">
<script src="/display/chinese/chinese-loader.js"></script>
\`\`\`

### 方法三：浏览器书签
创建书签，URL设置为：
\`\`\`javascript
javascript:(function(){fetch('/display/chinese/chinese-loader.js').then(r=>r.text()).then(eval);})();
\`\`\`

## 🔧 配置说明

### 中文显示配置文件
- \`config.json\`: 主配置的中文显示版本
- \`models.json\`: 模型配置的中文显示版本
- 这些文件仅用于显示，不影响实际功能

### 界面样式
- \`chinese-ui.css\`: 中文界面样式优化
- 优化字体、间距、颜色等显示效果

### 自动翻译
- \`chinese-loader.js\`: 自动翻译界面文本
- 实时翻译新加载的内容

## 📊 优势

### ✅ 保持兼容性
- 原始英文配置保持不变
- 所有API和插件兼容性不受影响
- 无需修改OpenClaw源代码

### ✅ 灵活切换
- 可以随时启用或禁用中文显示
- 支持中英文混合显示
- 不影响其他语言用户

### ✅ 易于维护
- 中文翻译集中管理
- 可以单独更新翻译
- 支持增量添加新翻译

## 🛠️ 管理命令

### 查看中文显示层状态
```powershell
# 查看中文显示层文件
Get-ChildItem "$OpenClawDir\display\chinese"
```

### 更新中文翻译
```powershell
# 重新生成中文显示层
.\chinese_display_layer.ps1
```

### 禁用中文显示
```powershell
# 删除中文显示层
Remove-Item "$OpenClawDir\display\chinese" -Recurse -Force
```

## 🔄 集成到OpenClaw

### 自动加载配置
在OpenClaw配置中添加：
```json
{
  "ui": {
    "language": "zh-CN",
    "customScripts": [
      "/display/chinese/chinese-loader.js"
    ],
    "customStyles": [
      "/display/chinese/chinese-ui.css"
    ]
  }
}
```

### 网关配置
修改网关配置以提供中文显示层：
```json
{
  "gateway": {
    "static": {
      "/display": "$env:USERPROFILE/.openclaw/display"
    }
  }
}
```

## 🚨 注意事项

### 技术限制
1. **动态内容**: 部分动态生成的内容可能无法自动翻译
2. **第三方插件**: 第三方插件的界面可能不支持中文
3. **性能影响**: 客户端翻译可能轻微影响性能

### 解决方案
1. **手动翻译**: 对于无法自动翻译的内容，可以手动添加翻译
2. **插件适配**: 联系插件作者添加中文支持
3. **缓存优化**: 使用浏览器缓存提高性能

## 📈 未来扩展

### 计划功能
1. **翻译管理界面**: 网页界面管理翻译
2. **自动翻译API**: 集成翻译服务
3. **多语言切换**: 支持更多语言
4. **翻译贡献**: 社区贡献翻译

### 社区参与
欢迎贡献翻译和改进：
1. 提交翻译建议
2. 报告翻译问题
3. 改进翻译工具

---

## 🚀 快速开始

### 第一步：运行工具
```powershell
.\chinese_display_layer.ps1
```

### 第二步：启用中文显示
1. 打开OpenClaw界面
2. 按F12打开开发者工具
3. 在Console中运行加载脚本

### 第三步：验证效果
检查界面是否显示中文，配置项是否有中文标签。

## 📞 支持与反馈

如有问题或建议：
1. 检查日志文件
2. 查看对比文档
3. 联系技术支持

---

**📅 创建时间: $(Get-Date -Format 'yyyy年M月d日')**
**👨💻 作者: 88技术助手**
**🎯 目标: 让OpenClaw更好用！**"@