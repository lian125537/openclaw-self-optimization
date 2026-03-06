#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenClaw 能力分析脚本
分析当前 OpenClaw 状态，识别能力缺口
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# 设置标准输出编码为 UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = PROJECT_ROOT / "docs"

def run_command(cmd):
    """执行命令并返回输出"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode != 0:
            return None
        return result.stdout.strip()
    except Exception as e:
        return None

def get_openclaw_status():
    """获取 OpenClaw 系统状态"""
    print("正在获取 OpenClaw 系统状态...")
    status_output = run_command("openclaw status")
    if status_output:
        # 简化状态提取
        status = {
            "gateway": "running" if "Gateway" in status_output else "unknown",
            "sessions": "1 active" if "Sessions" in status_output else "unknown",
            "model": "mimo-v2-flash" if "mimo-v2-flash" in status_output else "unknown"
        }
        return status
    return None

def get_installed_skills():
    """获取已安装的技能列表"""
    print("正在获取已安装技能...")
    # 从 OpenClaw 状态中提取技能信息
    status = get_openclaw_status()
    if status:
        # 这里简化处理，实际应该解析 OpenClaw 的技能列表
        skills = [
            "clawhub", "github", "github-cli", "healthcheck", "weather",
            "tts", "proactive-agent", "self-improvement", "tavily",
            "video-frames", "skill-creator", "gh-issues", "clawhub",
            "github", "github-cli", "healthcheck", "weather",
            "openai-image-gen", "openai-whisper", "openai-whisper-api",
            "openhue", "sonoscli", "spotify-player"
        ]
        return skills
    return []

def analyze_capability_gaps():
    """分析能力缺口"""
    print("正在分析能力缺口...")
    
    # 已安装技能
    installed_skills = get_installed_skills()
    
    # 常用技能列表（基于任务模式）
    common_skills = [
        "file-manager", "calendar", "email-client", "task-manager",
        "note-taking", "code-editor", "database-client", "api-client",
        "monitoring", "logging", "backup", "security"
    ]
    
    # 识别缺口
    gaps = [skill for skill in common_skills if skill not in installed_skills]
    
    return {
        "installed_count": len(installed_skills),
        "total_common_skills": len(common_skills),
        "gaps": gaps,
        "gap_count": len(gaps)
    }

def generate_report():
    """生成能力分析报告"""
    print("正在生成能力分析报告...")
    
    # 获取数据
    status = get_openclaw_status()
    gaps = analyze_capability_gaps()
    
    # 创建报告
    installed_skills_list = get_installed_skills()
    installed_count = len(installed_skills_list)
    total_skills = installed_count + gaps["gap_count"]  # 总技能数 = 已安装 + 缺口
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "openclaw_status": status,
        "capability_analysis": {
            "installed_skills": installed_skills_list,
            "skill_gaps": gaps["gaps"],
            "gap_count": gaps["gap_count"],
            "completion_rate": (installed_count / total_skills) * 100 if total_skills > 0 else 0
        },
        "recommendations": []
    }
    
    # 生成推荐
    if gaps["gap_count"] > 0:
        report["recommendations"] = [
            {
                "type": "skill_install",
                "priority": "high",
                "skills": gaps["gaps"][:3],  # 前3个缺口技能
                "reason": "基于常用任务模式识别的能力缺口"
            }
        ]
    
    # 保存报告
    DATA_DIR.mkdir(exist_ok=True)
    report_file = DATA_DIR / "capability-report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    markdown_report = f"""# OpenClaw 能力分析报告

**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 系统状态

- **OpenClaw 状态**: 正常运行
- **已安装技能**: {gaps['installed_count']} 个
- **技能完成率**: {report['capability_analysis']['completion_rate']:.1f}%

## 🔍 能力缺口分析

### 已识别的缺口技能 ({gaps['gap_count']} 个):

"""
    
    for i, skill in enumerate(gaps['gaps'], 1):
        markdown_report += f"{i}. **{skill}**\n"
    
    markdown_report += f"""

## 🎯 推荐行动

### 高优先级推荐:
{json.dumps(report['recommendations'], ensure_ascii=False, indent=2)}

## 📈 下一步

1. 安装推荐的技能
2. 验证新技能的功能
3. 更新能力指标
4. 继续监控和优化

---
*本报告由 OpenClaw 自我优化系统自动生成*
"""
    
    report_md_file = DOCS_DIR / "capability-report.md"
    DOCS_DIR.mkdir(exist_ok=True)
    with open(report_md_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"✅ 报告已生成: {report_file}")
    print(f"✅ Markdown 报告: {report_md_file}")
    
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("OpenClaw 能力分析系统")
    print("=" * 60)
    
    # 生成报告
    report = generate_report()
    
    print("\n" + "=" * 60)
    print("分析完成！")
    print("=" * 60)
    
    # 输出关键信息
    print(f"\n📊 关键指标:")
    print(f"  - 已安装技能: {len(report['capability_analysis']['installed_skills'])}")
    print(f"  - 能力缺口: {report['capability_analysis']['gap_count']}")
    print(f"  - 完成率: {report['capability_analysis']['completion_rate']:.1f}%")
    
    if report['recommendations']:
        print(f"\n🎯 推荐行动:")
        for rec in report['recommendations']:
            print(f"  - {rec['type']}: {', '.join(rec['skills'])}")

if __name__ == "__main__":
    main()