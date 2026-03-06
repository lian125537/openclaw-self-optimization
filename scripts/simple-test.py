#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import subprocess

# 设置标准输出编码为 UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("测试脚本开始...")

# 测试命令执行
try:
    result = subprocess.run('openclaw status', shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    print(f"命令执行成功，返回码: {result.returncode}")
    print(f"输出长度: {len(result.stdout)}")
    print(f"前100字符: {result.stdout[:100]}")
except Exception as e:
    print(f"命令执行失败: {e}")

print("测试脚本结束。")
