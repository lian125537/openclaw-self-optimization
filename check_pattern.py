import json
import os

session_file = r"C:\Users\yodat\.openclaw\agents\main\sessions\6609cc0c-39eb-44db-aee2-b9fb0871815e.jsonl"

print("正在检查会话模式，重点查看消息序列...")
print("=" * 70)

# 读取并分组消息
messages = []
current_chat = []

with open(session_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'message':
                msg = data.get('message', {})
                role = msg.get('role')
                content = msg.get('content', '')
                
                # 提取文本内容
                text_content = ""
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'text':
                            text_content = item.get('text', '')
                            break
                        elif isinstance(item, str):
                            text_content = item
                            break
                elif isinstance(content, str):
                    text_content = content
                
                messages.append({
                    'role': role,
                    'content': text_content[:100].replace('\n', ' ') if text_content else '',
                    'timestamp': data.get('timestamp', '')
                })
                
                if role == 'user':
                    if current_chat:
                        # 分析之前的对话
                        if len(current_chat) > 2:
                            print(f"\n对话组 ({len(current_chat)} 条消息):")
                            for m in current_chat:
                                print(f"  {m['role']}: {m['content']}")
                    
                    current_chat = []
                
                current_chat.append({
                    'role': role,
                    'content': text_content[:100].replace('\n', ' ') if text_content else ''
                })
                
        except Exception as e:
            continue

print(f"\n✅ 总计分析了 {len(messages)} 条消息记录")
print(f"\n📋 消息角色分布:")
from collections import Counter
role_counts = Counter([m['role'] for m in messages])
for role, count in role_counts.items():
    print(f"  {role}: {count} 条")

# 检查是否有相似/重复的用户消息
print(f"\n🔍 检查用户消息模式:")
user_messages = [m for m in messages if m['role'] == 'user']
if user_messages:
    # 显示前5条和后5条用户消息
    print("前5条用户消息:")
    for i, msg in enumerate(user_messages[:5]):
        print(f"  {i+1}. {msg['content']}")
    
    print("\n最后5条用户消息:")
    for i, msg in enumerate(user_messages[-5:]):
        print(f"  {len(user_messages)-4+i}. {msg['content'][:80]}...")
    
    # 检查是否有重复模式
    contents = [msg['content'] for msg in user_messages]
    duplicate_count = len(contents) - len(set(contents))
    print(f"\n⚠️ 发现 {duplicate_count} 条重复的用户消息")