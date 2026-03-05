#!/usr/bin/env python3
"""
OpenClaw 辅助函数库
提供 OpenClaw 操作的常用功能
"""

import subprocess
import json
import re
from typing import Dict, List, Optional

def run_openclaw_command(command: str) -> Optional[str]:
    """执行 OpenClaw 命令并返回输出"""
    try:
        result = subprocess.run(
            f"openclaw {command}",
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"命令执行失败: {e}")
        return None

def get_system_status() -> Dict:
    """获取 OpenClaw 系统状态"""
    status_output = run_openclaw_command("status --all")
    if not status_output:
        return {}
    
    # 解析状态输出（简化版）
    status = {
        "gateway": "running" if "Gateway" in status_output and "local" in status_output else "unknown",
        "memory": "ready" if "FTS ready" in status_output else "not ready",
        "sessions": "active" if "active" in status_output else "inactive"
    }
    
    return status

def get_installed_skills() -> List[str]:
    """获取已安装的技能列表"""
    # 这里简化处理，实际应该解析 OpenClaw 的技能列表
    # 可以通过 openclaw skills list 或其他命令获取
    return [
        "clawhub", "github", "github-cli", "healthcheck", "mcporter",
        "notion", "peekaboo", "sag", "skill-creator", "slack",
        "video-frames", "weather", "automation-workflows",
        "terminal-command-execution", "feishu-doc", "feishu-drive",
        "feishu-perm", "feishu-wiki", "gemini", "himalaya",
        "openai-image-gen", "openai-whisper", "openai-whisper-api",
        "openhue", "sonoscli", "spotify-player"
    ]

def install_skill(skill_id: str) -> bool:
    """安装技能"""
    print(f"🔧 正在安装技能: {skill_id}")
    
    try:
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

def analyze_task_patterns() -> Dict:
    """分析任务模式"""
    # 这里可以实现任务模式分析逻辑
    # 基于历史任务记录分析常用任务类型
    return {
        "file_operations": 0.3,
        "communication": 0.25,
        "automation": 0.2,
        "development": 0.15,
        "other": 0.1
    }

def generate_capability_report() -> Dict:
    """生成能力报告"""
    status = get_system_status()
    skills = get_installed_skills()
    patterns = analyze_task_patterns()
    
    return {
        "timestamp": "2026-03-06T02:37:00Z",
        "system_status": status,
        "installed_skills": skills,
        "skill_count": len(skills),
        "task_patterns": patterns,
        "recommendations": []
    }

if __name__ == "__main__":
    # 测试功能
    print("OpenClaw 辅助函数库")
    print("=" * 40)
    
    # 获取系统状态
    status = get_system_status()
    print(f"系统状态: {status}")
    
    # 获取已安装技能
    skills = get_installed_skills()
    print(f"已安装技能: {len(skills)} 个")
    
    # 分析任务模式
    patterns = analyze_task_patterns()
    print(f"任务模式: {patterns}")