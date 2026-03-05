#!/usr/bin/env python3
"""
初始化 GitHub 仓库脚本
自动创建仓库并推送代码
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, check=True):
    """执行命令"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=check)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"命令执行失败: {e}")
        if check:
            sys.exit(1)
        return None

def check_github_auth():
    """检查 GitHub 认证状态"""
    print("🔍 检查 GitHub 认证状态...")
    result = run_command('"C:\\Program Files\\GitHub CLI\\gh.exe" auth status', check=False)
    if result and "Logged in to" in result:
        print("✅ GitHub 已认证")
        return True
    else:
        print("❌ GitHub 未认证，请先运行: gh auth login")
        return False

def create_github_repo():
    """创建 GitHub 仓库"""
    print("🔧 正在创建 GitHub 仓库...")
    
    # 获取 GitHub 用户名
    username = run_command('"C:\\Program Files\\GitHub CLI\\gh.exe" user view --json login --jq .login')
    if not username:
        print("❌ 无法获取 GitHub 用户名")
        return None
    
    repo_name = "openclaw-self-optimization"
    full_repo = f"{username}/{repo_name}"
    
    # 检查仓库是否已存在
    check_cmd = f'"C:\\Program Files\\GitHub CLI\\gh.exe" repo view {full_repo}'
    result = run_command(check_cmd, check=False)
    
    if result:
        print(f"✅ 仓库 {full_repo} 已存在")
        return full_repo
    
    # 创建仓库
    create_cmd = f'"C:\\Program Files\\GitHub CLI\\gh.exe" repo create {repo_name} --public --clone'
    result = run_command(create_cmd)
    
    if result:
        print(f"✅ 仓库创建成功: {full_repo}")
        return full_repo
    else:
        print("❌ 仓库创建失败")
        return None

def initialize_git():
    """初始化 Git 仓库"""
    print("🔧 正在初始化 Git 仓库...")
    
    # 检查是否已有 .git 目录
    git_dir = Path(".git")
    if git_dir.exists():
        print("✅ Git 仓库已初始化")
        return True
    
    # 初始化 Git
    run_command("git init")
    run_command('git config --global user.name "OpenClaw Self-Optimization"')
    run_command('git config --global user.email "openclaw@example.com"')
    
    print("✅ Git 仓库初始化完成")
    return True

def add_and_commit():
    """添加文件并提交"""
    print("🔧 正在添加文件并提交...")
    
    # 添加所有文件
    run_command("git add .")
    
    # 提交
    commit_msg = "Initial commit: OpenClaw 自我优化系统"
    run_command(f'git commit -m "{commit_msg}"')
    
    print("✅ 文件提交完成")
    return True

def push_to_github(repo_full_name):
    """推送到 GitHub"""
    print("🔧 正在推送到 GitHub...")
    
    # 添加远程仓库
    remote_url = f"https://github.com/{repo_full_name}.git"
    run_command(f'git remote add origin {remote_url}')
    
    # 推送代码
    run_command("git push -u origin main")
    
    print("✅ 代码推送完成")
    return True

def main():
    """主函数"""
    print("=" * 60)
    print("OpenClaw 自我优化系统 - 仓库初始化")
    print("=" * 60)
    
    # 检查 GitHub 认证
    if not check_github_auth():
        print("\n请先完成 GitHub 认证:")
        print("1. 运行: gh auth login")
        print("2. 按照提示完成浏览器认证")
        print("3. 重新运行此脚本")
        return
    
    # 创建 GitHub 仓库
    repo_full_name = create_github_repo()
    if not repo_full_name:
        print("\n仓库创建失败，请手动创建:")
        print(f"1. 访问: https://github.com/new")
        print(f"2. 创建仓库: openclaw-self-optimization")
        print(f"3. 重新运行此脚本")
        return
    
    # 初始化 Git
    initialize_git()
    
    # 添加并提交文件
    add_and_commit()
    
    # 推送到 GitHub
    push_to_github(repo_full_name)
    
    print("\n" + "=" * 60)
    print("初始化完成！")
    print("=" * 60)
    print(f"\n仓库地址: https://github.com/{repo_full_name}")
    print("\n下一步:")
    print("1. 配置 GitHub Secrets")
    print("2. 启动自动化工作流")
    print("3. 查看 SETUP.md 获取详细设置指南")

if __name__ == "__main__":
    main()