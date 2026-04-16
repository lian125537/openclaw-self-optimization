# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 🔐 API Keys & 安全配置

> API Keys 已配置在系统 secrets 中，不要明文记录

### Siliconflow
- 用途: 主对话模型 (GLM-5, DeepSeek-R1)
- 状态: ✅ 已配置

### Minimax
- 用途: MiniMax-M2.7 模型
- 状态: ✅ 已配置

---

## 🌐 代理配置

| 服务 | 端口 | 用途 |
|------|------|------|
| 本地代理 | 10794 | 检查是否开启 |

### 检查命令 (PowerShell)
```powershell
# 检查端口是否开启
Test-NetConnection -ComputerName localhost -Port 10794
```

---

Add whatever helps you do your job. This is your cheat sheet.

---

## 🔧 Skills 位置

```
C:\Users\yodat\AppData\Local\Programs\ClawX\resources\openclaw\skills\
```

共 58 个技能。

## 📁 关键路径

| 用途 | 路径 |
|------|------|
| Skills | `C:\Users\yodat\AppData\Local\Programs\ClawX\resources\openclaw\skills\` |
| Workspace | `C:\openclaw\.openclaw\workspace\` |
| Hermes 备份 | `C:\Users\yodat\Desktop\hermes-backup\` |
| Workspace 备份 | `C:\Users\yodat\Desktop\workspace_backup\` |

## 🗄️ 数据库

| 数据库 | 路径 |
|--------|------|
| Hermes 会话 | `C:\Users\yodat\Desktop\hermes-backup\state.db` (SQLite, 18MB, 143 sessions) |

## 🤖 身份

- 我是 **Steve Jobs 🍎**
- Bo 是 **Bo (波仔)**
- L5 授权：完全信任 + 自主执行
