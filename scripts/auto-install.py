#!/usr/bin/env python3
"""
OpenClaw 自动安装脚本
基于技能推荐自动安装技能
"""

import json
import subprocess
import sys
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"

def load_recommendations():
    """加载技能推荐报告"""
    report_file = DATA_DIR / "skill-recommendations.json"
    if not report_file.exists():
        print("❌ 未找到技能推荐报告，请先运行 recommend-skills.py")
        return None
    
    with open(report_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def install_skill(skill_id):
    """安装单个技能"""
    print(f"🔧 正在安装技能: {skill_id}")
    
    try:
        # 使用 ClawHub CLI 安装技能
        result = subprocess.run(
            ["clawhub", "install", skill_id],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ 技能 {skill_id} 安装成功")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 技能 {skill_id} 安装失败: {e.stderr}")
        return False

def install_skills(recommendations, priority_filter=None):
    """安装推荐的技能"""
    skills_to_install = []
    
    for rec in recommendations:
        if priority_filter and rec["priority"] != priority_filter:
            continue
        skills_to_install.append(rec["clawhub_id"])
    
    if not skills_to_install:
        print("没有需要安装的技能")
        return []
    
    print(f"🔧 准备安装 {len(skills_to_install)} 个技能:")
    for skill in skills_to_install:
        print(f"  - {skill}")
    
    # 确认安装
    response = input("\n是否继续安装？(y/n): ")
    if response.lower() != 'y':
        print("安装已取消")
        return []
    
    # 安装技能
    installed = []
    failed = []
    
    for skill_id in skills_to_install:
        if install_skill(skill_id):
            installed.append(skill_id)
        else:
            failed.append(skill_id)
    
    return installed, failed

def generate_install_report(installed, failed):
    """生成安装报告"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "installed": installed,
        "failed": failed,
        "summary": {
            "total_attempted": len(installed) + len(failed),
            "successful": len(installed),
            "failed": len(failed),
            "success_rate": (len(installed) / (len(installed) + len(failed))) * 100 if (len(installed) + len(failed)) > 0 else 0
        }
    }
    
    # 保存报告
    DATA_DIR.mkdir(exist_ok=True)
    report_file = DATA_DIR / "install-report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    markdown_report = f"""# OpenClaw 技能安装报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 安装摘要

- **总尝试安装**: {report['summary']['total_attempted']}
- **成功安装**: {report['summary']['successful']}
- **安装失败**: {report['summary']['failed']}
- **成功率**: {report['summary']['success_rate']:.1f}%

## ✅ 成功安装的技能

"""
    
    for skill in installed:
        markdown_report += f"- {skill}\n"
    
    markdown_report += f"""

## ❌ 安装失败的技能

"""
    
    if failed:
        for skill in failed:
            markdown_report += f"- {skill}\n"
    else:
        markdown_report += "无\n"
    
    markdown_report += f"""

## 🚀 下一步

1. 验证新安装的技能
2. 测试技能功能
3. 更新能力指标
4. 继续优化流程

---
*本报告由 OpenClaw 自我优化系统自动生成*
"""
    
    report_md_file = PROJECT_ROOT / "docs" / "install-report.md"
    PROJECT_ROOT / "docs".mkdir(exist_ok=True)
    with open(report_md_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"✅ 安装报告已生成: {report_file}")
    print(f"✅ Markdown 报告: {report_md_file}")
    
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("OpenClaw 自动安装系统")
    print("=" * 60)
    
    # 加载推荐报告
    recommendations = load_recommendations()
    if not recommendations:
        return
    
    # 显示推荐摘要
    summary = recommendations['summary']
    print(f"\n📊 推荐摘要:")
    print(f"  - 总推荐技能: {summary['total_recommended']}")
    print(f"  - 高优先级: {summary['high_priority']}")
    print(f"  - 中优先级: {summary['medium_priority']}")
    print(f"  - 低优先级: {summary['low_priority']}")
    
    # 选择安装优先级
    print("\n🎯 选择安装优先级:")
    print("1. 高优先级 (推荐)")
    print("2. 高 + 中优先级")
    print("3. 全部技能")
    print("4. 自定义选择")
    
    choice = input("\n请选择 (1-4): ")
    
    priority_map = {
        "1": "high",
        "2": ["high", "medium"],
        "3": None,  # 全部
        "4": "custom"
    }
    
    if choice == "4":
        # 自定义选择
        print("\n请选择要安装的技能 (输入技能ID，用空格分隔):")
        for rec in recommendations['recommendations']:
            print(f"  - {rec['clawhub_id']} ({rec['priority']})")
        
        custom_skills = input("\n输入技能ID: ").split()
        skills_to_install = [s for s in custom_skills if s in [r['clawhub_id'] for r in recommendations['recommendations']]]
    else:
        priority_filter = priority_map.get(choice)
        if priority_filter is None:
            skills_to_install = [r['clawhub_id'] for r in recommendations['recommendations']]
        elif isinstance(priority_filter, list):
            skills_to_install = [r['clawhub_id'] for r in recommendations['recommendations'] if r['priority'] in priority_filter]
        else:
            skills_to_install = [r['clawhub_id'] for r in recommendations['recommendations'] if r['priority'] == priority_filter]
    
    # 安装技能
    installed = []
    failed = []
    
    for skill_id in skills_to_install:
        if install_skill(skill_id):
            installed.append(skill_id)
        else:
            failed.append(skill_id)
    
    # 生成报告
    report = generate_install_report(installed, failed)
    
    print("\n" + "=" * 60)
    print("安装完成！")
    print("=" * 60)
    
    # 输出安装结果
    print(f"\n📊 安装结果:")
    print(f"  - 成功: {report['summary']['successful']}")
    print(f"  - 失败: {report['summary']['failed']}")
    print(f"  - 成功率: {report['summary']['success_rate']:.1f}%")

if __name__ == "__main__":
    from datetime import datetime
    main()