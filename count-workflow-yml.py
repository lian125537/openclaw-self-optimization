#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计所有仓库中包含 "workflow" 的 .yml 文件
"""

import os
import re
from pathlib import Path

def find_repositories(root_dir):
    """查找所有可能的仓库目录"""
    repos = []
    
    # 首先检查根目录本身是否是一个仓库
    if (Path(root_dir) / ".git").exists():
        repos.append(root_dir)
    
    # 查找子目录中的仓库
    for item in os.listdir(root_dir):
        item_path = Path(root_dir) / item
        if item_path.is_dir():
            # 检查是否有 .git 目录
            if (item_path / ".git").exists():
                repos.append(str(item_path))
            # 检查是否有明显的仓库特征
            elif any(x in item.lower() for x in ['repo', 'project', 'code', 'src']):
                repos.append(str(item_path))
    
    # 添加已知的仓库
    known_repos = [
        "openclaw-self-optimization",
        "memU",
        "test-clone",
        "test-clone2",
        "test-eclaire",
        "test-eclaire-new"
    ]
    
    for repo in known_repos:
        repo_path = Path(root_dir) / repo
        if repo_path.exists():
            repos.append(str(repo_path))
    
    # 去重
    repos = list(set(repos))
    return repos

def count_workflow_yml_files(repo_path):
    """统计仓库中包含 "workflow" 的 .yml 文件"""
    repo_name = Path(repo_path).name
    workflow_files = []
    
    # 查找所有 .yml 文件
    for root, dirs, files in os.walk(repo_path):
        for file in files:
            if file.lower().endswith('.yml') or file.lower().endswith('.yaml'):
                file_path = Path(root) / file
                # 检查文件名是否包含 "workflow"（不区分大小写）
                if 'workflow' in file.lower():
                    workflow_files.append(str(file_path))
                else:
                    # 检查文件内容是否包含 "workflow"
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            if 'workflow' in content.lower():
                                workflow_files.append(str(file_path))
                    except:
                        pass
    
    return repo_name, workflow_files

def main():
    """主函数"""
    workspace_dir = r"C:\Users\yodat\.openclaw\workspace"
    
    print("=" * 60)
    print("仓库中包含 'workflow' 的 .yml 文件统计")
    print("=" * 60)
    
    # 查找所有仓库
    repos = find_repositories(workspace_dir)
    print(f"找到 {len(repos)} 个仓库:")
    for repo in repos:
        print(f"  - {Path(repo).name}")
    print()
    
    # 统计每个仓库
    total_files = 0
    repo_stats = []
    
    for repo in repos:
        repo_name, workflow_files = count_workflow_yml_files(repo)
        count = len(workflow_files)
        total_files += count
        
        repo_stats.append({
            'name': repo_name,
            'path': repo,
            'count': count,
            'files': workflow_files
        })
    
    # 按文件数量排序
    repo_stats.sort(key=lambda x: x['count'], reverse=True)
    
    # 输出结果
    print("统计结果:")
    print("-" * 60)
    
    for stat in repo_stats:
        if stat['count'] > 0:
            print(f"[{stat['name']}]: {stat['count']} 个文件")
            for file in stat['files']:
                # 显示相对路径
                rel_path = Path(file).relative_to(Path(stat['path']))
                print(f"    * {rel_path}")
            print()
    
    print("-" * 60)
    print(f"总计: {total_files} 个包含 'workflow' 的 .yml 文件")
    print("=" * 60)
    
    # 生成报告
    report = f"""# 仓库工作流文件统计报告

统计时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
工作空间: {workspace_dir}

## 统计摘要

- 仓库总数: {len(repos)}
- 包含工作流文件的仓库: {len([r for r in repo_stats if r['count'] > 0])}
- 工作流文件总数: {total_files}

## 详细统计

"""
    
    for stat in repo_stats:
        if stat['count'] > 0:
            report += f"### {stat['name']} ({stat['count']} 个文件)\n\n"
            for file in stat['files']:
                rel_path = Path(file).relative_to(Path(stat['path']))
                report += f"- {rel_path}\n"
            report += "\n"
    
    # 保存报告
    report_path = Path(workspace_dir) / "workflow-file-stats.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n详细报告已保存到: {report_path}")

if __name__ == "__main__":
    main()