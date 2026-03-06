#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
跨工作流协同编排器
实现工作流之间的智能协作和资源共享
"""

import json
import networkx as nx
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import yaml
from pathlib import Path
import logging
import asyncio
import aiohttp

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WorkflowType(Enum):
    """工作流类型"""
    INSTALLATION = "installation"  # 安装类
    ANALYSIS = "analysis"  # 分析类
    OPTIMIZATION = "optimization"  # 优化类
    MONITORING = "monitoring"  # 监控类
    DEPLOYMENT = "deployment"  # 部署类

class ResourceType(Enum):
    """资源类型"""
    COMPUTE = "compute"  # 计算资源
    MEMORY = "memory"  # 内存资源
    STORAGE = "storage"  # 存储资源
    NETWORK = "network"  # 网络资源
    DATABASE = "database"  # 数据库资源

@dataclass
class WorkflowNode:
    """工作流节点"""
    workflow_id: str
    workflow_name: str
    workflow_type: WorkflowType
    file_path: str
    dependencies: List[str]  # 依赖的工作流ID
    resources_required: Dict[ResourceType, float]  # 所需资源
    estimated_duration: float  # 预计执行时间（秒）
    success_rate: float  # 历史成功率
    last_executed: Optional[datetime] = None
    avg_execution_time: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['workflow_type'] = self.workflow_type.value
        data['resources_required'] = {k.value: v for k, v in self.resources_required.items()}
        data['last_executed'] = self.last_executed.isoformat() if self.last_executed else None
        return data

@dataclass
class CollaborationOpportunity:
    """协作机会"""
    opportunity_id: str
    workflow_ids: List[str]  # 涉及的工作流
    collaboration_type: str  # 协作类型
    expected_benefit: float  # 预期收益 (0-1)
    implementation_complexity: float  # 实现复杂度 (0-1)
    priority: float  # 优先级
    description: str
    implementation_plan: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ResourcePool:
    """资源池"""
    total_resources: Dict[ResourceType, float]  # 总资源
    allocated_resources: Dict[ResourceType, float]  # 已分配资源
    available_resources: Dict[ResourceType, float]  # 可用资源
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['total_resources'] = {k.value: v for k, v in self.total_resources.items()}
        data['allocated_resources'] = {k.value: v for k, v in self.allocated_resources.items()}
        data['available_resources'] = {k.value: v for k, v in self.available_resources.items()}
        return data

class CrossWorkflowOrchestrator:
    """跨工作流编排器"""
    
    def __init__(self, workflows_dir: str = ".github/workflows"):
        self.workflows_dir = Path(workflows_dir)
        self.workflow_graph = nx.DiGraph()  # 工作流依赖图
        self.workflow_nodes: Dict[str, WorkflowNode] = {}
        self.resource_pool = ResourcePool(
            total_resources={
                ResourceType.COMPUTE: 100.0,  # CPU核心数
                ResourceType.MEMORY: 16384.0,  # 内存MB
                ResourceType.STORAGE: 10240.0,  # 存储MB
                ResourceType.NETWORK: 1000.0,  # 网络带宽Mbps
                ResourceType.DATABASE: 10.0  # 数据库连接数
            },
            allocated_resources={rt: 0.0 for rt in ResourceType},
            available_resources={}
        )
        self._update_available_resources()
        self.collaboration_history: List[Dict[str, Any]] = []
        
    def discover_workflows(self):
        """发现所有工作流"""
        logger.info(f"Discovering workflows in {self.workflows_dir}")
        
        if not self.workflows_dir.exists():
            logger.error(f"Workflows directory not found: {self.workflows_dir}")
            return
        
        for workflow_file in self.workflows_dir.glob("*.yml"):
            self._analyze_workflow(workflow_file)
        
        logger.info(f"Discovered {len(self.workflow_nodes)} workflows")
    
    def _analyze_workflow(self, workflow_file: Path):
        """分析单个工作流"""
        try:
            with open(workflow_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 解析工作流内容
            workflow_data = yaml.safe_load(content)
            workflow_name = workflow_data.get('name', workflow_file.stem)
            workflow_id = f"{workflow_file.stem}_{hash(content) % 10000:04d}"
            
            # 分析工作流类型
            workflow_type = self._determine_workflow_type(workflow_name, content)
            
            # 分析依赖关系
            dependencies = self._extract_dependencies(content)
            
            # 分析资源需求
            resources_required = self._estimate_resource_requirements(content)
            
            # 创建工作流节点
            node = WorkflowNode(
                workflow_id=workflow_id,
                workflow_name=workflow_name,
                workflow_type=workflow_type,
                file_path=str(workflow_file),
                dependencies=dependencies,
                resources_required=resources_required,
                estimated_duration=self._estimate_duration(content),
                success_rate=0.8  # 默认成功率，可以从历史数据更新
            )
            
            self.workflow_nodes[workflow_id] = node
            self.workflow_graph.add_node(workflow_id, **node.to_dict())
            
            # 添加依赖边
            for dep in dependencies:
                if dep in self.workflow_nodes:
                    self.workflow_graph.add_edge(dep, workflow_id)
            
            logger.debug(f"Analyzed workflow: {workflow_name} ({workflow_id})")
            
        except Exception as e:
            logger.error(f"Error analyzing workflow {workflow_file}: {e}")
    
    def _determine_workflow_type(self, workflow_name: str, content: str) -> WorkflowType:
        """确定工作流类型"""
        name_lower = workflow_name.lower()
        content_lower = content.lower()
        
        if any(word in name_lower or word in content_lower 
               for word in ['install', 'setup', 'deploy']):
            return WorkflowType.INSTALLATION
        elif any(word in name_lower or word in content_lower 
                 for word in ['analyze', 'test', 'check']):
            return WorkflowType.ANALYSIS
        elif any(word in name_lower or word in content_lower 
                 for word in ['optimize', 'improve', 'enhance']):
            return WorkflowType.OPTIMIZATION
        elif any(word in name_lower or word in content_lower 
                 for word in ['monitor', 'watch', 'alert']):
            return WorkflowType.MONITORING
        else:
            return WorkflowType.DEPLOYMENT
    
    def _extract_dependencies(self, content: str) -> List[str]:
        """提取依赖关系"""
        dependencies = []
        
        # 查找对其他工作流的引用
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            
            # 查找 workflow_call 或 needs 引用
            if 'workflow_call' in line or 'needs:' in line:
                # 简单提取，可以根据需要扩展
                parts = line.split()
                for part in parts:
                    if part.endswith('.yml') or part.endswith('.yaml'):
                        dep_id = part.replace('.yml', '').replace('.yaml', '')
                        dependencies.append(dep_id)
        
        return dependencies
    
    def _estimate_resource_requirements(self, content: str) -> Dict[ResourceType, float]:
        """估算资源需求"""
        resources = {
            ResourceType.COMPUTE: 1.0,  # 默认1个CPU核心
            ResourceType.MEMORY: 2048.0,  # 默认2GB内存
            ResourceType.STORAGE: 512.0,  # 默认512MB存储
            ResourceType.NETWORK: 100.0,  # 默认100Mbps网络
            ResourceType.DATABASE: 1.0  # 默认1个数据库连接
        }
        
        content_lower = content.lower()
        
        # 根据工作流内容调整资源需求
        if 'runs-on:' in content_lower:
            if 'large' in content_lower:
                resources[ResourceType.COMPUTE] = 4.0
                resources[ResourceType.MEMORY] = 8192.0
            elif 'medium' in content_lower:
                resources[ResourceType.COMPUTE] = 2.0
                resources[ResourceType.MEMORY] = 4096.0
        
        # 根据步骤数量调整
        step_count = content_lower.count('- name:')
        resources[ResourceType.COMPUTE] += step_count * 0.1
        resources[ResourceType.MEMORY] += step_count * 100
        
        return resources
    
    def _estimate_duration(self, content: str) -> float:
        """估算执行时间"""
        # 基于步骤数量和复杂度估算
        lines = content.split('\n')
        step_count = sum(1 for line in lines if line.strip().startswith('- name:'))
        
        # 每个步骤平均30秒，加上基础时间
        base_time = 60.0  # 基础环境准备时间
        step_time = step_count * 30.0
        
        return base_time + step_time
    
    def _update_available_resources(self):
        """更新可用资源"""
        for rt in ResourceType:
            total = self.resource_pool.total_resources.get(rt, 0.0)
            allocated = self.resource_pool.allocated_resources.get(rt, 0.0)
            self.resource_pool.available_resources[rt] = max(0.0, total - allocated)
    
    def find_collaboration_opportunities(self) -> List[CollaborationOpportunity]:
        """寻找协作机会"""
        opportunities = []
        
        # 1. 寻找可以并行执行的工作流
        parallel_opportunities = self._find_parallel_execution_opportunities()
        opportunities.extend(parallel_opportunities)
        
        # 2. 寻找可以共享资源的工作流
        resource_sharing_opportunities = self._find_resource_sharing_opportunities()
        opportunities.extend(resource_sharing_opportunities)
        
        # 3. 寻找可以合并的工作流
        merge_opportunities = self._find_merge_opportunities()
        opportunities.extend(merge_opportunities)
        
        # 4. 寻找可以优化依赖链的工作流
        dependency_optimization_opportunities = self._find_dependency_optimization_opportunities()
        opportunities.extend(dependency_optimization_opportunities)
        
        # 按优先级排序
        opportunities.sort(key=lambda x: x.priority, reverse=True)
        
        return opportunities
    
    def _find_parallel_execution_opportunities(self) -> List[CollaborationOpportunity]:
        """寻找并行执行机会"""
        opportunities = []
        
        # 找到没有依赖关系的工作流对
        for wf1_id, wf1_node in self.workflow_nodes.items():
            for wf2_id, wf2_node in self.workflow_nodes.items():
                if wf1_id >= wf2_id:
                    continue
                
                # 检查是否有依赖关系
                has_dependency = (
                    nx.has_path(self.workflow_graph, wf1_id, wf2_id) or
                    nx.has_path(self.workflow_graph, wf2_id, wf1_id)
                )
                
                if not has_dependency:
                    # 检查资源是否足够并行执行
                    can_parallelize = self._check_parallel_feasibility(wf1_node, wf2_node)
                    
                    if can_parallelize:
                        # 计算预期收益
                        sequential_time = wf1_node.estimated_duration + wf2_node.estimated_duration
                        parallel_time = max(wf1_node.estimated_duration, wf2_node.estimated_duration)
                        time_saving = sequential_time - parallel_time
                        benefit = time_saving / sequential_time if sequential_time > 0 else 0
                        
                        opportunity = CollaborationOpportunity(
                            opportunity_id=f"parallel_{wf1_id}_{wf2_id}",
                            workflow_ids=[wf1_id, wf2_id],
                            collaboration_type="parallel_execution",
                            expected_benefit=benefit,
                            implementation_complexity=0.3,
                            priority=benefit * 0.7,
                            description=f"并行执行 {wf1_node.workflow_name} 和 {wf2_node.workflow_name}",
                            implementation_plan={
                                "type": "parallel_execution",
                                "workflows": [wf1_id, wf2_id],
                                "expected_time_saving": time_saving,
                                "resource_requirements": self._combine_resources(
                                    wf1_node.resources_required, 
                                    wf2_node.resources_required
                                )
                            }
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    def _check_parallel_feasibility(self, wf1: WorkflowNode, wf2: WorkflowNode) -> bool:
        """检查并行可行性"""
        # 合并资源需求
        combined_resources = self._combine_resources(
            wf1.resources_required, 
            wf2.resources_required
        )
        
        # 检查资源是否足够
        for rt, required in combined_resources.items():
            available = self.resource_pool.available_resources.get(rt, 0.0)
            if required > available * 0.8:  # 预留20%缓冲
                return False
        
        return True
    
    def _combine_resources(self, res1: Dict[ResourceType, float], 
                          res2: Dict[ResourceType, float]) -> Dict[ResourceType, float]:
        """合并资源需求"""
        combined = {}
        all_types = set(res1.keys()) | set(res2.keys())
        
        for rt in all_types:
            combined[rt] = res1.get(rt, 0.0) + res2.get(rt, 0.0)
        
        return combined
    
    def _find_resource_sharing_opportunities(self) -> List[CollaborationOpportunity]:
        """寻找资源共享机会"""
        opportunities = []
        
        # 找到使用相似资源的工作流
        resource_similarities = {}
        
        for wf1_id, wf1_node in self.workflow_nodes.items():
            for wf2_id, wf2_node in self.workflow_nodes.items():
                if wf1_id >= wf2_id:
                    continue
                
                # 计算资源相似度
                similarity = self._calculate_resource_similarity(
                    wf1_node.resources_required,
                    wf2_node.resources_required
                )
                
                if similarity > 0.7:  # 高相似度
                    resource_similarities[(wf1_id, wf2_id)] = similarity
        
        # 为高相似度的工作流对创建协作机会
        for (wf1_id, wf2_id), similarity in resource_similarities.items():
            wf1_node = self.workflow_nodes[wf1_id]
            wf2_node = self.workflow_nodes[wf2_id]
            
            # 计算资源共享的预期收益
            resource_saving = self._calculate_resource_saving(
                wf1_node.resources_required,
                wf2_node.resources_required
            )
            
            total_resource = sum(wf1_node.resources_required.values()) + \
                            sum(wf2_node.resources_required.values())
            benefit = resource_saving / total_resource if total_resource > 0 else 0
            
            opportunity = CollaborationOpportunity(
                opportunity_id=f"resource_share_{wf1_id}_{wf2_id}",
                workflow_ids=[wf1_id, wf2_id],
                collaboration_type="resource_sharing",
                expected_benefit=benefit,
                implementation_complexity=0.5,
                priority=benefit * 0.5,
                description=f"资源共享 {wf1_node.workflow_name} 和 {wf2_node.workflow_name}",
                implementation_plan={
                    "type": "resource_sharing",
                    "workflows": [wf1_id, wf2_id],
                    "shared_resources": self._identify_shared_resources(
                        wf1_node.resources_required,
                        wf2_node.resources_required
                    ),
                    "expected_resource_saving": resource_saving
                }
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    def _calculate_resource_similarity(self, res1: Dict[ResourceType, float], 
                                      res2: Dict[ResourceType, float]) -> float:
        """计算资源相似度"""
        if not res1 or not res2:
            return 0.0
        
        # 计算余弦相似度
        all_types = set(res1