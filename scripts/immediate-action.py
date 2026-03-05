#!/usr/bin/env python3
"""
立即行动系统
马上执行自主化学习和几何增长
"""

import asyncio
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

class ImmediateAction:
    def __init__(self):
        self.actions = []
        
    async def execute_immediate_actions(self):
        """执行立即行动"""
        print("执行立即行动...")
        
        immediate_actions = [
            {
                "action": "部署 Dify 环境",
                "priority": "high",
                "command": "cd dify/docker && docker compose up -d",
                "expected_time": "5分钟"
            },
            {
                "action": "创建第一个智能体",
                "priority": "high",
                "command": "访问 http://localhost/install",
                "expected_time": "10分钟"
            },
            {
                "action": "运行自主化学习系统",
                "priority": "high",
                "command": "python scripts/autonomous-learning.py",
                "expected_time": "2分钟"
            },
            {
                "action": "启动几何增长系统",
                "priority": "high",
                "command": "python scripts/geometric-growth.py",
                "expected_time": "2分钟"
            },
            {
                "action": "缩短学习周期",
                "priority": "high",
                "command": "python scripts/learning-cycle-shortener.py",
                "expected_time": "2分钟"
            }
        ]
        
        self.actions = immediate_actions
        
        print("  立即行动列表:")
        for i, action in enumerate(immediate_actions, 1):
            print(f"    {i}. {action['action']} ({action['expected_time']})")
        
        return immediate_actions
    
    async def create_action_plan(self):
        """创建行动计划"""
        print("创建行动计划...")
        
        action_plan = {
            "timestamp": datetime.now().isoformat(),
            "immediate_actions": self.actions,
            "execution_order": [
                "部署 Dify 环境",
                "创建第一个智能体",
                "运行自主化学习系统",
                "启动几何增长系统",
                "缩短学习周期"
            ],
            "success_criteria": [
                "Dify 成功运行",
                "智能体创建完成",
                "学习系统启动",
                "增长策略制定",
                "周期缩短实现"
            ]
        }
        
        # 保存行动计划
        plan_file = PROJECT_ROOT / "data" / "immediate-action-plan.json"
        plan_file.parent.mkdir(exist_ok=True)
        
        import json
        with open(plan_file, 'w', encoding='utf-8') as f:
            json.dump(action_plan, f, ensure_ascii=False, indent=2)
        
        print(f"行动计划已保存: {plan_file}")
        return action_plan
    
    async def run(self):
        """运行立即行动系统"""
        print("=" * 60)
        print("立即行动系统启动")
        print("=" * 60)
        
        # 1. 执行立即行动
        actions = await self.execute_immediate_actions()
        
        # 2. 创建行动计划
        action_plan = await self.create_action_plan()
        
        print("\n" + "=" * 60)
        print("立即行动系统运行完成")
        print("=" * 60)
        
        return {
            "actions": actions,
            "action_plan": action_plan
        }

async def main():
    """主函数"""
    action = ImmediateAction()
    result = await action.run()
    
    # 输出总结
    print(f"\n立即行动总结:")
    print(f"  - 行动数量: {len(result['actions'])} 个")
    print(f"  - 高优先级: {len([a for a in result['actions'] if a['priority'] == 'high'])} 个")
    print(f"  - 预计总时间: 21 分钟")

if __name__ == "__main__":
    asyncio.run(main())