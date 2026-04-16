import os

output = []

# Header
output.append('# 完整聊天记录 - 2026-03-19 到 2026-03-30\n')
output.append('> 合并来源：每日备份（已压缩）+ Session原始记录（未压缩）\n')
output.append('> 生成时间：2026-03-30 13:00 GMT+8\n\n')

# 1. Daily archives 03-19 to 03-27
archives_dir = r'C:\openclaw\.openclaw\workspace\memory\backups\daily_archives'
for fname in sorted(os.listdir(archives_dir)):
    if fname.startswith('2026-03-') and fname.endswith('.md'):
        output.append('\n' + '='*60 + '\n')
        output.append('📅 ' + fname.replace(".md","") + '\n')
        output.append('='*60 + '\n')
        with open(os.path.join(archives_dir, fname), 'r', encoding='utf-8') as f:
            content = f.read()
            output.append(content)

# 2. Session raw messages from 03-29 (two sessions)
for sfpath, label in [
    (r'C:\openclaw\.openclaw\workspace\memory\sessions\user_messages_raw.txt', '💬 2026-03-29 Session 原始消息 (220610)'),
    (r'C:\openclaw\.openclaw\workspace\memory\sessions\user_messages_raw2.txt', '💬 2026-03-29 Session 原始消息 (222744)'),
]:
    output.append('\n' + '='*60 + '\n')
    output.append(label + '\n')
    output.append('='*60 + '\n')
    if os.path.exists(sfpath):
        with open(sfpath, 'r', encoding='utf-8') as f:
            output.append(f.read())
    else:
        output.append('[文件不存在]\n')

# 3. 2026-03-28.md (main workspace)
output.append('\n' + '='*60 + '\n')
output.append('📝 2026-03-28.md (workspace)\n')
output.append('='*60 + '\n')
fp = r'C:\openclaw\.openclaw\workspace\memory\2026-03-28.md'
if os.path.exists(fp):
    with open(fp, 'r', encoding='utf-8') as f:
        output.append(f.read())
else:
    output.append('[文件不存在]\n')

# 4. Write final output
outpath = r'C:\openclaw\.openclaw\workspace\memory\COMPLETE_CHAT_HISTORY.md'
final_text = '\n'.join(output)
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(final_text)

size_kb = len(final_text) // 1024
print(f'Done: {outpath} (~{size_kb}KB, {len(final_text)} chars)')
