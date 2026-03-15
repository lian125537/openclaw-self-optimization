#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单诊断脚本 - 测试基本功能
"""

import sys
import subprocess
import time

# 设置标准输出编码为 UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("简单诊断脚本")
print("=" * 60)

# 测试 1: 基本打印
print("\n测试 1: 基本打印功能")
print("✅ 基本打印正常")

# 测试 2: 简单命令执行
print("\n测试 2: 简单命令执行")
try:
    result = subprocess.run('echo hello', shell=True, capture_output=True, text=True, encoding='utf-8')
    print(f"✅ 简单命令执行正常: {result.stdout.strip()}")
except Exception as e:
    print(f"❌ 简单命令执行失败: {e}")

# 测试 3: OpenClaw 状态命令（带超时）
print("\n测试 3: OpenClaw 状态命令")
try:
    # 使用 Popen 以便控制超时
    process = subprocess.Popen(
        'openclaw status',
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='ignore'
    )
    
    # 等待 5 秒
    for i in range(5):
        time.sleep(1)
        print(f"等待 {i+1}/5 秒...")
        
    # 检查是否完成
    if process.poll() is not None:
        stdout, stderr = process.communicate()
        print(f"✅ OpenClaw 命令完成，返回码: {process.returncode}")
        print(f"输出长度: {len(stdout)}")
        if stdout:
            print(f"前100字符: {stdout[:100]}")
    else:
        print("❌ OpenClaw 命令超时")
        process.kill()
        stdout, stderr = process.communicate()
        
except Exception as e:
    print(f"❌ OpenClaw 命令异常: {e}")

# 测试 4: 文件操作
print("\n测试 4: 文件操作")
try:
    import json
    from datetime import datetime
    
    test_data = {
        "timestamp": datetime.now().isoformat(),
        "test": "success",
        "model": "deepseek/deepseek-chat"
    }
    
    with open('test-output.json', 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print("✅ 文件操作正常")
except Exception as e:
    print(f"❌ 文件操作失败: {e}")

print("\n" + "=" * 60)
print("诊断完成")
print("=" * 60)
