import json
import re
from datetime import datetime
from collections import defaultdict

session_file = r"C:\Users\yodat\.openclaw\agents\main\sessions\6609cc0c-39eb-44db-aee2-b9fb0871815e.jsonl"

print("正在分析会话时间分布...")
print("-" * 60)

# 存储时间分析
timestamps = []
message_timestamps = []
user_msg_timestamps = []
assistant_msg_timestamps = []

with open(session_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            
            # 提取时间戳
            if 'timestamp' in data:
                ts_str = data['timestamp']
                try:
                    if 'Z' in ts_str:
                        dt = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    else:
                        dt = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%S.%f")
                    timestamps.append(dt)
                    
                    # 如果是消息，额外记录
                    if data.get('type') == 'message':
                        msg_role = data.get('message', {}).get('role', '')
                        if msg_role == 'user':
                            user_msg_timestamps.append(dt)
                        elif msg_role == 'assistant':
                            assistant_msg_timestamps.append(dt)
                        
                except ValueError as e:
                    pass
                    
        except json.JSONDecodeError:
            continue

if timestamps:
    print(f"会话时间范围:")
    print(f"   开始: {min(timestamps).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"   结束: {max(timestamps).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    
    duration = max(timestamps) - min(timestamps)
    total_seconds = duration.total_seconds()
    
    print(f"   持续时间: {duration}")
    print(f"   总秒数: {total_seconds:.0f}")
    
    print(f"\n消息频率:")
    print(f"   总消息数: 364 (用户49 + 助手203 + 其他)")
    
    if total_seconds > 0:
        msg_per_second = 364 / total_seconds
        msg_per_minute = msg_per_second * 60
        print(f"   消息频率: {msg_per_second:.3f} 条/秒 ({msg_per_minute:.1f} 条/分钟)")
        
        if len(user_msg_timestamps) > 1:
            user_avg_interval = (user_msg_timestamps[-1] - user_msg_timestamps[0]).total_seconds() / len(user_msg_timestamps)
            print(f"   用户消息间隔: {user_avg_interval:.1f} 秒")
        if len(assistant_msg_timestamps) > 1:
            assistant_avg_interval = (assistant_msg_timestamps[-1] - assistant_msg_timestamps[0]).total_seconds() / len(assistant_msg_timestamps)
            print(f"   助手消息间隔: {assistant_avg_interval:.1f} 秒")
else:
    print("未能提取到时间戳")

# 检查是否有重复或相似的消息
print("\n" + "-" * 60)
print("检查可能的循环/重复模式...")

# 读取最后几行的内容
with open(session_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
if len(lines) > 10:
    print("最后10行的消息内容:")
    for i in range(max(0, len(lines)-10), len(lines)):
        try:
            data = json.loads(lines[i])
            if data.get('type') == 'message':
                msg = data.get('message', {})
                if msg.get('role') == 'user':
                    content = msg.get('content', [])
                    if isinstance(content, list) and content:
                        text = content[0].get('text', '') if isinstance(content[0], dict) else str(content)
                        print(f"   User: {text[:100]}...")
                elif msg.get('role') == 'assistant':
                    content = msg.get('content', '')
                    print(f"   Assistant: {content[:100].replace(chr(10), ' ')}...")
        except:
            pass