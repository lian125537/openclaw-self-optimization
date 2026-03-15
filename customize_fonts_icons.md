# 🎨 OpenClaw字体和图标自定义指南

## 📋 目录
1. [字体自定义](#字体自定义)
2. [图标自定义](#图标自定义)
3. [配置文件位置](#配置文件位置)
4. [示例配置](#示例配置)
5. [最佳实践](#最佳实践)

---

## 字体自定义

### 🎯 在哪里设置字体

#### 1. **配置文件设置** (`config.json`)
```json
{
  "ui": {
    "fontFamily": "Microsoft YaHei, Segoe UI, sans-serif",
    "fontSize": "16px",
    "lineHeight": "1.6",
    "theme": {
      "primaryFont": "Microsoft YaHei",
      "secondaryFont": "Segoe UI",
      "codeFont": "Consolas, Monaco, monospace",
      "headingFont": "Microsoft YaHei"
    }
  }
}
```

#### 2. **CSS文件设置** (`custom.css`)
```css
/* 全局字体设置 */
:root {
  --font-primary: 'Microsoft YaHei', 'Segoe UI', sans-serif;
  --font-secondary: 'Segoe UI', sans-serif;
  --font-code: 'Consolas', 'Monaco', monospace;
  --font-size-base: 16px;
  --font-size-small: 14px;
  --font-size-large: 18px;
}

/* 应用到所有元素 */
* {
  font-family: var(--font-primary);
}

/* 聊天消息字体 */
.message {
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
  line-height: 1.6;
}

/* 用户消息 */
.message.user {
  font-weight: 500;
}

/* AI消息 */
.message.ai {
  font-style: italic;
}

/* 代码块字体 */
code, pre {
  font-family: var(--font-code);
  font-size: var(--font-size-small);
}

/* 标题字体 */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  font-weight: bold;
}

/* 输入框字体 */
input, textarea, button {
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
}
```

### 🎨 推荐字体组合

#### 中文优先组合
```css
font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'WenQuanYi Micro Hei', sans-serif;
```

#### 英文优先组合
```css
font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
```

#### 代码字体组合
```css
font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
```

---

## 图标自定义

### 🎯 图标目录结构
```
C:\Users\你的用户名\.openclaw\
├── icons/                    # 图标主目录
│   ├── light/               # 浅色主题图标
│   │   ├── send.svg
│   │   ├── attach.svg
│   │   ├── settings.svg
│   │   └── more...
│   ├── dark/                # 深色主题图标
│   │   ├── send.svg
│   │   ├── attach.svg
│   │   ├── settings.svg
│   │   └── more...
│   ├── custom/              # 自定义图标
│   │   ├── logo.png
│   │   ├── avatar.jpg
│   │   └── favicon.ico
│   └── icon-config.json     # 图标配置文件
```

### ⚙️ 图标配置文件 (`icon-config.json`)
```json
{
  "iconSet": "custom",  // 可选: "material", "fontawesome", "custom"
  
  "theme": {
    "mode": "auto",     // auto, light, dark
    "light": {
      "path": "icons/light/",
      "extension": ".svg"
    },
    "dark": {
      "path": "icons/dark/",
      "extension": ".svg"
    }
  },
  
  "customIcons": {
    "send": "icons/custom/send.svg",
    "attach": "icons/custom/attach.svg",
    "settings": "icons/custom/settings.svg",
    "user": "icons/custom/user.svg",
    "ai": "icons/custom/ai.svg",
    "logo": "icons/custom/logo.png",
    "favicon": "icons/custom/favicon.ico"
  },
  
  "sizes": {
    "small": "16px",
    "medium": "24px",
    "large": "32px",
    "xlarge": "48px"
  },
  
  "colors": {
    "primary": "#4fc3f7",
    "secondary": "#9575cd",
    "success": "#4caf50",
    "warning": "#ff9800",
    "error": "#f44336"
  }
}
```

### 🎨 CSS图标样式
```css
/* 图标基础样式 */
.icon {
  display: inline-block;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* 图标大小 */
.icon-small { width: 16px; height: 16px; }
.icon-medium { width: 24px; height: 24px; }
.icon-large { width: 32px; height: 32px; }

/* 特定图标 */
.icon-send {
  background-image: url('../icons/custom/send.svg');
}

.icon-attach {
  background-image: url('../icons/custom/attach.svg');
}

.icon-settings {
  background-image: url('../icons/custom/settings.svg');
}

/* 深色主题图标 */
@media (prefers-color-scheme: dark) {
  .icon-send {
    background-image: url('../icons/dark/send.svg');
  }
  
  .icon-attach {
    background-image: url('../icons/dark/attach.svg');
  }
}
```

---

## 配置文件位置

### 📁 主要配置文件
| 文件 | 路径 | 用途 |
|------|------|------|
| 主配置 | `C:\Users\yodat\.openclaw\config.json` | 系统全局配置 |
| 字体CSS | `C:\Users\yodat\.openclaw\custom.css` | 自定义字体样式 |
| 图标配置 | `C:\Users\yodat\.openclaw\icons\icon-config.json` | 图标设置 |
| 主题配置 | `C:\Users\yodat\.openclaw\theme.json` | 主题颜色设置 |

### 📂 资源目录
```
C:\Users\yodat\.openclaw\
├── assets/          # 静态资源
│   ├── fonts/       # 自定义字体文件
│   ├── images/      # 图片资源
│   └── sounds/      # 音效文件
├── ui/              # 界面相关
│   ├── styles/      # 样式文件
│   ├── scripts/     # 脚本文件
│   └── templates/   # 模板文件
└── plugins/         # 插件资源
```

---

## 示例配置

### 完整字体配置示例
```json
{
  "ui": {
    "fontFamily": "'Microsoft YaHei', 'Segoe UI', sans-serif",
    "fontSize": "16px",
    "lineHeight": "1.6",
    "fontWeight": {
      "normal": "400",
      "medium": "500",
      "bold": "700"
    },
    "theme": {
      "primaryFont": "'Microsoft YaHei', sans-serif",
      "secondaryFont": "'Segoe UI', sans-serif",
      "codeFont": "'Consolas', 'Monaco', monospace",
      "headingFont": "'Microsoft YaHei', sans-serif",
      "uiFont": "'Segoe UI', sans-serif"
    }
  }
}
```

### 完整图标配置示例
```json
{
  "icons": {
    "set": "custom",
    "theme": "auto",
    "paths": {
      "light": "icons/light/",
      "dark": "icons/dark/",
      "custom": "icons/custom/"
    },
    "mapping": {
      "action": {
        "send": "send.svg",
        "attach": "attach.svg",
        "settings": "settings.svg",
        "delete": "delete.svg",
        "edit": "edit.svg"
      },
      "status": {
        "online": "online.svg",
        "offline": "offline.svg",
        "typing": "typing.svg",
        "error": "error.svg"
      },
      "ui": {
        "menu": "menu.svg",
        "close": "close.svg",
        "maximize": "maximize.svg",
        "minimize": "minimize.svg"
      }
    }
  }
}
```

---

## 最佳实践

### 🏆 字体最佳实践
1. **使用系统字体** - 优先使用用户系统已安装的字体
2. **提供回退方案** - 总是提供字体回退链
3. **考虑可读性** - 确保字体大小和行高适合阅读
4. **保持一致性** - 在整个界面中使用一致的字体方案
5. **测试不同语言** - 确保字体支持中英文混合

### 🏆 图标最佳实践
1. **使用SVG格式** - SVG图标可缩放且文件小
2. **提供多尺寸** - 为不同使用场景提供不同尺寸
3. **支持主题** - 为深色/浅色主题提供不同版本
4. **保持简洁** - 图标设计要简洁明了
5. **统一风格** - 所有图标保持一致的视觉风格

### 🔧 调试技巧
1. **浏览器开发者工具** - 使用F12检查字体和图标
2. **清除缓存** - 修改后清除浏览器缓存
3. **逐步修改** - 一次只修改一个设置，便于调试
4. **备份配置** - 修改前备份原始配置文件
5. **测试不同设备** - 在不同屏幕尺寸上测试效果

---

## 🚀 快速开始

### 第一步：创建配置文件
```bash
# 创建自定义CSS文件
New-Item "$env:USERPROFILE\.openclaw\custom.css" -Force

# 创建图标目录
New-Item "$env:USERPROFILE\.openclaw\icons" -ItemType Directory -Force
```

### 第二步：添加基本配置
将上面的示例配置复制到相应文件中。

### 第三步：重启OpenClaw
```bash
openclaw gateway restart
```

### 第四步：刷新浏览器
刷新OpenClaw控制界面查看效果。

---

**📅 最后更新: 2026-03-04**
**👨💻 作者: 88技术助手**