#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化技能推荐测试
"""

import json
import os
from datetime import datetime

def main():
    """主函数"""
    print("=" * 60)
    print("简化技能推荐测试")
    print("=" * 60)
    
    # 创建测试数据
    test_data = {
        "timestamp": datetime.now().isoformat(),
        "recommendations": [
            {
                "skill": "file-manager",
                "priority": "high",
                "reason": "文件管理基础技能"
            },
            {
                "skill": "calendar",
                "priority": "medium",
                "reason": "日程管理"
            },
            {
                "skill": "email-client",
                "priority": "low",
                "reason": "邮件客户端"
            }
        ]
    }
    
    # 保存数据
    os.makedirs("data", exist_ok=True)
    with open("data/skill-recommendations.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    # 生成 Markdown 报告
    md_content = f"""# 技能推荐测试报告

生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 推荐技能列表

"""
    
    for i, rec in enumerate(test_data["recommendations"], 1):
        md_content += f"{i}. **{rec['skill']}** (优先级: {rec['priority']})\n"
        md_content += f"   理由: {rec['reason']}\n\n"
    
    md_content += "---\n*本报告由简化测试脚本生成*"
    
    os.makedirs("docs", exist_ok=True)
    with open("docs/skill-recommendations.md", "w", encoding="utf-8") as f:
        f.write(md_content)
    
    print("测试数据生成完成!")
    print(f"- JSON 文件: data/skill-recommendations.json")
    print(f"- Markdown 文件: docs/skill-recommendations.md")
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    main()