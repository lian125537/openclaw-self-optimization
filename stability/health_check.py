#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
健康检查系统 - 实时监控系统状态
提供全面的健康检查和状态报告
"""

import os
import sys
import json
import yaml
import sqlite3
import logging
import requests
import psutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import threading
import time

logger = logging.getLogger(__name__)

class HealthStatus(Enum):
    """健康状态"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

class CheckSeverity(Enum):
    """检查严重性"""
    CRITICAL = "critical"    # 系统无法运行
    HIGH = "high"           # 核心功能受影响
    MEDIUM = "medium"       # 次要功能受影响
    LOW = "low"             # 非关键问题

@dataclass
class HealthCheckResult:
    """健康检查结果"""
    check_name: str
    status: HealthStatus
    severity: CheckSeverity
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    response_time: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        data['severity'] = self.severity.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

class HealthChecker:
    """健康检查器基类"""
    
    def __init__(self, name: str, severity: CheckSeverity = CheckSeverity.MEDIUM):
        self.name = name
        self.severity = severity
    
    def check(self) -> HealthCheckResult:
        """执行检查"""
        start_time = time.time()
        try:
            status, message, details = self._perform_check()
            response_time = time.time() - start_time
            
            return HealthCheckResult(
                check_name=self.name,
                status=status,
                severity=self.severity,
                message=message,
                details=details,
                response_time=response_time
            )
        except Exception as e:
            logger.error(f"健康检查 '{self.name}' 失败: {e}")
            return HealthCheckResult(
                check_name=self.name,
                status=HealthStatus.UNHEALTHY,
                severity=self.severity,
                message=f"检查执行失败: {str(e)}",
                details={"error": str(e), "traceback": str(sys.exc_info())},
                response_time=time.time() - start_time
            )
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        """实际执行检查（子类实现）"""
        raise NotImplementedError

class DirectoryHealthChecker(HealthChecker):
    """目录健康检查"""
    
    def __init__(self, directory_path: str, required_files: List[str] = None):
        super().__init__(f"directory_{Path(directory_path).name}", CheckSeverity.HIGH)
        self.directory_path = directory_path
        self.required_files = required_files or []
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        path = Path(self.directory_path)
        
        if not path.exists():
            return (
                HealthStatus.UNHEALTHY,
                f"目录不存在: {self.directory_path}",
                {"path": str(path), "exists": False}
            )
        
        if not path.is_dir():
            return (
                HealthStatus.UNHEALTHY,
                f"路径不是目录: {self.directory_path}",
                {"path": str(path), "is_dir": False}
            )
        
        # 检查必需文件
        missing_files = []
        for file in self.required_files:
            file_path = path / file
            if not file_path.exists():
                missing_files.append(str(file))
        
        if missing_files:
            return (
                HealthStatus.DEGRADED,
                f"目录存在，但缺少必需文件",
                {
                    "path": str(path),
                    "exists": True,
                    "is_dir": True,
                    "missing_files": missing_files,
                    "total_required": len(self.required_files),
                    "missing_count": len(missing_files)
                }
            )
        
        # 统计目录内容
        files = list(path.rglob("*"))
        file_count = len([f for f in files if f.is_file()])
        dir_count = len([f for f in files if f.is_dir()])
        
        return (
            HealthStatus.HEALTHY,
            f"目录状态正常",
            {
                "path": str(path),
                "exists": True,
                "is_dir": True,
                "file_count": file_count,
                "dir_count": dir_count,
                "total_items": len(files),
                "missing_files": []
            }
        )

class FileHealthChecker(HealthChecker):
    """文件健康检查"""
    
    def __init__(self, file_path: str, min_size: int = 0, check_content: bool = False):
        super().__init__(f"file_{Path(file_path).name}", CheckSeverity.HIGH)
        self.file_path = file_path
        self.min_size = min_size
        self.check_content = check_content
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        path = Path(self.file_path)
        
        if not path.exists():
            return (
                HealthStatus.UNHEALTHY,
                f"文件不存在: {self.file_path}",
                {"path": str(path), "exists": False}
            )
        
        if not path.is_file():
            return (
                HealthStatus.UNHEALTHY,
                f"路径不是文件: {self.file_path}",
                {"path": str(path), "is_file": False}
            )
        
        # 检查文件大小
        file_size = path.stat().st_size
        if file_size < self.min_size:
            return (
                HealthStatus.DEGRADED,
                f"文件大小不足: {file_size} < {self.min_size}",
                {
                    "path": str(path),
                    "exists": True,
                    "is_file": True,
                    "file_size": file_size,
                    "min_size": self.min_size
                }
            )
        
        # 检查文件内容（如果启用）
        content_valid = True
        if self.check_content:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read(1024)  # 只读取前1KB
                    # 简单的内容验证（可根据需要扩展）
                    if len(content.strip()) == 0:
                        content_valid = False
            except Exception:
                content_valid = False
        
        if not content_valid:
            return (
                HealthStatus.DEGRADED,
                f"文件内容无效或无法读取",
                {
                    "path": str(path),
                    "exists": True,
                    "is_file": True,
                    "file_size": file_size,
                    "content_valid": False
                }
            )
        
        return (
            HealthStatus.HEALTHY,
            f"文件状态正常",
            {
                "path": str(path),
                "exists": True,
                "is_file": True,
                "file_size": file_size,
                "content_valid": content_valid,
                "last_modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat()
            }
        )

class DatabaseHealthChecker(HealthChecker):
    """数据库健康检查"""
    
    def __init__(self, db_path: str, test_query: str = "SELECT 1"):
        super().__init__(f"database_{Path(db_path).name}", CheckSeverity.CRITICAL)
        self.db_path = db_path
        self.test_query = test_query
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        path = Path(self.db_path)
        
        if not path.exists():
            return (
                HealthStatus.UNHEALTHY,
                f"数据库文件不存在: {self.db_path}",
                {"path": str(path), "exists": False}
            )
        
        # 检查文件大小
        file_size = path.stat().st_size
        if file_size == 0:
            return (
                HealthStatus.UNHEALTHY,
                f"数据库文件为空",
                {"path": str(path), "exists": True, "file_size": 0}
            )
        
        # 测试数据库连接和查询
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 执行测试查询
            cursor.execute(self.test_query)
            result = cursor.fetchone()
            
            # 获取数据库信息
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            cursor.execute("PRAGMA page_count")
            page_count = cursor.fetchone()[0]
            
            cursor.execute("PRAGMA page_size")
            page_size = cursor.fetchone()[0]
            
            total_size = page_count * page_size
            
            conn.close()
            
            return (
                HealthStatus.HEALTHY,
                f"数据库状态正常",
                {
                    "path": str(path),
                    "exists": True,
                    "file_size": file_size,
                    "tables": tables,
                    "table_count": len(tables),
                    "total_size_bytes": total_size,
                    "test_query_result": result[0] if result else None
                }
            )
            
        except sqlite3.Error as e:
            return (
                HealthStatus.UNHEALTHY,
                f"数据库连接失败: {str(e)}",
                {
                    "path": str(path),
                    "exists": True,
                    "file_size": file_size,
                    "error": str(e)
                }
            )

class ScriptHealthChecker(HealthChecker):
    """脚本健康检查"""
    
    def __init__(self, script_path: str):
        super().__init__(f"script_{Path(script_path).name}", CheckSeverity.HIGH)
        self.script_path = script_path
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        path = Path(self.script_path)
        
        if not path.exists():
            return (
                HealthStatus.UNHEALTHY,
                f"脚本文件不存在: {self.script_path}",
                {"path": str(path), "exists": False}
            )
        
        # 检查文件扩展名
        if path.suffix != '.py':
            return (
                HealthStatus.DEGRADED,
                f"文件不是Python脚本: {path.suffix}",
                {"path": str(path), "exists": True, "extension": path.suffix}
            )
        
        # 尝试导入脚本（语法检查）
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location("health_check_module", path)
            if spec is None:
                return (
                    HealthStatus.UNHEALTHY,
                    f"无法创建模块规范",
                    {"path": str(path), "exists": True, "importable": False}
                )
            
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # 获取脚本信息
            file_size = path.stat().st_size
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                line_count = len(lines)
                
                # 检查是否有shebang
                has_shebang = lines[0].startswith('#!') if lines else False
                
                # 检查是否有导入错误
                import_statements = [line for line in lines if line.strip().startswith('import ') or line.strip().startswith('from ')]
            
            return (
                HealthStatus.HEALTHY,
                f"脚本状态正常",
                {
                    "path": str(path),
                    "exists": True,
                    "file_size": file_size,
                    "line_count": line_count,
                    "has_shebang": has_shebang,
                    "import_count": len(import_statements),
                    "importable": True
                }
            )
            
        except SyntaxError as e:
            return (
                HealthStatus.UNHEALTHY,
                f"脚本语法错误: {str(e)}",
                {
                    "path": str(path),
                    "exists": True,
                    "error_type": "syntax_error",
                    "error": str(e),
                    "importable": False
                }
            )
        except Exception as e:
            return (
                HealthStatus.DEGRADED,
                f"脚本导入失败: {str(e)}",
                {
                    "path": str(path),
                    "exists": True,
                    "error_type": "import_error",
                    "error": str(e),
                    "importable": False
                }
            )

class SystemResourceChecker(HealthChecker):
    """系统资源检查"""
    
    def __init__(self):
        super().__init__("system_resources", CheckSeverity.MEDIUM)
    
    def _perform_check(self) -> Tuple[HealthStatus, str, Dict[str, Any]]:
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            # 内存使用率
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 磁盘使用率
            disk = psutil.disk_usage('.')
            disk_percent = disk.percent
            
            # 判断状态
            issues = []
            
            if cpu_percent > 80:
                issues.append(f"CPU使用率高: {cpu_percent}%")
                status = HealthStatus.DEGRADED
            elif memory_percent > 85:
                issues.append(f"内存使用率高: {memory_percent}%")
                status = HealthStatus.DEGRADED
            elif disk_percent > 90:
                issues.append(f"磁盘使用率高: {disk_percent}%")
                status = HealthStatus.DEGRADED
            else:
                status = HealthStatus.HEALTHY
            
            message = "系统资源正常" if not issues else ", ".join(issues)
            
            return (
                status,
                message,
                {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory_percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "memory_total_gb": memory.total / (1024**3),
                    "disk_percent": disk_percent,
                    "disk_free_gb": disk.free / (1024**3),
                    "disk_total_gb": disk.total / (1024**3),
                    "issues": issues
                }
            )
            
        except Exception as e:
            return (
                HealthStatus.UNKNOWN,
                f"系统资源检查失败: {str(e)}",
                {"error": str(e)}
            )

class HealthCheckSystem:
    """健康检查系统"""
    
    def __init__(self):
        self.checkers: List[HealthChecker] = []
        self.results_history: List[Dict[str, Any]] = []
        self.max_history = 100
        
        # 自动注册默认检查器
        self._register_default_checkers()
    
    def _register_default_checkers(self):
        """注册默认的健康检查器"""
        # 目录检查
        self.add_checker(DirectoryHealthChecker(
            "scripts",
            required_files=["self-learning-engine.py", "cross-workflow-orchestrator.py", "init-auto-ops.py"]
        ))
        
        self.add_checker(DirectoryHealthChecker(
            "config",
            required_files=["auto-ops-config.yaml", "business-metrics-mapping.yaml"]
        ))
        
        self.add_checker(DirectoryHealthChecker(".github/workflows"))
        self.add_checker(DirectoryHealthChecker("data"))
        
        # 文件检查
        self.add_checker(FileHealthChecker(
            "config/auto-ops-config.yaml",
            min_size=1000,
            check_content=True
        ))
        
        self.add_checker(FileHealthChecker(
            "config/business-metrics-mapping.yaml",
            min_size=1000,
            check_content=True
        ))
        
        # 脚本检查
        self.add_checker(ScriptHealthChecker("scripts/self-learning-engine.py"))
        self.add_checker(ScriptHealthChecker("scripts/cross-workflow-orchestrator.py"))
        self.add_checker(ScriptHealthChecker("scripts/init-auto-ops.py"))
        
        # 系统资源检查
        self.add_checker(SystemResourceChecker())
    
    def add_checker(self, checker: HealthChecker):
        """添加健康检查器"""
        self.checkers.append(checker)
        logger.info(f"已添加健康检查器: {checker.name}")
    
    def run_checks(self) -> Dict[str, Any]:
        """运行所有健康检查"""
        logger.info("开始运行健康检查...")
        
        start_time = time.time()
        results = []
        
        for checker in self.checkers:
            logger.debug(f"运行检查: {checker.name}")
            result = checker.check()
            results.append(result.to_dict())
        
        # 计算总体状态
        overall_status = self._calculate_overall_status(results)
        
        # 生成报告
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": overall_status.value,
            "total_checks": len(results),
            "successful_checks": sum(1 for r in results if r["status"] == "healthy"),
            "degraded_checks": sum(1 for r in results if r["status"] == "degraded"),
            "unhealthy_checks": sum(1 for r in results if r["status"] == "unhealthy"),
            "unknown_checks": sum(1 for r in results if r["status"] == "unknown"),
            "response_time": time.time() - start_time,
            "checks": results,
            "summary": self._generate_summary(results)
        }
        
        # 保存到历史
        self.results_history.append(report)
        if len(self.results_history) > self.max_history:
            self.results_history = self.results_history[-self.max_history:]
        
        logger.info(f"健康检查完成，总体状态: {overall_status.value}")
        
        return report
    
    def _calculate_overall_status(self, results: List[Dict]) -> HealthStatus:
        """计算总体健康状态"""
        if not results:
            return HealthStatus.UNKNOWN
        
        # 按严重性加权计算
        status_weights = {
            HealthStatus.UNHEALTHY: 4,
            HealthStatus.DEGRADED: 2,
            HealthStatus.UNKNOWN: 1,
            HealthStatus.HEALTHY: 0
        }
        
        total_weight = 0
        for result in results:
            status = HealthStatus(result["status"])
            severity = CheckSeverity(result["severity"])
            
            # 严重性乘数
            severity_multiplier = {
                CheckSeverity.CRITICAL: 3,
                CheckSeverity.HIGH: 2,
                CheckSeverity.MEDIUM: 1,
                CheckSeverity.LOW: 0.5
            }
            
            total_weight += status_weights[status] * severity_multiplier[severity]
        
        # 判断总体状态
        if total_weight >= 10:  # 多个关键问题
            return HealthStatus.UNHEALTHY
        elif total_weight >= 5:  # 一些重要问题
            return HealthStatus.DEGRADED
        elif total_weight >= 1:  # 轻微问题
            return HealthStatus.HEALTHY  # 仍算健康，但有警告
        else:
            return HealthStatus.HEALTHY
    
    def _generate_summary(self, results: List[Dict]) -> Dict[str, Any]:
        """生成检查摘要"""
        critical_issues = []
        warnings = []
        
        for result in results:
            if result["status"] == "unhealthy":
                critical_issues.append({
                    "check": result["check_name"],
                    "message": result["message"],
                    "severity": result["severity"]
                })
            elif result["status"] == "degraded":
                warnings.append({
                    "check": result["check_name"],
                    "message": result["message"],
                    "severity": result["severity"]
                })
        
        return {
            "critical_issues": critical_issues,
            "warnings": warnings,
            "critical_count": len(critical_issues),
            "warning_count": len(warnings)
        }
    
    def get_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """获取历史检查结果"""
        return self.results_history[-limit:] if self.results_history else []
    
    def save_report(self, report: Dict[str, Any], filepath: str = None):
        """保存检查报告"""
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"data/health_report_{timestamp}.json"
        
        # 确保目录存在
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"健康检查报告已保存: {filepath}")
        return filepath
    
    def get_status_dashboard(self) -> Dict[str, Any]:
        """获取状态仪表板数据"""
        if not self.results_history:
            return {"status": "no_data", "message": "尚无检查数据"}
        
        latest_report = self.results_history[-1]
        
        # 计算趋势（如果有历史数据）
        trend = "stable"
        if len(self.results_history) >= 2:
            prev_report = self.results_history[-2]
            current_healthy = latest_report["successful_checks"]
            prev_healthy = prev_report["successful_checks"]
            
            if current_healthy > prev_healthy:
                trend = "improving"
            elif current_healthy < prev_healthy:
                trend = "deteriorating"
        
        return {
            "current_status": latest_report["overall_status"],
            "trend": trend,
            "last_check": latest_report["timestamp"],
            "check_summary": {
                "total": latest_report["total_checks"],
                "healthy": latest_report["successful_checks"],
                "issues": latest_report["degraded_checks"] + latest_report["unhealthy_checks"]
            },
            "response_time": latest_report["response_time"],
            "critical_issues": latest_report["summary"]["critical_count"],
            "warnings": latest_report["summary"]["warning_count"]
        }

# 健康检查API端点
class HealthCheckAPI:
    """健康检查API"""
    
    def __init__(self, health_system: HealthCheckSystem):
        self.health_system = health_system
    
    def get_health(self) -> Dict[str, Any]:
        """获取健康状态"""
        report = self.health_system.run_checks()
        
        # 保存报告
        self.health_system.save_report(report)
        
        return {
            "status": "success",
            "data": {
                "report": report,
                "dashboard": self.health_system.get_status_dashboard()
            }
        }
    
    def get_status(self) -> Dict[str, Any]:
        """获取简要状态"""
        dashboard = self.health_system.get_status_dashboard()
        
        # 根据状态返回适当的HTTP状态码（在Web框架中）
        status_code = 200
        if dashboard["current_status"] == "unhealthy":
            status_code = 503  # Service Unavailable
        elif dashboard["current_status"] == "degraded":
            status_code = 206  # Partial Content
        
        return {
            "status": dashboard["current_status"],
            "code": status_code,
            "message": f"System is {dashboard['current_status']}",
            "checks_healthy": dashboard["check_summary"]["healthy"],
            "checks_total": dashboard["check_summary"]["total"],
            "last_check": dashboard["last_check"]
        }
    
    def get_history(self, limit: int = 10) -> Dict[str, Any]:
        """获取检查历史"""
        history = self.health_system.get_history(limit)
        
        return {
            "status": "success",
            "data": {
                "history": history,
                "count": len(history)
            }
        }

# 命令行接口
def main():
    """命令行主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Auto Ops 健康检查系统")
    parser.add_argument("--check", action="store_true", help="运行健康检查")
    parser.add_argument("--status", action="store_true", help="获取系统状态")
    parser.add_argument("--history", type=int, nargs="?", const=5, help="查看检查历史")
    parser.add_argument("--save", action="store_true", help="保存检查报告")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    # 配置日志
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 创建健康检查系统
    health_system = HealthCheckSystem()
    api = HealthCheckAPI(health_system)
    
    if args.check:
        print("🚀 运行 Auto Ops 健康检查...")
        print("="*60)
        
        report = health_system.run_checks()
        
        # 显示结果
        print(f"\n📊 总体状态: {report['overall_status'].upper()}")
        print(f"📋 检查总数: {report['total_checks']}")
        print(f"✅ 健康检查: {report['successful_checks']}")
        print(f"⚠️  降级检查: {report['degraded_checks']}")
        print(f"❌ 不健康检查: {report['unhealthy_checks']}")
        print(f"⏱️  响应时间: {report['response_time']:.2f}秒")
        
        # 显示关键问题
        if report['summary']['critical_issues']:
            print(f"\n🔴 关键问题 ({report['summary']['critical_count']}):")
            for issue in report['summary']['critical_issues']:
                print(f"  • {issue['check']}: {issue['message']}")
        
        # 显示警告
        if report['summary']['warnings']:
            print(f"\n🟡 警告 ({report['summary']['warning_count']}):")
            for warning in report['summary']['warnings']:
                print(f"  • {warning['check']}: {warning['message']}")
        
        if args.save:
            filepath = health_system.save_report(report)
            print(f"\n💾 报告已保存: {filepath}")
    
    elif args.status:
        status = api.get_status()
        print(f"📈 系统状态: {status['status'].upper()}")
        print(f"📊 检查结果: {status['checks_healthy']}/{status['checks_total']} 健康")
        print(f"🕐 最后检查: {status['last_check']}")
    
    elif args.history is not None:
        history = api.get_history(args.history)
        print(f"📜 检查历史 (最近 {len(history['data']['history'])} 次):")
        
        for i, report in enumerate(history['data']['history'], 1):
            print(f"\n{i}. {report['timestamp']}")
            print(f"   状态: {report['overall_status'].upper()}")
            print(f"   健康检查: {report['successful_checks']}/{report['total_checks']}")
    
    else:
        # 默认运行检查
        report = health_system.run_checks()
        print(f"✅ 健康检查完成")
        print(f"   总体状态: {report['overall_status']}")
        print(f"   健康检查: {report['successful_checks']}/{report['total_checks']}")

if __name__ == "__main__":
    main()
    
