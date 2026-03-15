import json
import os
from collections import Counter

session_file = r"C:\Users\yodat\.openclaw\agents\main\sessions\6609cc0c-39eb-44db-aee2-b9fb0871815e.jsonl"

print(f"正在分析会话文件: {session_file}")
print("-" * 60)

# 统计信息
total_lines = 0
message_count = 0
thinking_count = 0
tool_call_count = 0
tool_result_count = 0
model_changes = 0
user_messages = 0
assistant_messages = 0

# 统计Token使用（如果记录中有）
total_input_tokens = 0
total_output_tokens = 0

with open(session_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            total_lines += 1
            
            # 统计不同类型的事件
            if data.get('type') == 'message':
                message_count += 1
                msg = data.get('message', {})
                if msg.get('role') == 'user':
                    user_messages += 1
                elif msg.get('role') == 'assistant':
                    assistant_messages += 1
                    
            elif data.get('type') == 'thinking':
                thinking_count += 1
            elif data.get('type') == 'tool_call':
                tool_call_count += 1
            elif data.get('type') == 'tool_result':
                tool_result_count += 1
            elif data.get('type') == 'model_change':
                model_changes += 1
                
            # 提取Token使用信息
            if 'tokens' in data or 'usage' in data:
                if 'tokens' in data:
                    tokens = data['tokens']
                    total_input_tokens += tokens.get('input', 0)
                    total_output_tokens += tokens.get('output', 0)
                elif 'usage' in data:
                    usage = data['usage']
                    total_input_tokens += usage.get('promptTokens', 0)
                    total_output_tokens += usage.get('completionTokens', 0)
                    
        except json.JSONDecodeError as e:
            print(f"Line {total_lines+1} JSON decode error: {e}")

print(f"=== FILE BASIC INFO ===")
print(f"   Total lines: {total_lines}")
print(f"   Messages: {message_count}")
print(f"      - User: {user_messages}")
print(f"      - Assistant: {assistant_messages}")
print(f"   Thinking records: {thinking_count}")
print(f"   Tool calls: {tool_call_count}")
print(f"   Tool results: {tool_result_count}")
print(f"   Model changes: {model_changes}")
print(f"   Token usage found:")
print(f"      - Input tokens: {total_input_tokens:,}")
print(f"      - Output tokens: {total_output_tokens:,}")
print(f"      - Total tokens: {(total_input_tokens + total_output_tokens):,}")

# 计算文件大小
file_size = os.path.getsize(session_file)
print(f"=== FILE SIZE ===")
print(f"   Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
print(f"   Estimated tokens: ~{file_size * 2:,}")
print(f"   Lines per message (est): {(user_messages+assistant_messages)/total_lines*100:.1f}%")