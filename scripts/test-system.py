#!/usr/bin/env python3
"""
测试完整系统
验证所有功能是否正常工作
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

def test_github_connection():
    """测试 GitHub 连接"""
    print("测试 GitHub 连接...")
    
    try:
        # 测试 GitHub CLI 认证
        result = subprocess.run(
            '"C:\\Program Files\\GitHub CLI\\gh.exe" auth status',
            shell=True, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore'
        )
        
        if result.stdout and "Logged in to" in result.stdout:
            return {"status": "success", "message": "GitHub 认证正常"}
        else:
            return {"status": "warning", "message": "GitHub 认证状态未知"}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"GitHub 连接失败: {str(e)}"}

def test_openclaw_status():
    """测试 OpenClaw 状态"""
    print("测试 OpenClaw 状态...")
    
    try:
        result = subprocess.run(
            "openclaw status",
            shell=True, capture_output=True, text=True, check=True, encoding='utf-8', errors='ignore'
        )
        
        if result.stdout and "Gateway" in result.stdout and "local" in result.stdout:
            return {"status": "success", "message": "OpenClaw 运行正常"}
        else:
            return {"status": "warning", "message": "OpenClaw 状态未知"}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": f"OpenClaw 状态检查失败: {str(e)}"}

def test_workflow_files():
    """测试工作流文件"""
    print("测试工作流文件...")
    
    workflows_dir = PROJECT_ROOT / ".github" / "workflows"
    if not workflows_dir.exists():
        return {"status": "error", "message": "工作流目录不存在"}
    
    workflows = list(workflows_dir.glob("*.yml"))
    if not workflows:
        return {"status": "error", "message": "没有找到工作流文件"}
    
    expected_workflows = [
        "daily-analysis.yml",
        "skill-recommendation.yml",
        "auto-install.yml",
        "github-learning.yml",
        "optimize-workflow.yml",
        "setup-secrets.yml"
    ]
    
    found_workflows = [w.name for w in workflows]
    missing_workflows = [w for w in expected_workflows if w not in found_workflows]
    
    if missing_workflows:
        return {
            "status": "warning",
            "message": f"缺少工作流: {', '.join(missing_workflows)}",
            "found": found_workflows
        }
    else:
        return {"status": "success", "message": "所有工作流文件都存在", "found": found_workflows}

def test_script_files():
    """测试脚本文件"""
    print("测试脚本文件...")
    
    scripts_dir = PROJECT_ROOT / "scripts"
    if not scripts_dir.exists():
        return {"status": "error", "message": "脚本目录不存在"}
    
    scripts = list(scripts_dir.glob("*.py"))
    if not scripts:
        return {"status": "error", "message": "没有找到脚本文件"}
    
    expected_scripts = [
        "analyze-capabilities.py",
        "recommend-skills.py",
        "auto-install.py",
        "github-learning.py",
        "optimize-workflow.py",
        "test-system.py"
    ]
    
    found_scripts = [s.name for s in scripts]
    missing_scripts = [s for s in expected_scripts if s not in found_scripts]
    
    if missing_scripts:
        return {
            "status": "warning",
            "message": f"缺少脚本: {', '.join(missing_scripts)}",
            "found": found_scripts
        }
    else:
        return {"status": "success", "message": "所有脚本文件都存在", "found": found_scripts}

def test_data_directory():
    """测试数据目录"""
    print("测试数据目录...")
    
    if not DATA_DIR.exists():
        return {"status": "warning", "message": "数据目录不存在，将自动创建"}
    
    return {"status": "success", "message": "数据目录存在"}

def generate_test_report():
    """生成测试报告"""
    print("生成测试报告...")
    
    # 运行所有测试
    tests = {
        "github_connection": test_github_connection(),
        "openclaw_status": test_openclaw_status(),
        "workflow_files": test_workflow_files(),
        "script_files": test_script_files(),
        "data_directory": test_data_directory()
    }
    
    # 计算总体状态
    status_counts = {"success": 0, "warning": 0, "error": 0}
    for test in tests.values():
        status_counts[test["status"]] += 1
    
    overall_status = "success"
    if status_counts["error"] > 0:
        overall_status = "error"
    elif status_counts["warning"] > 0:
        overall_status = "warning"
    
    # 创建报告
    report = {
        "timestamp": datetime.now().isoformat(),
        "overall_status": overall_status,
        "status_summary": status_counts,
        "tests": tests,
        "recommendations": []
    }
    
    # 生成推荐
    if status_counts["error"] > 0:
        report["recommendations"].append({
            "type": "fix_errors",
            "priority": "high",
            "description": "修复测试中发现的错误"
        })
    
    if status_counts["warning"] > 0:
        report["recommendations"].append({
            "type": "address_warnings",
            "priority": "medium",
            "description": "处理测试中的警告"
        })
    
    # 保存报告
    DATA_DIR.mkdir(exist_ok=True)
    report_file = DATA_DIR / "system-test-report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    markdown_report = f"""# 系统测试报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 总体状态

- **状态**: {overall_status.upper()}
- **成功**: {status_counts['success']}
- **警告**: {status_counts['warning']}
- **错误**: {status_counts['error']}

## 🔧 测试结果

"""
    
    for test_name, test_result in tests.items():
        status_emoji = {"success": "✅", "warning": "⚠️", "error": "❌"}[test_result["status"]]
        markdown_report += f"### {status_emoji} {test_name.replace('_', ' ').title()}\n"
        markdown_report += f"- **状态**: {test_result['status']}\n"
        markdown_report += f"- **消息**: {test_result['message']}\n"
        if "found" in test_result:
            markdown_report += f"- **发现**: {', '.join(test_result['found'])}\n"
        markdown_report += "\n"
    
    markdown_report += f"""

## 💡 推荐行动

"""
    
    for rec in report['recommendations']:
        priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[rec["priority"]]
        markdown_report += f"### {priority_emoji} {rec['type']}\n"
        markdown_report += f"- **描述**: {rec['description']}\n"
        markdown_report += f"- **优先级**: {rec['priority']}\n\n"
    
    markdown_report += f"""

## 📈 系统状态总结

基于测试结果：
- **GitHub 连接**: {'正常' if tests['github_connection']['status'] == 'success' else '需要检查'}
- **OpenClaw 状态**: {'正常' if tests['openclaw_status']['status'] == 'success' else '需要检查'}
- **工作流文件**: {'完整' if tests['workflow_files']['status'] == 'success' else '需要补充'}
- **脚本文件**: {'完整' if tests['script_files']['status'] == 'success' else '需要补充'}

---
*本报告由 OpenClaw 自我优化系统自动生成*
"""
    
    report_md_file = DOCS_DIR / "system-test-report.md"
    DOCS_DIR.mkdir(exist_ok=True)
    with open(report_md_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"测试报告已生成: {report_file}")
    print(f"Markdown 报告: {report_md_file}")
    
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("系统测试")
    print("=" * 60)
    
    # 生成测试报告
    report = generate_test_report()
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print("=" * 60)
    
    # 输出关键信息
    print(f"\n测试结果:")
    print(f"  - 总体状态: {report['overall_status'].upper()}")
    print(f"  - 成功: {report['status_summary']['success']}")
    print(f"  - 警告: {report['status_summary']['warning']}")
    print(f"  - 错误: {report['status_summary']['error']}")
    
    if report['recommendations']:
        print(f"\n推荐行动:")
        for rec in report['recommendations'][:3]:
            print(f"  - {rec['type']}: {rec['description']}")

if __name__ == "__main__":
    main()