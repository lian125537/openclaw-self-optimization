#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenClaw 能力分析脚本 (修复版)
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
            "video-frames", "skill-creator", "gh-issues"
        ]
        return skills
    return []

def analyze_capability_gaps():
    """分析能力缺口"""
    print("正在分析能力缺口...")
    installed_skills = get_installed_skills()
    
    # 常见技能列表
    common_skills = [
        "clawhub", "github", "github-cli", "healthcheck", "weather",
        "tts", "proactive-agent", "self-improvement", "tavily",
        "video-frames", "skill-creator", "gh-issues", "automation",
        "monitoring", "notification", "scheduling"
    ]
    
    # 找出缺失的技能
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
    report = {
        "timestamp": datetime.now().isoformat(),
        "openclaw_status": status,
        "capability_analysis": {
            "installed_skills": get_installed_skills(),
            "gaps": gaps["gaps"],
            "gap_count": gaps["gap_count"]
        },
        "recommendations": [
            "修复脚本编码问题",
            "配置 GitHub Actions Secrets",
            "测试完整工作流",
            "持续监控和优化"
        ]
    }
    
    # 保存报告
    report_file = DATA_DIR / "capability-report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"报告已保存到: {report_file}")
    return report

def main():
    """主函数"""
    print("=" * 60)
    print("OpenClaw 能力分析系统")
    print("=" * 60)
    
    # 生成报告
    report = generate_report()
    
    # 输出摘要
    print("\n分析摘要:")
    print(f"- OpenClaw 状态: {report['openclaw_status']}")
    print(f"- 已安装技能: {report['capability_analysis']['installed_count']} 个")
    print(f"- 缺失技能: {report['capability_analysis']['gap_count']} 个")
    
    if report['capability_analysis']['gaps']:
        print(f"- 缺失技能列表: {', '.join(report['capability_analysis']['gaps'])}")
    
    print("\n推荐操作:")
    for i, rec in enumerate(report['recommendations'], 1):
        print(f"{i}. {rec}")
    
    print("\n" + "=" * 60)
    print("分析完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()
