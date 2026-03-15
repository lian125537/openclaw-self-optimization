#!/usr/bin/env python3
"""
成本守护者协议 - 自动检测和终止无限循环对话
"""

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

class CostGuardian:
    def __init__(self, workspace_path: str = None):
        self.workspace_path = workspace_path or os.path.expanduser("~/.openclaw/workspace")
        self.sessions_dir = os.path.expanduser("~/.openclaw/agents/main/sessions")
        self.protocol_path = os.path.join(self.workspace_path, ".learnings", "COST_PROTOCOL.md")
        
    def find_high_cost_sessions(self, max_lines: int = 200, max_duplicates: int = 10):
        """
        查找可疑的高成本会话
        """
        suspicious_sessions = []
        
        if not os.path.exists(self.sessions_dir):
            return suspicious_sessions
        
        for filename in os.listdir(self.sessions_dir):
            if filename.endswith('.jsonl'):
                filepath = os.path.join(self.sessions_dir, filename)
                try:
                    session_info = self.analyze_session(filepath, max_lines, max_duplicates)
                    if session_info['suspicious']:
                        suspicious_sessions.append(session_info)
                except Exception as e:
                    print(f"分析会话 {filename} 时出错: {e}")
        
        return suspicious_sessions
    
    def analyze_session(self, filepath: str, max_lines: int, max_duplicates: int) -> Dict:
        """分析单个会话文件"""
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        file_size = os.path.getsize(filepath)
        file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
        
        # 分析消息模式
        user_messages = []
        assistant_messages = []
        
        for line in lines:
            try:
                data = json.loads(line)
                if data.get('type') == 'message':
                    msg = data.get('message', {})
                    role = msg.get('role')
                    
                    # 提取内容（简化）
                    content = str(msg.get('content', ''))
                    if role == 'user':
                        user_messages.append(content[:100])
                    elif role == 'assistant':
                        assistant_messages.append(content[:100])
            except:
                continue
        
        # 计算重复率
        if len(user_messages) > 0:
            unique_user_msgs = set(user_messages)
            duplicate_rate = 1 - (len(unique_user_msgs) / len(user_messages))
        else:
            duplicate_rate = 0
        
        # 判断是否可疑
        suspicious = (
            file_size > 500000 or  # 大于500KB
            len(lines) > max_lines or  # 超过最大行数
            duplicate_rate > 0.7 or  # 重复率超过70%
            len(user_messages) > max_duplicates * 2  # 过多用户消息
        )
        
        return {
            'filename': os.path.basename(filepath),
            'filepath': filepath,
            'size': file_size,
            'lines': len(lines),
            'user_messages': len(user_messages),
            'assistant_messages': len(assistant_messages),
            'unique_user_msgs': len(set(user_messages)) if user_messages else 0,
            'duplicate_rate': duplicate_rate,
            'suspicious': suspicious,
            'last_modified': file_time.isoformat(),
            'age_hours': (datetime.now() - file_time).total_seconds() / 3600
        }
    
    def create_protocol(self):
        """创建成本控制协议"""
        protocol = """# 🍎 **成本控制协议** - 史蒂夫·乔布斯标准

## 📊 成本控制原则

### 1. **对话循环检测规则**
- 如果用户相同消息重复 **3次** 以上 → 进入循环保护模式
- 如果助手相同响应重复 **3次** 以上 → 直接终止
- 任何会话超过 **500条消息** 自动终止

### 2. **Token使用限额**
- **单会话**: 最大100,000 Token（立即告警）
- **每5分钟**: 最大10,000 Token
- **每天**: 最大1,000,000 Token（系统上限）

### 3. **重复模式检测算法**
```python
# 伪代码
def detect_loop(messages, threshold=3):
    recent_msgs = messages[-10:]  # 最近10条消息
    unique_count = len(set([hash(msg) for msg in recent_msgs]))
    if unique_count <= threshold:
        return True  # 进入循环
    return False
```

## 🛡️ **自动防护措施**

### A. 会话级别保护
1. **循环检测**: 每5条消息检查一次重复模式
2. **自动终止**: 如果检测到循环，发送"检测到对话循环，正在终止会话..."
3. **休眠冷却**: 终止后会话冷却5分钟

### B. 系统级别保护
1. **定时扫描**: Guardian系统每5分钟扫描所有活跃会话
2. **成本告警**: 单会话超过50,000 Token立即告警
3. **自动降级**: 成本超标后自动切换免费模型

## 🔄 **实施方案**

### 阶段1: 即时修复
1. 修改Guardian的Cron任务，添加循环检测
2. 创建防循环中间件
3. 部署监控仪表板

### 阶段2: 长期优化
1. 实现Token使用实时监控
2. 建立成本预算系统
3. 配置自动伸缩策略

## 📈 **成功指标**
- 循环对话发生率 < 1%
- 单日Token消耗 < 100万
- 异常会话检测率 > 95%

---
**苹果哲学**: "保持饥饿，保持愚蠢"——但对成本要保持警惕。
"""
        
        os.makedirs(os.path.dirname(self.protocol_path), exist_ok=True)
        with open(self.protocol_path, 'w', encoding='utf-8') as f:
            f.write(protocol)
        
        return protocol
    
    def generate_recommendations(self, suspicious_sessions: List[Dict]) -> List[str]:
        """基于分析生成推荐"""
        recommendations = []
        
        if suspicious_sessions:
            recs = [
                "🚨 发现可疑会话，建议:",
                f"1. 立即检查 {len(suspicious_sessions)} 个疑似循环会话",
                "2. 实施会话长度限制 (最大200消息)",
                "3. 添加重复消息检测逻辑",
                "4. 建立自动终止机制",
                "5. 配置成本告警阈值"
            ]
            recommendations.extend(recs)
        
        # 通用建议
        recommendations.extend([
            "💡 成本优化建议:",
            "1. 对控制UI实现防抖机制 (Debounce)",
            "2. 添加'会话暂停'功能",
            "3. 使用轻量级模型进行监控",
            "4. 建立成本预算日报告",
            "5. 实现自动模型切换 (成本超标→免费模型)"
        ])
        
        return recommendations

if __name__ == "__main__":
    guardian = CostGuardian()
    
    print("🧠 史蒂夫·乔布斯成本守护者 - 启动审计")
    print("=" * 60)
    
    # 查找可疑会话
    suspicious = guardian.find_high_cost_sessions()
    
    if suspicious:
        print(f"🔍 发现 {len(suspicious)} 个可疑会话:")
        for session in suspicious:
            print(f"   - {session['filename']}: {session['lines']}行, 重复率:{session['duplicate_rate']:.1%}")
            print(f"     大小: {session['size']:,}字节, 用户消息:{session['user_messages']}条")
    else:
        print("✅ 未发现可疑高成本会话")
    
    # 创建协议
    protocol_path = guardian.create_protocol()
    print(f"📝 成本控制协议已创建: {protocol_path}")
    
    # 生成推荐
    recommendations = guardian.generate_recommendations(suspicious)
    print("\n🎯 成本控制推荐方案:")
    for rec in recommendations:
        print(f"   {rec}")