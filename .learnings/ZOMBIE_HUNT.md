### 🧟 幽霊プロセス狩り - 2026-03-15

**スキャン時刻:** 2026-03-15 21:03:58 (UTC+8)

**検出結果:**
| PID | ProcessName | Memory(MB) | Runtime | Status |
|-----|-------------|------------|---------|--------|
| 11052 | node | 637.41 | 00:12:43 | Responding ✓ |

**詳細:**
- Path: C:\vm4w\nodejs\node.exe
- CPU: 44.58s
- 状態:  정상 응답 (アクティブプロセス)

**判定:** ⚠️ 監視対象 - メモリ使用量高だが応答あり

---
# Zombie Process Hunt Log

## Scan Time: 2026-03-15 21:00 (Asia/Shanghai)

---

### 🔴 PORT CONFLICT DETECTED: 18789

| Property | Value |
|----------|-------|
| **Issue** | Port 18789 is bound by multiple processes |
| **PID 20104** | com.docker.backend.exe (Docker Daemon) - bound to 0.0.0.0:18789 |
| **PID 11052** | node.exe (OpenClaw Gateway) - bound to 127.0.0.1:18789 |
| **Docker Container** | openclaw-gateway (0.0.0.0:18789->18789/tcp) |

### Analysis

**Root Cause**: Docker container `openclaw-gateway` is port-mapped to host port 18789, conflicting with the native OpenClaw Gateway running on localhost.

**Impact**: 
- External connections may be intercepted by Docker
- Gateway status shows "unreachable" 
- The gateway is only accessible via localhost (127.0.0.1)

### Resolution Options

1. **Stop Docker container** (if native gateway is preferred):
   ```bash
   docker stop openclaw-gateway
   ```

2. **Use Docker gateway only** (stop native gateway):
   ```bash
   taskkill /PID 11052
   ```

3. **Change native gateway port** (in config):
   ```bash
   openclaw gateway port <new-port>
   ```

### Recommendation

**⚠️ DO NOT auto-kill** - Requires user decision on which gateway to use:
- Native gateway (node.exe) + Docker containers = port conflict
- Choose one as primary

---

## Scan Time: 2026-03-15 20:03 (Asia/Shanghai)

---

### 🟡 NOTICE: High Memory Process Detected

| Property | Value |
|----------|-------|
| **PID** | 26356 |
| **Process** | node |
| **Path** | C:\vm4w\nodejs\node.exe |
| **Memory** | 561.37 MB |
| **CPU Time** | 30.92s |
| **Started** | 2026/3/15 19:59:06 |
| **Status** | ✅ Responding (Healthy) |

### Analysis

- Process is **alive and responding** (not a true zombie)
- Memory usage: **561 MB** (above 500MB threshold)
- Likely the OpenClaw Gateway or an active sub-agent session

### Recommendation

**No action needed** - This appears to be the active OpenClaw Gateway process. It is responsive and functioning normally. High memory is expected for the gateway which runs agent sessions.

If you notice performance issues, consider:
- Reviewing active sessions: `sessions_list`
- Restarting gateway if needed: `openclaw gateway restart`

---

### Stats
- **Processes Scanned**: node, pwsh (python not installed)
- **High Memory (>500MB)**: 1
- **Hung/Zombie**: 0
- **Recommend Cleanup**: No

---

### Stats
- **Port Conflicts**: 1 (18789)
- **Action Required**: Yes - user must choose gateway strategy

---
*Autonomous scan completed at 2026-03-15 21:00:00*

---

## Scan Time: 2026-03-15 21:16 (Asia/Shanghai)

### ✅ PORT 18789 STATUS: HEALTHY

| Property | Value |
|----------|-------|
| **PID 20104** | com.docker.backend.exe - bound to 0.0.0.0:18789, [::]:18789 |
| **PID 11052** | node.exe (OpenClaw Gateway) - bound to 127.0.0.1:18789, [::1]:18789 |
| **Health Check** | HTTP 200 ✅ |

**Analysis:**
- Both processes are legitimate (Docker + OpenClaw Gateway)
- Gateway responding normally on localhost
- No zombie or ghost processes detected

**判定:** ✅ 健康 - 清理不要

---
*Autonomous scan completed at 2026-03-15 21:16:42*
