#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证 GitHub Actions 工作流文件完整性
"""

import os
import re
import glob
import yaml
from pathlib import Path

def validate_workflow_file(file_path):
    """验证单个工作流文件"""
    print(f"验证文件: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # 1. 检查 YAML 语法
    try:
        yaml.safe_load(content)
    except yaml.YAMLError as e:
        issues.append(f"YAML 语法错误: {e}")
    
    # 2. 检查关键 actions 版本
    checks = [
        (r'uses:\s*actions/upload-artifact@v[0-9]+', 'upload-artifact 版本', 'v4'),
        (r'uses:\s*actions/checkout@v[0-9]+', 'checkout 版本', 'v4'),
        (r'uses:\s*actions/setup-python@v[0-9]+', 'setup-python 版本', 'v5'),
        (r'uses:\s*actions/github-script@v[0-9]+', 'github-script 版本', 'v7'),
    ]
    
    for pattern, name, expected_version in checks:
        matches = re.findall(pattern, content)
        for match in matches:
            if expected_version not in match:
                issues.append(f"{name} 不是最新: {match}")
    
    # 3. 检查 upload-artifact 是否有 if-no-files-found
    upload_lines = re.findall(r'uses:\s*actions/upload-artifact@v4.*?\n(?:.*?\n)*?(?=\n\s*\w|$)', content, re.DOTALL)
    for block in upload_lines:
        if 'if-no-files-found:' not in block:
            issues.append("upload-artifact 缺少 if-no-files-found: warn")
    
    # 4. 检查 Python 版本
    python_version_matches = re.findall(r'python-version:\s*[\'"]([0-9.]+)[\'"]', content)
    for version in python_version_matches:
        if version not in ['3.11', '3.12']:
            issues.append(f"Python 版本较旧: {version}")
    
    # 5. 检查 Node.js 版本
    node_version_matches = re.findall(r'node-version:\s*[\'"]([0-9.]+)[\'"]', content)
    for version in node_version_matches:
        if version not in ['22', '23']:
            issues.append(f"Node.js 版本较旧: {version}")
    
    # 6. 检查权限设置（对于需要权限的工作流）
    if 'github-script' in content and 'permissions:' not in content:
        issues.append("缺少 permissions 配置")
    
    # 输出结果
    if issues:
        print(f"  [ISSUES] 发现 {len(issues)} 个问题:")
        for issue in issues:
            print(f"    - {issue}")
        return False, issues
    else:
        print(f"  [OK] 验证通过")
        return True, []

def main():
    """主函数"""
    print("=" * 60)
    print("GitHub Actions 工作流完整性验证")
    print("=" * 60)
    
    workflow_dir = Path(".github/workflows")
    workflow_files = list(workflow_dir.glob("*.yml"))
    
    print(f"找到 {len(workflow_files)} 个工作流文件")
    print()
    
    passed_count = 0
    failed_count = 0
    all_issues = {}
    
    for workflow_file in workflow_files:
        passed, issues = validate_workflow_file(str(workflow_file))
        if passed:
            passed_count += 1
        else:
            failed_count += 1
            all_issues[workflow_file.name] = issues
        print()
    
    print("=" * 60)
    print(f"验证完成！")
    print(f"通过: {passed_count}/{len(workflow_files)}")
    print(f"失败: {failed_count}/{len(workflow_files)}")
    print("=" * 60)
    
    # 生成验证报告
    report = f"""# GitHub Actions 工作流验证报告

验证时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 验证标准

1. **YAML 语法正确性**
2. **Actions 版本检查**:
   - actions/upload-artifact: v4
   - actions/checkout: v4
   - actions/setup-python: v5
   - actions/github-script: v7
3. **配置完整性**:
   - upload-artifact 包含 `if-no-files-found: warn`
   - 需要权限的工作流包含 `permissions` 配置
4. **运行时版本**:
   - Python: 3.11+
   - Node.js: 22+

## 验证结果

- 总文件数: {len(workflow_files)}
- 通过验证: {passed_count}
- 验证失败: {failed_count}
- 通过率: {passed_count/len(workflow_files)*100:.1f}%

## 详细结果
"""
    
    if all_issues:
        report += "\n### 发现的问题\n"
        for filename, issues in all_issues.items():
            report += f"\n**{filename}**\n"
            for issue in issues:
                report += f"- {issue}\n"
    else:
        report += "\n✅ 所有工作流文件都通过了验证！\n"
    
    report += "\n### 文件列表\n"
    for workflow_file in workflow_files:
        status = "✅ 通过" if workflow_file.name not in all_issues else "❌ 失败"
        report += f"- {workflow_file.name} - {status}\n"
    
    report += "\n---\n*本报告由自动化验证脚本生成*"
    
    # 保存报告
    os.makedirs("docs", exist_ok=True)
    with open("docs/workflow-validation-report.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"验证报告已保存到: docs/workflow-validation-report.md")
    
    return passed_count == len(workflow_files)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)