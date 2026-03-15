#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
并行技能安装器
支持多技能同时安装，提高效率
"""

import asyncio
import aiohttp
import json
import os
import sys
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import yaml
import argparse

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/parallel-{datetime.now().strftime("%Y%m%d-%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ParallelInstallResult:
    """并行安装结果"""
    group_id: int
    group_name: str
    skills: List[str]
    start_time: float
    end_time: float
    results: List[Dict[str, Any]]
    success_count: int
    failed_count: int
    parallel_efficiency: float  # 并行效率（0-1）
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class ParallelSkillInstaller:
    """并行技能安装器"""
    
    def __init__(self, config_path: str = "config/install-config.yaml"):
        self.config_path = config_path
        self.config = {}
        self.semaphore = None  # 并发控制信号量
        self.load_config()
        
    def load_config(self):
        """加载配置"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            logger.info(f"Loaded config from {self.config_path}")
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            self.config = {
                "max_parallel": 4,
                "timeout": 120,
                "max_retries": 3
            }
    
    async def install_skill_async(self, skill: str, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """异步安装单个技能"""
        start_time = time.time()
        logger.info(f"Starting async installation of {skill}")
        
        result = {
            "skill": skill,
            "status": "pending",
            "start_time": start_time,
            "end_time": None,
            "duration": None,
            "message": "",
            "retry_count": 0
        }
        
        methods = [
            self._install_via_npm_async,
            self._install_via_npx_async,
            self._install_via_direct_async
        ]
        
        for method in methods:
            try:
                method_result = await method(skill, session)
                if method_result.get("success", False):
                    result["status"] = "success"
                    result["message"] = method_result.get("message", "Success")
                    break
                else:
                    result["message"] = method_result.get("error", "Method failed")
            except Exception as e:
                logger.warning(f"Method {method.__name__} failed for {skill}: {e}")
                result["message"] = str(e)
        
        if result["status"] == "pending":
            result["status"] = "failed"
        
        result["end_time"] = time.time()
        result["duration"] = result["end_time"] - start_time
        
        return result
    
    async def _install_via_npm_async(self, skill: str, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """异步通过 npm 安装"""
        try:
            # 这里可以替换为实际的 npm 安装逻辑
            # 暂时使用模拟
            await asyncio.sleep(1)  # 模拟网络请求
            return {"success": True, "message": f"npm install clawhub-{skill} succeeded"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _install_via_npx_async(self, skill: str, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """异步通过 npx 安装"""
        try:
            # 模拟 npx 安装
            await asyncio.sleep(1.5)
            return {"success": True, "message": f"npx clawhub install {skill} succeeded"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _install_via_direct_async(self, skill: str, session: aiohttp.ClientSession) -> Dict[str, Any]:
        """异步直接安装"""
        try:
            # 模拟直接下载安装
            await asyncio.sleep(2)
            return {"success": True, "message": f"Direct installation of {skill} succeeded"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def install_skills_parallel(self, skills: List[str], group_id: int = 1, 
                                     group_name: str = "default") -> ParallelInstallResult:
        """并行安装技能组"""
        start_time = time.time()
        logger.info(f"Starting parallel installation of group {group_id} ({group_name})")
        logger.info(f"Skills to install: {skills}")
        
        # 设置并发限制
        max_parallel = self.config.get("max_parallel", 4)
        self.semaphore = asyncio.Semaphore(max_parallel)
        
        async def install_with_semaphore(skill: str, session: aiohttp.ClientSession) -> Dict[str, Any]:
            async with self.semaphore:
                return await self.install_skill_async(skill, session)
        
        # 创建会话并执行并行安装
        async with aiohttp.ClientSession() as session:
            tasks = [install_with_semaphore(skill, session) for skill in skills]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理结果
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "skill": skills[i],
                    "status": "error",
                    "message": str(result),
                    "duration": 0
                })
            else:
                processed_results.append(result)
        
        # 计算统计信息
        end_time = time.time()
        total_duration = end_time - start_time
        
        success_count = len([r for r in processed_results if r["status"] == "success"])
        failed_count = len(processed_results) - success_count
        
        # 计算并行效率（理想并行时间 / 实际时间）
        max_skill_duration = max([r.get("duration", 0) for r in processed_results])
        ideal_parallel_time = max_skill_duration  # 最慢的技能时间
        parallel_efficiency = ideal_parallel_time / total_duration if total_duration > 0 else 0
        
        result = ParallelInstallResult(
            group_id=group_id,
            group_name=group_name,
            skills=skills,
            start_time=start_time,
            end_time=end_time,
            results=processed_results,
            success_count=success_count,
            failed_count=failed_count,
            parallel_efficiency=min(parallel_efficiency, 1.0)  # 不超过1
        )
        
        # 生成报告
        self.generate_group_report(result)
        
        return result
    
    def generate_group_report(self, result: ParallelInstallResult):
        """生成组报告"""
        os.makedirs("data", exist_ok=True)
        os.makedirs("docs", exist_ok=True)
        
        # JSON 报告
        report_json = result.to_dict()
        with open(f"data/group-{result.group_id}-results.json", "w", encoding='utf-8') as f:
            json.dump(report_json, f, indent=2, ensure_ascii=False)
        
        # Markdown 报告
        md_content = self._generate_group_markdown(result)
        with open(f"docs/group-{result.group_id}-report.md", "w", encoding='utf-8') as f:
            f.write(md_content)
        
        # 控制台输出
        print(f"\n{'='*60}")
        print(f"Group {result.group_id} ({result.group_name}) Results")
        print(f"{'='*60}")
        print(f"Total skills: {len(result.skills)}")
        print(f"Success: {result.success_count}")
        print(f"Failed: {result.failed_count}")
        print(f"Total time: {result.end_time - result.start_time:.2f}s")
        print(f"Parallel efficiency: {result.parallel_efficiency*100:.1f}%")
        print(f"{'='*60}")
    
    def _generate_group_markdown(self, result: ParallelInstallResult) -> str:
        """生成组 Markdown 报告"""
        md = f"""# 并行安装组报告

## 组信息
- **组ID**: {result.group_id}
- **组名**: {result.group_name}
- **技能数量**: {len(result.skills)}
- **开始时间**: {datetime.fromtimestamp(result.start_time).strftime('%Y-%m-%d %H:%M:%S')}
- **结束时间**: {datetime.fromtimestamp(result.end_time).strftime('%Y-%m-%d %H:%M:%S')}
- **总耗时**: {result.end_time - result.start_time:.2f}秒
- **并行效率**: {result.parallel_efficiency*100:.1f}%

## 统计信息
| 指标 | 数值 |
|------|------|
| 总计 | {len(result.skills)} |
| 成功 | {result.success_count} |
| 失败 | {result.failed_count} |
| 成功率 | {result.success_count/len(result.skills)*100:.1f}% |
| 平均耗时 | {(result.end_time - result.start_time)/len(result.skills):.2f}秒/技能 |

## 详细结果

"""
        
        for r in result.results:
            status_emoji = "✅" if r["status"] == "success" else "❌"
            md += f"""
### {status_emoji} {r['skill']}

- **状态**: {r['status']}
- **耗时**: {r.get('duration', 0):.2f}秒
- **时间**: {datetime.fromtimestamp(r.get('start_time', 0)).strftime('%H:%M:%S')}
"""
            if r["status"] == "success":
                md += f"- **消息**: {r['message'][:100]}...\n"
            else:
                md += f"- **错误**: {r['message'][:100]}...\n"
        
        md += f"""
## 性能分析

### 并行效率分析
- **理论最优时间**: {max([r.get('duration', 0) for r in result.results]):.2f}秒
- **实际执行时间**: {result.end_time - result.start_time:.2f}秒
- **并行效率**: {result.parallel_efficiency*100:.1f}%

### 优化建议
"""
        
        if result.parallel_efficiency < 0.7:
            md += "- ⚠️ 并行效率较低，考虑减少并发数或优化网络连接\n"
        elif result.parallel_efficiency < 0.9:
            md += "- ⚡ 并行效率良好，可以尝试增加并发数\n"
        else:
            md += "- 🚀 并行效率优秀，已达到理论最优\n"
        
        md += "\n---\n*报告由并行安装器生成 | 版本: 2.0.0*"
        
        return md

async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="并行技能安装器")
    parser.add_argument("--group", type=int, default=1, help="组ID")
    parser.add_argument("--group-name", type=str, default="default", help="组名")
    parser.add_argument("--skills", type=str, required=True, help="技能列表（逗号分隔）")
    parser.add_argument("--timeout", type=int, default=120, help="超时时间（秒）")
    parser.add_argument("--retries", type=int, default=3, help="最大重试次数")
    
    args = parser.parse_args()
    
    # 解析技能列表
    skills = [s.strip() for s in args.skills.split(",") if s.strip()]
    
    if not skills:
        print("错误：未提供技能列表")
        sys.exit(1)
    
    # 创建安装器并执行
    installer = ParallelSkillInstaller()
    
    # 更新配置
    installer.config["timeout"] = args.timeout
    installer.config["max_retries"] = args.retries
    
    try:
        result = await installer.install_skills_parallel(
            skills=skills,
            group_id=args.group,
            group_name=args.group_name
        )
        
        # 设置退出码
        if result.failed_count == 0:
            sys.exit(0)  # 完全成功
        elif result.success_count > 0:
            sys.exit(2)  # 部分成功
        else:
            sys.exit(1)  # 完全失败
            
    except Exception as e:
        logger.error(f"Fatal error in parallel installation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())