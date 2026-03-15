#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 GitHub Actions 工作流脚本
"""

import json
import os
import sys
from datetime import datetime

def test_analyze_capabilities():
    """测试能力分析脚本"""
    print("测试能力分析脚本...")
    try:
        # 导入并运行能力分析脚本
        import analyze_capabilities
        print("✅ 能力分析脚本导入成功")
        return True
    except Exception as e:
        print(f"❌ 能力分析脚本导入失败: {e}")
        return False

def test_skill_recommendation():
    """测试技能推荐脚本"""
    print("测试技能推荐脚本...")
    try:
        # 导入并运行技能推荐脚本
        import recommend_skills
        print("✅ 技能推荐脚本导入成功")
        return True
    except Exception as e:
        print(f"❌ 技能推荐脚本导入失败: {e}")
        return False

def test_auto_install():
    """测试自动安装脚本"""
    print("测试自动安装脚本...")
    try:
        # 导入并运行自动安装脚本
        import auto_install
        print("✅ 自动安装脚本导入成功")
        return True
    except Exception as e:
        print(f"❌ 自动安装脚本导入失败: {e}")
        return False

def main():
    """主函数"""
    # 设置标准输出编码
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='ignore')
    
    print("=" * 60)
    print("GitHub Actions 工作流测试")
    print("=" * 60)
    
    # 添加当前目录到 Python 路径
    sys.path.insert(0, os.path.dirname(__file__))
    
    # 测试各个脚本
    results = {
        "timestamp": datetime.now().isoformat(),
        "tests": {}
    }
    
    # 测试能力分析 - 直接运行脚本
    print("\n测试能力分析脚本...")
    try:
        import subprocess
        result = subprocess.run([sys.executable, "scripts/analyze-capabilities.py"], 
                              capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode == 0:
            print("[OK] 能力分析脚本运行成功")
            results["tests"]["analyze_capabilities"] = True
        else:
            print(f"[FAIL] 能力分析脚本运行失败: {result.stderr[:200]}")
            results["tests"]["analyze_capabilities"] = False
    except Exception as e:
        print(f"[FAIL] 能力分析脚本测试异常: {e}")
        results["tests"]["analyze_capabilities"] = False
    
    # 测试技能推荐 - 直接运行脚本
    print("\n测试技能推荐脚本...")
    try:
        import subprocess
        result = subprocess.run([sys.executable, "scripts/recommend-skills.py"], 
                              capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode == 0:
            print("[OK] 技能推荐脚本运行成功")
            results["tests"]["skill_recommendation"] = True
        else:
            print(f"[FAIL] 技能推荐脚本运行失败: {result.stderr[:200]}")
            results["tests"]["skill_recommendation"] = False
    except Exception as e:
        print(f"[FAIL] 技能推荐脚本测试异常: {e}")
        results["tests"]["skill_recommendation"] = False
    
    # 测试自动安装 - 直接运行脚本
    print("\n测试自动安装脚本...")
    try:
        import subprocess
        result = subprocess.run([sys.executable, "scripts/auto-install.py"], 
                              capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode == 0:
            print("[OK] 自动安装脚本运行成功")
            results["tests"]["auto_install"] = True
        else:
            print(f"[FAIL] 自动安装脚本运行失败: {result.stderr[:200]}")
            results["tests"]["auto_install"] = False
    except Exception as e:
        print(f"[FAIL] 自动安装脚本测试异常: {e}")
        results["tests"]["auto_install"] = False
    
    # 输出结果
    print("\n" + "=" * 60)
    print("测试结果:")
    print("=" * 60)
    
    total_tests = len(results["tests"])
    passed_tests = sum(1 for test in results["tests"].values() if test)
    
    for test_name, passed in results["tests"].items():
        status = "[OK] 通过" if passed else "[FAIL] 失败"
        print(f"{test_name}: {status}")
    
    print(f"\n总计: {passed_tests}/{total_tests} 通过")
    
    # 保存测试结果
    os.makedirs("data", exist_ok=True)
    with open("data/workflow-test-report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n测试报告已保存到: data/workflow-test-report.json")
    
    if passed_tests == total_tests:
        print("\n🎉 所有测试通过！GitHub Actions 工作流已准备就绪。")
        return 0
    else:
        print("\n⚠️  部分测试失败，请检查相关脚本。")
        return 1

if __name__ == "__main__":
    sys.exit(main())