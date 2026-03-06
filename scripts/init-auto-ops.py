# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
OpenClaw 第三级优化 - 自动初始化脚本
初始化自动化运维系统、自我学习引擎和跨工作流编排器
"""

import os
import sys
import json
import logging
import subprocess
from pathlib import Path
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("init-auto-ops")

class AutoOpsInitializer:
    """自动化运维系统初始化器"""
    
    def __init__(self, base_path=None):
        self.base_path = Path(base_path) if base_path else Path.cwd()
        self.config = {}
        self.results = {
            "start_time": datetime.now().isoformat(),
            "steps": [],
            "status": "pending"
        }
    
    def run(self):
        """执行完整初始化流程"""
        logger.info("="*60)
        logger.info("OpenClaw 第三级优化 - 自动初始化脚本")
        logger.info("="*60)
        
        steps = [
            ("检查环境", self.check_environment),
            ("加载配置", self.load_config),
            ("初始化数据库", self.init_database),
            ("创建目录结构", self.create_directories),
            ("验证系统", self.validate_system),
            ("生成报告", self.generate_report)
        ]
        
        success = True
        for step_name, step_func in steps:
            logger.info(f"\n▶ 执行步骤: {step_name}")
            try:
                result = step_func()
                self.results["steps"].append({
                    "name": step_name,
                    "status": "success",
                    "message": result
                })
                logger.info(f"  ✓ {step_name} 完成")
            except Exception as e:
                logger.error(f"  ✗ {step_name} 失败: {e}")
                self.results["steps"].append({
                    "name": step_name,
                    "status": "failed",
                    "message": str(e)
                })
                success = False
                break
        
        self.results["status"] = "success" if success else "failed"
        self.results["end_time"] = datetime.now().isoformat()
        
        self.print_summary()
        return success
    
    def check_environment(self):
        """检查运行环境"""
        checks = {
            "python_version": sys.version,
            "current_dir": str(self.base_path),
            "git_available": self._check_command("git --version"),
            "python_available": self._check_command("python --version"),
            "openclaw_available": self._check_command("openclaw --version")
        }
        
        # 检查必要目录
        required_dirs = [".github/workflows", "scripts", "config", "data"]
        for dir_name in required_dirs:
            dir_path = self.base_path / dir_name
            checks[f"dir_{dir_name}"] = dir_path.exists()
        
        self.config["environment"] = checks
        return f"环境检查完成，Python {sys.version.split()[0]}"
    
    def load_config(self):
        """加载配置文件"""
        config_paths = [
            self.base_path / "config" / "auto-ops-config.yaml",
            self.base_path / "config" / "business-metrics-mapping.yaml"
        ]
        
        loaded = []
        for path in config_paths:
            if path.exists():
                loaded.append(str(path.name))
                logger.info(f"  找到配置文件: {path.name}")
            else:
                logger.warning(f"  配置文件不存在: {path.name}")
        
        self.config["loaded_configs"] = loaded
        return f"加载了 {len(loaded)} 个配置文件"
    
    def init_database(self):
        """初始化数据库"""
        db_path = self.base_path / "data" / "auto-ops.db"
        
        # 确保目录存在
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 创建工作流记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS workflow_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workflow_name TEXT NOT NULL,
                run_id TEXT,
                status TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                duration_ms INTEGER,
                error TEXT
            )
        """)
        
        # 创建学习记录表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP,
                category TEXT,
                content TEXT,
                applied_count INTEGER DEFAULT 0
            )
        """)
        
        # 创建指标表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP,
                name TEXT,
                value REAL,
                tags TEXT
            )
        """)
        
        conn.commit()
        conn.close()
        
        return {
            "exists": db_path.exists(),
            "tables": ["workflow_runs", "learnings", "metrics"],
            "table_count": 3,
            "path": str(db_path)
        }
    
    def create_directories(self):
        """创建必要的目录结构"""
        dirs_to_create = [
            "data",
            "logs",
            "reports",
            "backups"
        ]
        
        created = []
        for dir_name in dirs_to_create:
            dir_path = self.base_path / dir_name
            if not dir_path.exists():
                dir_path.mkdir(parents=True, exist_ok=True)
                created.append(dir_name)
                logger.info(f"  创建目录: {dir_name}")
        
        return f"创建了 {len(created)} 个新目录"
    
    def validate_system(self):
        """验证系统配置"""
        validations = {
            "has_workflows": self._validate_workflows(),
            "has_scripts": self._validate_scripts(),
            "git_clean": self._check_git_status()
        }
        
        self.config["validations"] = validations
        return f"验证完成，工作流: {validations['has_workflows']}个，脚本: {validations['has_scripts']}个"
    
    def generate_report(self):
        """生成初始化报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "environment": self.config.get("environment", {}),
            "configs": self.config.get("loaded_configs", []),
            "database": self.results["steps"][2]["message"] if len(self.results["steps"]) > 2 else {},
            "validations": self.config.get("validations", {}),
            "summary": {
                "success": self.results["status"] == "success",
                "steps_completed": len(self.results["steps"])
            }
        }
        
        report_path = self.base_path / "data" / "init-report.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"  报告已生成: {report_path}")
        return f"报告生成完成，共 {len(json.dumps(report))} 字符"
    
    def _validate_workflows(self):
        """验证工作流文件"""
        workflow_dir = self.base_path / ".github" / "workflows"
        if not workflow_dir.exists():
            return 0
        return len(list(workflow_dir.glob("*.yml"))) + len(list(workflow_dir.glob("*.yaml")))
    
    def _validate_scripts(self):
        """验证脚本文件"""
        script_dir = self.base_path / "scripts"
        if not script_dir.exists():
            return 0
        return len(list(script_dir.glob("*.py")))
    
    def _check_git_status(self):
        """检查 Git 状态"""
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True,
                text=True,
                cwd=self.base_path
            )
            return result.stdout.strip() == ""
        except:
            return False
    
    def _check_command(self, cmd):
        """检查命令是否可用"""
        try:
            subprocess.run(
                cmd.split(),
                capture_output=True,
                shell=True,
                timeout=5
            )
            return True
        except:
            return False
    
    def print_summary(self):
        """打印初始化总结"""
        logger.info("\n" + "="*60)
        logger.info("📊 初始化完成总结")
        logger.info("="*60)
        
        success_count = sum(1 for s in self.results["steps"] if s["status"] == "success")
        total_count = len(self.results["steps"])
        
        logger.info(f"执行状态: {'✅ 成功' if self.results['status'] == 'success' else '❌ 失败'}")
        logger.info(f"完成步骤: {success_count}/{total_count}")
        
        if self.config.get("validations"):
            v = self.config["validations"]
            logger.info(f"\n系统资源:")
            logger.info(f"  - 工作流文件: {v.get('has_workflows', 0)} 个")
            logger.info(f"  - Python脚本: {v.get('has_scripts', 0)} 个")

def main():
    """主函数"""
    initializer = AutoOpsInitializer()
    success = initializer.run()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())