#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动化修复 GitHub Actions 工作流文件
"""

import os
import re
import glob
from pathlib import Path

def fix_workflow_file(file_path):
    """修复单个工作流文件"""
    print(f"处理文件: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. 修复 actions/upload-artifact@v3 -> v4
    content = re.sub(
        r'uses:\s*actions/upload-artifact@v3',
        'uses: actions/upload-artifact@v4',
        content
    )
    
    # 2. 修复 actions/checkout@v3 -> v4
    content = re.sub(
        r'uses:\s*actions/checkout@v3',
        'uses: actions/checkout@v4',
        content
    )
    
    # 3. 修复 actions/setup-python@v4 -> v5
    content = re.sub(
        r'uses:\s*actions/setup-python@v4',
        'uses: actions/setup-python@v5',
        content
    )
    
    # 4. 修复 actions/github-script@v6 -> v7
    content = re.sub(
        r'uses:\s*actions/github-script@v6',
        'uses: actions/github-script@v7',
        content
    )
    
    # 5. 修复 actions/setup-node@v3 -> v4
    content = re.sub(
        r'uses:\s*actions/setup-node@v3',
        'uses: actions/setup-node@v4',
        content
    )
    
    # 6. 为 upload-artifact 添加 if-no-files-found: warn（如果还没有）
    # 查找所有 upload-artifact 部分
    lines = content.split('\n')
    fixed_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        fixed_lines.append(line)
        
        # 如果这一行是 upload-artifact
        if 'uses: actions/upload-artifact@v4' in line:
            # 查找这个步骤的 with 部分
            j = i + 1
            while j < len(lines) and lines[j].strip().startswith('with:'):
                fixed_lines.append(lines[j])
                j += 1
            
            # 继续查找 with 下的内容
            in_with = False
            has_if_no_files_found = False
            
            while j < len(lines) and (lines[j].startswith('  ') or lines[j].startswith('        ') or lines[j].startswith('    ')):
                if 'if-no-files-found:' in lines[j]:
                    has_if_no_files_found = True
                
                fixed_lines.append(lines[j])
                j += 1
            
            # 如果没有 if-no-files-found，添加它
            if not has_if_no_files_found and j > i:
                # 在最后一个 with 内容后添加
                fixed_lines.insert(-1, '        if-no-files-found: warn')
            
            i = j
        else:
            i += 1
    
    content = '\n'.join(fixed_lines)
    
    # 7. 更新 Python 版本到 3.11
    content = re.sub(
        r'python-version:\s*[\'"]3\.9[\'"]',
        "python-version: '3.11'",
        content
    )
    
    content = re.sub(
        r'python-version:\s*[\'"]3\.10[\'"]',
        "python-version: '3.11'",
        content
    )
    
    # 8. 更新 Node.js 版本到 22
    content = re.sub(
        r'node-version:\s*[\'"]20[\'"]',
        "node-version: '22'",
        content
    )
    
    content = re.sub(
        r'node-version:\s*[\'"]18[\'"]',
        "node-version: '22'",
        content
    )
    
    # 9. 修复权限设置（如果需要）
    if 'permissions:' not in content and 'github-script' in content:
        # 在 jobs 前添加权限
        lines = content.split('\n')
        fixed_lines = []
        
        for line in lines:
            fixed_lines.append(line)
            if line.strip() == 'jobs:' and 'permissions:' not in '\n'.join(fixed_lines[:-1]):
                fixed_lines.insert(-1, 'permissions:')
                fixed_lines.insert(-1, '  contents: write')
                fixed_lines.insert(-1, '  issues: write')
        
        content = '\n'.join(fixed_lines)
    
    # 检查是否有变化
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] 已修复")
        return True
    else:
        print(f"  [SKIP] 无需修复")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("GitHub Actions 工作流自动化修复")
    print("=" * 60)
    
    workflow_dir = Path(".github/workflows")
    workflow_files = list(workflow_dir.glob("*.yml"))
    
    print(f"找到 {len(workflow_files)} 个工作流文件")
    print()
    
    fixed_count = 0
    for workflow_file in workflow_files:
        if fix_workflow_file(str(workflow_file)):
            fixed_count += 1
        print()
    
    print("=" * 60)
    print(f"修复完成！共修复了 {fixed_count}/{len(workflow_files)} 个文件")
    print("=" * 60)
    
    # 生成修复报告
    report = f"""# GitHub Actions 工作流修复报告

修复时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 修复内容

1. **更新 actions 版本**:
   - actions/upload-artifact@v3 → v4
   - actions/checkout@v3 → v4
   - actions/setup-python@v4 → v5
   - actions/github-script@v6 → v7
   - actions/setup-node@v3 → v4

2. **添加缺失配置**:
   - 为所有 upload-artifact 步骤添加 `if-no-files-found: warn`
   - 为需要权限的工作流添加 `permissions` 配置

3. **更新运行时版本**:
   - Python 3.9/3.10 → 3.11
   - Node.js 18/20 → 22

## 修复统计
- 总文件数: {len(workflow_files)}
- 已修复文件: {fixed_count}
- 无需修复: {len(workflow_files) - fixed_count}

## 修复的文件列表
"""
    
    for workflow_file in workflow_files:
        report += f"- {workflow_file.name}\n"
    
    report += "\n---\n*本报告由自动化修复脚本生成*"
    
    # 保存报告
    os.makedirs("docs", exist_ok=True)
    with open("docs/workflow-fix-report.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"修复报告已保存到: docs/workflow-fix-report.md")

if __name__ == "__main__":
    main()