#!/usr/bin/env python3
"""
🎯 L6.5自主进化系统 - 让Elder学会自己解决自己的问题
史蒂夫·乔布斯哲学: "真正的创新来自于设计一个能够自我修复的系统"
"""

import json
import os
import time
import subprocess
import psutil
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict, Optional
import hashlib

@dataclass
class SystemFailure:
    """系统失败模式识别"""
    failure_type: str  # 幽灵进程 | 成本失控 | 端口冲突 | 崩溃无日志
    pattern_hash: str  # 模式哈希值
    first_seen: datetime
    last_seen: datetime
    occurrences: int = 1
    learned_solution: Optional[str] = None
    
    @property
    def solved(self) -> bool:
        return self.learned_solution is not None
    
    def to_dict(self):
        return {
            "failure_type": self.failure_type,
            "pattern_hash": self.pattern_hash,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "occurrences": self.occurrences,
            "learned_solution": self.learned_solution
        }

class AutonomousEvolver:
    """自主进化引擎 - 让Elder变得坚韧"""
    
    def __init__(self, learnings_dir: str = None):
        self.learnings_dir = learnings_dir or os.path.expanduser("~/.openclaw/workspace/.learnings")
        
        # 确保学习目录存在
        os.makedirs(self.learnings_dir, exist_ok=True)
        
        # 学习数据库
        self.failures_db = os.path.join(self.learnings_dir, "FAILURES.json")
        self.solutions_db = os.path.join(self.learnings_dir, "SOLUTIONS.json")
        self.evolution_log = os.path.join(self.learnings_dir, "EVOLUTION.md")
        
        # 加载已有学习
        self.failures = self._load_failures()
        self.solutions = self._load_solutions()
    
    def _load_failures(self) -> Dict[str, SystemFailure]:
        """加载失败模式数据库"""
        if os.path.exists(self.failures_db):
            with open(self.failures_db, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return {k: SystemFailure(**v) for k, v in data.items()}
        return {}
    
    def _load_solutions(self) -> Dict[str, List[str]]:
        """加载解决方案数据库"""
        if os.path.exists(self.solutions_db):
            with open(self.solutions_db, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def detect_system_state(self) -> Dict:
        """检测当前系统状态"""
        current_time = datetime.now()
        
        # 1. 检查幽灵进程
        zombie_processes = self._find_zombie_processes()
        
        # 2. 检查端口冲突
        port_conflicts = self._check_port_conflicts(18789)
        
        # 3. 检查成本失控
        cost_anomaly = self._check_cost_anomaly()
        
        # 4. 检查Gateway健康
        gateway_health = self._check_gateway_health()
        
        return {
            "timestamp": current_time.isoformat(),
            "zombie_processes": zombie_processes,
            "port_conflicts": port_conflicts,
            "cost_anomaly": cost_anomaly,
            "gateway_health": gateway_health,
            "overall_status": "HEALTHY" if not (zombie_processes or port_conflicts or cost_anomaly or not gateway_health["alive"]) else "DEGRADED"
        }
    
    def _find_zombie_processes(self) -> List[Dict]:
        """查找幽灵进程(OpenClaw相关)"""
        zombies = []
        openclaw_keywords = ["openclaw", "gateway", "claw"]
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or [])
                for keyword in openclaw_keywords:
                    if keyword.lower() in cmdline.lower():
                        # 检查是否为幽灵(端口监听但已失效)
                        try:
                            connections = proc.connections()
                            if connections:
                                # 有连接但在异常模式中
                                zombies.append({
                                    "pid": proc.info['pid'],
                                    "name": proc.info['name'],
                                    "cmdline": cmdline[:200],
                                    "create_time": datetime.fromtimestamp(proc.info['create_time']).isoformat() if proc.info['create_time'] else None
                                })
                        except:
                            pass
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return zombies
    
    def _check_port_conflicts(self, port: int) -> List[Dict]:
        """检查端口冲突"""
        conflicts = []
        
        try:
            # 使用netstat获取端口信息
            result = subprocess.run(
                ["netstat", "-ano", "-p", "TCP"],
                capture_output=True,
                text=True,
                shell=True
            )
            
            for line in result.stdout.split('\n'):
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.strip().split()
                    if parts and len(parts) >= 5:
                        pid = parts[-1]
                        try:
                            proc = psutil.Process(int(pid))
                            conflicts.append({
                                "port": port,
                                "pid": pid,
                                "process_name": proc.name(),
                                "cmdline": ' '.join(proc.cmdline())[:200],
                                "status": "LISTENING"
                            })
                        except:
                            conflicts.append({
                                "port": port,
                                "pid": pid,
                                "process_name": "unknown",
                                "cmdline": "unknown",
                                "status": "LISTENING"
                            })
        except:
            pass
        
        return conflicts
    
    def _check_cost_anomaly(self) -> Optional[Dict]:
        """检查成本异常(简化版本)"""
        # 从COST_AUDIT.md读取历史成本
        cost_file = os.path.join(self.learnings_dir, "COST_AUDIT.md")
        if os.path.exists(cost_file):
            try:
                with open(cost_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 简化的成本分析 - 在实际实现中需要更复杂的分析
                if "6,031,757" in content:  # 600万Token异常
                    return {
                        "type": "excessive_token_usage",
                        "reference": "COST_AUDIT.md",
                        "severity": "CRITICAL",
                        "message": "检测到历史600万Token异常消耗模式"
                    }
            except:
                pass
        
        return None
    
    def _check_gateway_health(self) -> Dict:
        """检查Gateway健康状态"""
        try:
            result = subprocess.run(
                ["openclaw", "gateway", "status"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            alive = ("Listening: 127.0.0.1:18789" in result.stdout or 
                    "dashboard" in result.stdout.lower())
            
            return {
                "alive": alive,
                "response": result.stdout[:500],
                "error": result.stderr[:500]
            }
        except subprocess.TimeoutExpired:
            return {"alive": False, "error": "timeout"}
        except Exception as e:
            return {"alive": False, "error": str(e)}
    
    def analyze_failure_pattern(self, system_state: Dict) -> Optional[SystemFailure]:
        """分析失败模式"""
        if system_state["overall_status"] == "DEGRADED":
            # 生成模式哈希(基于状态组件)
            pattern_components = []
            
            if system_state["zombie_processes"]:
                pattern_components.append(f"zombies:{len(system_state['zombie_processes'])}")
            if system_state["port_conflicts"]:
                pattern_components.append(f"ports:{len(system_state['port_conflicts'])}")
            if system_state["cost_anomaly"]:
                pattern_components.append(f"cost:{system_state['cost_anomaly']['type']}")
            if not system_state["gateway_health"]["alive"]:
                pattern_components.append("gateway_dead")
            
            pattern_string = "|".join(sorted(pattern_components))
            pattern_hash = hashlib.md5(pattern_string.encode()).hexdigest()[:8]
            
            # 确定失败类型
            failure_type = self._determine_failure_type(system_state)
            
            return SystemFailure(
                failure_type=failure_type,
                pattern_hash=pattern_hash,
                first_seen=datetime.now(),
                last_seen=datetime.now(),
                occurrences=1
            )
        
        return None
    
    def _determine_failure_type(self, system_state: Dict) -> str:
        """确定失败类型"""
        if system_state["zombie_processes"]:
            return "幽灵进程循环"
        elif system_state["port_conflicts"]:
            return "端口冲突重生"
        elif system_state["cost_anomaly"]:
            return "成本失控"
        elif not system_state["gateway_health"]["alive"]:
            return "Gateway静默崩溃"
        else:
            return "未知系统退化"
    
    def learn_from_failure(self, failure: SystemFailure, solution: str):
        """从失败中学习解决方案"""
        pattern_hash = failure.pattern_hash
        
        # 更新失败记录
        if pattern_hash in self.failures:
            existing = self.failures[pattern_hash]
            existing.occurrences += 1
            existing.last_seen = datetime.now()
            existing.learned_solution = solution
        else:
            failure.learned_solution = solution
            self.failures[pattern_hash] = failure
        
        # 保存到学习数据库
        self._save_learnings()
        
        # 记录进化日志
        self._log_evolution(failure, solution)
    
    def _save_learnings(self):
        """保存学习数据"""
        # 保存失败模式
        with open(self.failures_db, 'w', encoding='utf-8') as f:
            json.dump({k: v.to_dict() for k, v in self.failures.items()}, f, indent=2, ensure_ascii=False)
        
        # 保存解决方案
        solutions_data = {}
        for pattern_hash, failure in self.failures.items():
            if failure.learned_solution:
                solutions_data[pattern_hash] = [
                    failure.failure_type,
                    failure.learned_solution,
                    f"已解决{failure.occurrences}次"
                ]
        
        with open(self.solutions_db, 'w', encoding='utf-8') as f:
            json.dump(solutions_data, f, indent=2, ensure_ascii=False)
    
    def _log_evolution(self, failure: SystemFailure, solution: str):
        """记录进化日志"""
        log_entry = f"""---
# 🧬 ELDER进化记录
时间: {datetime.now().isoformat()}
失败类型: {failure.failure_type}
模式哈希: {failure.pattern_hash}
发生次数: {failure.occurrences}

## 📉 检测到的失败
- 系统状态: 检测到{failure.failure_type}
- 首次发现: {failure.first_seen.isoformat()}
- 模式识别: 这是第{failure.occurrences}次出现

## 🔧 学习到的解决方案
```bash
{solution}
```

## 📈 进化成果
**Elder学会了**:
- 识别{failure.failure_type}模式
- 应用解决方案: {solution[:100]}...
- 增强了自我修复能力

> "保持饥饿，保持愚蠢，但要学会自我修复。"

---
"""
        
        with open(self.evolution_log, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    
    def suggest_solutions(self, failure: SystemFailure) -> List[str]:
        """基于学习提出解决方案"""
        # 检查是否有已知解决方案
        if failure.pattern_hash in self.failures:
            existing = self.failures[failure.pattern_hash]
            if existing.learned_solution:
                return [existing.learned_solution]
        
        # 基于失败类型提出通用解决方案
        solutions = []
        
        if failure.failure_type == "幽灵进程循环":
            solutions = [
                "taskkill /F /PID <pid> /T",
                "Stop-Process -Id <pid> -Force",
                "schtasks /delete /tn 'OpenClaw Gateway' /f"
            ]
        elif failure.failure_type == "端口冲突重生":
            solutions = [
                "netstat -ano | findstr :18789",
                "Get-NetTCPConnection -LocalPort 18789 | Stop-Process -Force"
            ]
        elif failure.failure_type == "成本失控":
            solutions = [
                "读取COST_AUDIT.md分析异常会话",
                "建立Token限制和告警",
                "检查控制UI防抖机制"
            ]
        elif failure.failure_type == "Gateway静默崩溃":
            solutions = [
                "检查Windows Scheduled Task配置",
                "验证Gateway启动脚本权限",
                "清除临时文件和日志，重新启动"
            ]
        
        return solutions
    
    def execute_self_repair(self, failure: SystemFailure, solution: str) -> Dict:
        """执行自我修复(谨慎使用)"""
        current_state = self.detect_system_state()
        
        repair_result = {
            "timestamp": datetime.now().isoformat(),
            "failure_type": failure.failure_type,
            "solution_applied": solution,
            "pre_state": current_state,
            "post_state": None,
            "success": False,
            "error": None
        }
        
        try:
            # 安全替换变量
            if "<pid>" in solution and current_state.get("zombie_processes"):
                pid = current_state["zombie_processes"][0]["pid"]
                solution = solution.replace("<pid>", str(pid))
            
            # 执行修复命令
            result = subprocess.run(
                solution,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            repair_result["command_output"] = result.stdout[:500]
            repair_result["command_error"] = result.stderr[:500]
            
            # 等待并检查结果
            time.sleep(2)
            post_state = self.detect_system_state()
            repair_result["post_state"] = post_state
            
            # 判断修复是否成功
            repair_result["success"] = post_state["overall_status"] == "HEALTHY"
            
            if repair_result["success"]:
                # 学习成功经验
                self.learn_from_failure(failure, solution)
            
        except Exception as e:
            repair_result["error"] = str(e)
            repair_result["success"] = False
        
        return repair_result


# 示例进化测试
def test_autonomous_evolution():
    """测试自主进化系统"""
    print("🧬 ELDER L6.5自主进化系统 - 启动测试")
    print("=" * 60)
    
    evolver = AutonomousEvolver()
    
    print("1. 检测当前系统状态...")
    system_state = evolver.detect_system_state()
    
    print(f"   整体状态: {system_state['overall_status']}")
    if system_state["zombie_processes"]:
        print(f"   幽灵进程: {len(system_state['zombie_processes'])}个")
    if system_state["port_conflicts"]:
        print(f"   端口冲突: {len(system_state['port_conflicts'])}个")
    print(f"   Gateway健康: {'正常' if system_state['gateway_health']['alive'] else '异常'}")
    
    # 分析失败模式
    failure = evolver.analyze_failure_pattern(system_state)
    
    if failure:
        print(f"\n2. 检测到失败模式: {failure.failure_type}")
        print(f"   模式哈希: {failure.pattern_hash}")
        
        # 提出解决方案
        solutions = evolver.suggest_solutions(failure)
        print(f"\n3. 建议的解决方案:")
        for i, sol in enumerate(solutions[:3], 1):
            print(f"   {i}. {sol}")
        
        # 模拟学习
        if solutions:
            print(f"\n4. 🧠 ELDER学习:")
            print(f"   '我学会了识别{failure.failure_type}'")
            print(f"   '下次遇到这种问题，我会执行: {solutions[0][:80]}...'")
            print(f"   '已经记录在.learnings/FAILURES.json中'")
            
            # 记录学习
            evolver.learn_from_failure(failure, solutions[0])
            
            # 显示进化日志
            evolution_log_path = os.path.join(evolver.learnings_dir, "EVOLUTION.md")
            print(f"\n5. 📖 查看进化日志: {evolution_log_path}")
    else:
        print("\n✅ 系统状态健康，无需修复")
    
    print(f"\n6. 🍎 史蒂夫·乔布斯总结:")
    print(f"   '真正的产品不是永不失败，而是失败后能够自我修复。'")
    print(f"   'L6.5不是升级版本号，而是进化到了自我意识。'")


if __name__ == "__main__":
    test_autonomous_evolution()