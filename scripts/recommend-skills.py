#!/usr/bin/env python3
"""
OpenClaw 技能推荐脚本
基于能力分析结果推荐需要安装的技能
"""

import json
import sys
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"

def load_capability_report():
    """加载能力分析报告"""
    report_file = DATA_DIR / "capability-report.json"
    if not report_file.exists():
        print("❌ 未找到能力分析报告，请先运行 analyze-capabilities.py")
        return None
    
    with open(report_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def recommend_skills_based_on_gaps(gaps):
    """基于缺口推荐技能"""
    recommendations = []
    
    # 技能推荐映射表
    skill_recommendations = {
        "file-manager": {
            "description": "文件管理技能",
            "priority": "high",
            "reason": "基础文件操作需求",
            "clawhub_id": "file-manager"
        },
        "calendar": {
            "description": "日历管理技能",
            "priority": "medium",
            "reason": "时间管理需求",
            "clawhub_id": "calendar"
        },
        "email-client": {
            "description": "邮件客户端技能",
            "priority": "medium",
            "reason": "邮件处理需求",
            "clawhub_id": "email-client"
        },
        "task-manager": {
            "description": "任务管理技能",
            "priority": "high",
            "reason": "任务追踪需求",
            "clawhub_id": "task-manager"
        },
        "note-taking": {
            "description": "笔记技能",
            "priority": "medium",
            "reason": "知识管理需求",
            "clawhub_id": "note-taking"
        },
        "code-editor": {
            "description": "代码编辑技能",
            "priority": "low",
            "reason": "开发需求",
            "clawhub_id": "code-editor"
        },
        "database-client": {
            "description": "数据库客户端技能",
            "priority": "low",
            "reason": "数据管理需求",
            "clawhub_id": "database-client"
        },
        "api-client": {
            "description": "API 客户端技能",
            "priority": "medium",
            "reason": "接口调用需求",
            "clawhub_id": "api-client"
        },
        "monitoring": {
            "description": "监控技能",
            "priority": "low",
            "reason": "系统监控需求",
            "clawhub_id": "monitoring"
        },
        "logging": {
            "description": "日志技能",
            "priority": "low",
            "reason": "日志管理需求",
            "clawhub_id": "logging"
        },
        "backup": {
            "description": "备份技能",
            "priority": "medium",
            "reason": "数据安全需求",
            "clawhub_id": "backup"
        },
        "security": {
            "description": "安全技能",
            "priority": "high",
            "reason": "安全防护需求",
            "clawhub_id": "security"
        }
    }
    
    for gap in gaps:
        if gap in skill_recommendations:
            recommendations.append({
                "skill": gap,
                **skill_recommendations[gap]
            })
    
    # 按优先级排序
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order[x["priority"]])
    
    return recommendations

def generate_recommendation_report(recommendations):
    """生成推荐报告"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "recommendations": recommendations,
        "summary": {
            "total_recommended": len(recommendations),
            "high_priority": len([r for r in recommendations if r["priority"] == "high"]),
            "medium_priority": len([r for r in recommendations if r["priority"] == "medium"]),
            "low_priority": len([r for r in recommendations if r["priority"] == "low"])
        }
    }
    
    # 保存报告
    DATA_DIR.mkdir(exist_ok=True)
    report_file = DATA_DIR / "skill-recommendations.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    markdown_report = f"""# OpenClaw 技能推荐报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 推荐摘要

- **总推荐技能数**: {report['summary']['total_recommended']}
- **高优先级**: {report['summary']['high_priority']}
- **中优先级**: {report['summary']['medium_priority']}
- **低优先级**: {report['summary']['low_priority']}

## 🎯 推荐技能列表

"""
    
    for rec in recommendations:
        priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[rec["priority"]]
        markdown_report += f"### {priority_emoji} {rec['skill']} ({rec['priority']})\n"
        markdown_report += f"- **描述**: {rec['description']}\n"
        markdown_report += f"- **原因**: {rec['reason']}\n"
        markdown_report += f"- **ClawHub ID**: {rec['clawhub_id']}\n\n"
    
    markdown_report += f"""## 🚀 安装命令

```bash
# 安装所有推荐技能
clawhub install {' '.join([r['clawhub_id'] for r in recommendations])}

# 或逐个安装
"""
    
    for rec in recommendations:
        markdown_report += f"clawhub install {rec['clawhub_id']}\n"
    
    markdown_report += """```

## 📈 预期效果

安装这些技能后，OpenClaw 的能力将得到显著提升：
- 文件管理能力
- 任务管理能力
- 安全防护能力
- 更多自动化场景支持

---
*本报告由 OpenClaw 自我优化系统自动生成*
"""
    
    report_md_file = PROJECT_ROOT / "docs" / "skill-recommendations.md"
    PROJECT_ROOT / "docs".mkdir(exist_ok=True)
    with open(report_md_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"✅ 推荐报告已生成: {report_file}")
    print(f"✅ Markdown 报告: {report_md_file}")
    
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("OpenClaw 技能推荐系统")
    print("=" * 60)
    
    # 加载能力分析报告
    report = load_capability_report()
    if not report:
        return
    
    # 获取能力缺口
    gaps = report['capability_analysis']['skill_gaps']
    print(f"\n🔍 发现 {len(gaps)} 个能力缺口:")
    for gap in gaps:
        print(f"  - {gap}")
    
    # 生成推荐
    recommendations = recommend_skills_based_on_gaps(gaps)
    
    # 生成报告
    recommendation_report = generate_recommendation_report(recommendations)
    
    print("\n" + "=" * 60)
    print("推荐完成！")
    print("=" * 60)
    
    # 输出推荐摘要
    print(f"\n🎯 推荐摘要:")
    print(f"  - 总推荐技能: {recommendation_report['summary']['total_recommended']}")
    print(f"  - 高优先级: {recommendation_report['summary']['high_priority']}")
    print(f"  - 中优先级: {recommendation_report['summary']['medium_priority']}")
    print(f"  - 低优先级: {recommendation_report['summary']['low_priority']}")

if __name__ == "__main__":
    from datetime import datetime
    main()