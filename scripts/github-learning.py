#!/usr/bin/env python3
"""
GitHub 学习功能
搜索和学习开源项目，提取最佳实践
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = PROJECT_ROOT / "docs"

def search_github_repos(query, language=None, max_results=10):
    """搜索 GitHub 仓库"""
    print(f"搜索 GitHub 仓库: {query}")
    
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.exe" search repos "{query}"'
    if language:
        cmd += f' --language {language}'
    cmd += f' --limit {max_results}'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore')
        return result.stdout.strip() if result.stdout else ""
    except subprocess.CalledProcessError as e:
        print(f"搜索失败: {str(e)}")
        return ""

def get_repo_details(repo_name):
    """获取仓库详细信息"""
    print(f"获取仓库信息: {repo_name}")
    
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.exe" api repos/{repo_name} --jq .'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore')
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
        print(f"获取仓库信息失败: {str(e)}")
        return None

def analyze_repo_structure(repo_name):
    """分析仓库结构"""
    print(f"分析仓库结构: {repo_name}")
    
    # 获取仓库文件列表
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.exe" api repos/{repo_name}/contents --jq .[].name'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore')
        files = result.stdout.strip().split('\n') if result.stdout else []
        
        structure = {
            "has_readme": "README.md" in files,
            "has_workflow": ".github/workflows" in files,
            "has_scripts": "scripts" in files,
            "has_config": "config" in files,
            "file_count": len(files),
            "file_list": files
        }
        
        return structure
    except subprocess.CalledProcessError as e:
        print(f"分析仓库结构失败: {str(e)}")
        return None

def extract_best_practices(repo_name):
    """提取最佳实践"""
    print(f"提取最佳实践: {repo_name}")
    
    details = get_repo_details(repo_name)
    if not details:
        return None
    
    structure = analyze_repo_structure(repo_name)
    
    practices = {
        "repo_name": repo_name,
        "stars": details.get("stargazers_count", 0),
        "forks": details.get("forks_count", 0),
        "description": details.get("description", ""),
        "topics": details.get("topics", []),
        "structure": structure,
        "best_practices": []
    }
    
    # 基于仓库特征提取最佳实践
    if structure and structure["has_workflow"]:
        practices["best_practices"].append("使用 GitHub Actions 进行自动化")
    
    if structure and structure["has_scripts"]:
        practices["best_practices"].append("模块化脚本组织")
    
    if structure and structure["has_config"]:
        practices["best_practices"].append("配置文件分离")
    
    if details.get("stargazers_count", 0) > 100:
        practices["best_practices"].append("高星项目，值得学习")
    
    return practices

def search_clawhub_skills():
    """搜索 ClawHub 技能"""
    print("搜索 ClawHub 技能...")
    
    # 搜索 OpenClaw 相关项目
    queries = [
        "openclaw skill",
        "clawhub skill",
        "openclaw automation",
        "openclaw workflow"
    ]
    
    results = []
    for query in queries:
        repos = search_github_repos(query, "python", 5)
        if repos:
            results.append({
                "query": query,
                "repos": repos.split('\n')
            })
    
    return results

def generate_learning_report():
    """生成学习报告"""
    print("生成学习报告...")
    
    # 搜索相关项目
    clawhub_skills = search_clawhub_skills()
    
    # 分析热门项目
    popular_repos = [
        "openclaw/openclaw",
        "clawhub/clawhub",
        "openclaw/skills"
    ]
    
    best_practices = []
    for repo in popular_repos:
        practices = extract_best_practices(repo)
        if practices:
            best_practices.append(practices)
    
    # 创建报告
    report = {
        "timestamp": datetime.now().isoformat(),
        "clawhub_skills": clawhub_skills,
        "best_practices": best_practices,
        "recommendations": []
    }
    
    # 生成推荐
    for practice in best_practices:
        if "高星项目" in practice["best_practices"]:
            report["recommendations"].append({
                "type": "learn_from_popular",
                "repo": practice["repo_name"],
                "reason": "高星项目，值得学习"
            })
    
    # 保存报告
    DATA_DIR.mkdir(exist_ok=True)
    report_file = DATA_DIR / "github-learning-report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    markdown_report = f"""# GitHub 学习报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 🔍 ClawHub 技能搜索

"""
    
    for skill_search in clawhub_skills:
        markdown_report += f"### 搜索: {skill_search['query']}\n"
        for repo in skill_search['repos']:
            if repo:
                markdown_report += f"- {repo}\n"
        markdown_report += "\n"
    
    markdown_report += f"""

## 💡 最佳实践提取

"""
    
    for practice in best_practices:
        markdown_report += f"### {practice['repo_name']}\n"
        markdown_report += f"- **Stars**: {practice['stars']}\n"
        markdown_report += f"- **Forks**: {practice['forks']}\n"
        markdown_report += f"- **描述**: {practice['description']}\n"
        markdown_report += f"- **最佳实践**:\n"
        for p in practice['best_practices']:
            markdown_report += f"  - {p}\n"
        markdown_report += "\n"
    
    markdown_report += f"""

## 🎯 推荐行动

"""
    
    for rec in report['recommendations']:
        markdown_report += f"### {rec['type']}\n"
        markdown_report += f"- **仓库**: {rec['repo']}\n"
        markdown_report += f"- **原因**: {rec['reason']}\n\n"
    
    markdown_report += f"""

## 📈 学习总结

通过 GitHub 学习，我们可以：
1. 发现新的技能和工具
2. 学习最佳实践
3. 改进自我优化系统
4. 提升自动化程度

---
*本报告由 OpenClaw 自我优化系统自动生成*
"""
    
    report_md_file = DOCS_DIR / "github-learning-report.md"
    DOCS_DIR.mkdir(exist_ok=True)
    with open(report_md_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"学习报告已生成: {report_file}")
    print(f"Markdown 报告: {report_md_file}")
    
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("GitHub 学习功能")
    print("=" * 60)
    
    # 生成学习报告
    report = generate_learning_report()
    
    print("\n" + "=" * 60)
    print("学习完成！")
    print("=" * 60)
    
    # 输出关键信息
    print(f"\n搜索结果:")
    for skill_search in report['clawhub_skills']:
        print(f"  - {skill_search['query']}: {len(skill_search['repos'])} 个结果")
    
    print(f"\n最佳实践:")
    for practice in report['best_practices']:
        print(f"  - {practice['repo_name']}: {len(practice['best_practices'])} 个实践")

if __name__ == "__main__":
    main()