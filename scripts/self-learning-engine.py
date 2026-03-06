#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自我学习引擎
基于强化学习和反馈循环的持续优化系统
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LearningDomain(Enum):
    """学习领域"""
    EXECUTION = "execution"  # 执行优化
    SCHEDULING = "scheduling"  # 调度优化
    RESOURCE = "resource"  # 资源优化
    RELIABILITY = "reliability"  # 可靠性优化
    COLLABORATION = "collaboration"  # 协作优化

@dataclass
class LearningExperience:
    """学习经验"""
    domain: LearningDomain
    state: Dict[str, Any]  # 执行前状态
    action: Dict[str, Any]  # 采取的行动
    reward: float  # 奖励值（-1 到 1）
    next_state: Dict[str, Any]  # 执行后状态
    timestamp: datetime
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['domain'] = self.domain.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class OptimizationPolicy:
    """优化策略"""
    domain: LearningDomain
    policy_id: str
    conditions: Dict[str, Any]  # 触发条件
    actions: List[Dict[str, Any]]  # 执行动作
    confidence: float  # 置信度 (0-1)
    success_rate: float  # 成功率 (0-1)
    last_updated: datetime
    usage_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['domain'] = self.domain.value
        data['last_updated'] = self.last_updated.isoformat()
        return data

class SelfLearningEngine:
    """自我学习引擎"""
    
    def __init__(self, knowledge_base_path: str = "data/knowledge-base.db"):
        self.knowledge_base_path = knowledge_base_path
        self.conn = None
        self.policies: Dict[str, OptimizationPolicy] = {}
        self.setup_knowledge_base()
        self.load_policies()
    
    def setup_knowledge_base(self):
        """设置知识库"""
        try:
            self.conn = sqlite3.connect(self.knowledge_base_path)
            self._create_tables()
            logger.info(f"Connected to knowledge base: {self.knowledge_base_path}")
        except Exception as e:
            logger.error(f"Failed to connect to knowledge base: {e}")
            raise
    
    def _create_tables(self):
        """创建数据表"""
        cursor = self.conn.cursor()
        
        # 学习经验表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_experiences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT NOT NULL,
            state_json TEXT NOT NULL,
            action_json TEXT NOT NULL,
            reward REAL NOT NULL,
            next_state_json TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            metadata_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 优化策略表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS optimization_policies (
            policy_id TEXT PRIMARY KEY,
            domain TEXT NOT NULL,
            conditions_json TEXT NOT NULL,
            actions_json TEXT NOT NULL,
            confidence REAL NOT NULL,
            success_rate REAL NOT NULL,
            last_updated TIMESTAMP NOT NULL,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 性能指标表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            domain TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            context_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 反馈循环表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback_loops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_id TEXT NOT NULL,
            feedback_type TEXT NOT NULL,
            feedback_value REAL NOT NULL,
            context_json TEXT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            processed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policy_id) REFERENCES optimization_policies (policy_id)
        )
        """)
        
        self.conn.commit()
    
    def load_policies(self):
        """加载优化策略"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT * FROM optimization_policies")
            rows = cursor.fetchall()
            
            for row in rows:
                policy = OptimizationPolicy(
                    domain=LearningDomain(row[1]),
                    policy_id=row[0],
                    conditions=json.loads(row[2]),
                    actions=json.loads(row[3]),
                    confidence=row[4],
                    success_rate=row[5],
                    last_updated=datetime.fromisoformat(row[6]),
                    usage_count=row[7]
                )
                self.policies[policy.policy_id] = policy
            
            logger.info(f"Loaded {len(self.policies)} optimization policies")
            
        except Exception as e:
            logger.error(f"Error loading policies: {e}")
    
    def record_experience(self, experience: LearningExperience):
        """记录学习经验"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
            INSERT INTO learning_experiences 
            (domain, state_json, action_json, reward, next_state_json, timestamp, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                experience.domain.value,
                json.dumps(experience.state),
                json.dumps(experience.action),
                experience.reward,
                json.dumps(experience.next_state),
                experience.timestamp.isoformat(),
                json.dumps(experience.metadata) if experience.metadata else None
            ))
            self.conn.commit()
            logger.info(f"Recorded experience for domain: {experience.domain.value}")
            
            # 触发学习更新
            self._update_learning(experience)
            
        except Exception as e:
            logger.error(f"Error recording experience: {e}")
    
    def _update_learning(self, experience: LearningExperience):
        """基于经验更新学习"""
        # 1. 更新相关策略的置信度和成功率
        relevant_policies = self._find_relevant_policies(experience)
        
        for policy in relevant_policies:
            # 计算新的置信度和成功率
            new_confidence = self._calculate_new_confidence(policy, experience)
            new_success_rate = self._calculate_new_success_rate(policy, experience)
            
            # 更新策略
            policy.confidence = new_confidence
            policy.success_rate = new_success_rate
            policy.last_updated = datetime.now()
            policy.usage_count += 1
            
            # 保存更新
            self._save_policy(policy)
            
            logger.info(f"Updated policy {policy.policy_id}: "
                       f"confidence={new_confidence:.3f}, success_rate={new_success_rate:.3f}")
        
        # 2. 如果奖励很高，考虑创建新策略
        if experience.reward > 0.7:  # 高奖励
            self._create_new_policy_from_experience(experience)
        
        # 3. 如果奖励很低，考虑调整或废弃策略
        if experience.reward < -0.5:  # 低奖励
            self._adjust_or_retire_policies(experience)
    
    def _find_relevant_policies(self, experience: LearningExperience) -> List[OptimizationPolicy]:
        """找到相关的策略"""
        relevant = []
        
        for policy in self.policies.values():
            if policy.domain != experience.domain:
                continue
            
            # 检查条件匹配度
            match_score = self._calculate_match_score(policy.conditions, experience.state)
            if match_score > 0.6:  # 匹配度阈值
                relevant.append(policy)
        
        return relevant
    
    def _calculate_match_score(self, conditions: Dict[str, Any], state: Dict[str, Any]) -> float:
        """计算条件匹配度"""
        if not conditions:
            return 0.0
        
        matches = 0
        total = len(conditions)
        
        for key, expected_value in conditions.items():
            if key in state:
                actual_value = state[key]
                
                # 简单匹配逻辑，可以根据需要扩展
                if isinstance(expected_value, (int, float)):
                    # 数值范围匹配
                    if isinstance(actual_value, (int, float)):
                        if abs(actual_value - expected_value) / (expected_value + 1e-10) < 0.1:
                            matches += 1
                elif expected_value == actual_value:
                    matches += 1
        
        return matches / total if total > 0 else 0.0
    
    def _calculate_new_confidence(self, policy: OptimizationPolicy, experience: LearningExperience) -> float:
        """计算新的置信度"""
        # 基于奖励和匹配度更新置信度
        match_score = self._calculate_match_score(policy.conditions, experience.state)
        reward_factor = (experience.reward + 1) / 2  # 将奖励从 [-1,1] 映射到 [0,1]
        
        # 置信度更新公式
        learning_rate = 0.1  # 学习率
        new_confidence = policy.confidence * (1 - learning_rate) + match_score * reward_factor * learning_rate
        
        return max(0.0, min(1.0, new_confidence))
    
    def _calculate_new_success_rate(self, policy: OptimizationPolicy, experience: LearningExperience) -> float:
        """计算新的成功率"""
        # 基于奖励更新成功率
        is_success = 1 if experience.reward > 0 else 0
        
        # 指数移动平均
        alpha = 0.1  # 平滑因子
        new_success_rate = policy.success_rate * (1 - alpha) + is_success * alpha
        
        return new_success_rate
    
    def _create_new_policy_from_experience(self, experience: LearningExperience):
        """从经验创建新策略"""
        try:
            # 生成策略ID
            policy_id = f"{experience.domain.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # 从经验中提取条件和动作
            conditions = self._extract_conditions_from_state(experience.state)
            actions = [experience.action]
            
            # 创建新策略
            policy = OptimizationPolicy(
                domain=experience.domain,
                policy_id=policy_id,
                conditions=conditions,
                actions=actions,
                confidence=0.7,  # 初始置信度
                success_rate=0.8,  # 初始成功率
                last_updated=datetime.now(),
                usage_count=1
            )
            
            # 保存策略
            self._save_policy(policy)
            self.policies[policy_id] = policy
            
            logger.info(f"Created new policy {policy_id} from positive experience")
            
        except Exception as e:
            logger.error(f"Error creating new policy: {e}")
    
    def _extract_conditions_from_state(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """从状态中提取条件"""
        conditions = {}
        
        # 提取关键指标作为条件
        key_metrics = ['execution_time', 'success_rate', 'resource_usage', 'queue_length']
        
        for metric in key_metrics:
            if metric in state:
                value = state[metric]
                
                # 根据指标类型创建条件
                if isinstance(value, (int, float)):
                    # 创建范围条件
                    conditions[f"{metric}_min"] = value * 0.9
                    conditions[f"{metric}_max"] = value * 1.1
                else:
                    conditions[metric] = value
        
        return conditions
    
    def _adjust_or_retire_policies(self, experience: LearningExperience):
        """调整或废弃策略"""
        relevant_policies = self._find_relevant_policies(experience)
        
        for policy in relevant_policies:
            if policy.confidence < 0.3:  # 置信度过低
                # 废弃策略
                self._retire_policy(policy)
                logger.info(f"Retired policy {policy.policy_id} due to low confidence")
            elif policy.success_rate < 0.4:  # 成功率过低
                # 调整策略
                self._adjust_policy(policy, experience)
                logger.info(f"Adjusted policy {policy.policy_id} due to low success rate")
    
    def _retire_policy(self, policy: OptimizationPolicy):
        """废弃策略"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM optimization_policies WHERE policy_id = ?", (policy.policy_id,))
            self.conn.commit()
            
            # 从内存中移除
            if policy.policy_id in self.policies:
                del self.policies[policy.policy_id]
                
        except Exception as e:
            logger.error(f"Error retiring policy: {e}")
    
    def _adjust_policy(self, policy: OptimizationPolicy, experience: LearningExperience):
        """调整策略"""
        # 基于负面经验调整策略条件
        # 这里可以实现更复杂的调整逻辑
        policy.conditions = self._relax_conditions(policy.conditions)
        policy.last_updated = datetime.now()
        
        self._save_policy(policy)
    
    def _relax_conditions(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """放宽条件"""
        relaxed = conditions.copy()
        
        for key, value in conditions.items():
            if key.endswith('_min') and isinstance(value, (int, float)):
                relaxed[key] = value * 0.9  # 降低下限
            elif key.endswith('_max') and isinstance(value, (int, float)):
                relaxed[key] = value * 1.1  # 提高上限
        
        return relaxed
    
    def _save_policy(self, policy: OptimizationPolicy):
        """保存策略"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO optimization_policies 
            (policy_id, domain, conditions_json, actions_json, confidence, success_rate, last_updated, usage_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                policy.policy_id,
                policy.domain.value,
                json.dumps(policy.conditions),
                json.dumps(policy.actions),
                policy.confidence,
                policy.success_rate,
                policy.last_updated.isoformat(),
                policy.usage_count
            ))
            self.conn.commit()
            
        except Exception as e:
            logger.error(f"Error saving policy: {e}")
    
    def get_optimization_recommendations(self, domain: LearningDomain, 
                                        current_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取优化建议"""
        recommendations = []
        
        for policy in self.policies.values():
            if policy.domain != domain:
                continue
            
            # 检查条件匹配
            match_score = self._calculate_match_score(policy.conditions, current_state)
            
            if match_score > 0.7 and policy.confidence > 0.6:
                recommendation = {
                    "policy_id": policy.policy_id,
                    "domain": domain.value,
                    "actions": policy.actions,
                    "confidence": policy.confidence,
                    "success_rate": policy.success_rate,
                    "match_score": match_score,
                    "priority": policy.confidence * match_score
                }
                recommendations.append(recommendation)
        
        # 按优先级排序
        recommendations.sort(key=lambda x: x["priority"], reverse=True)
        
        return recommendations[:5]  # 返回前5个建议
    
    def record_feedback(self, policy_id: str, feedback_type: str, 
                       feedback_value: float, context: Dict[str, Any]):
        """记录反馈"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
            INSERT INTO feedback_loops 
            (policy_id, feedback_type, feedback_value, context_json, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """, (
                policy_id,
                feedback_type,
                feedback_value,
                json.dumps(context),
                datetime.now().isoformat()
            ))
            self.conn.commit()
            logger.info(f"Recorded feedback for policy {policy_id}")
            
        except Exception as e:
            logger.error(f"Error recording feedback: {e}")
    
    def process_feedback_loops(self):
        """处理反馈循环"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
            SELECT * FROM feedback_loops 
            WHERE processed = 0 
            ORDER BY timestamp
            """)
            feedbacks = cursor.fetchall()
            
            for feedback in feedbacks:
                self._process_single_feedback(feedback)
                
                # 标记为已处理
                cursor.execute("UPDATE feedback_loops SET processed = 1 WHERE id = ?", (feedback[0],))
            
            self.conn.commit()
            logger.info(f"Processed {len(feedbacks)} feedback loops")
            
        except Exception as e:
            logger.error(f"Error processing feedback loops: {e}")
    
    def _process_single_feedback(self, feedback: Tuple):
        """处理单个反馈"""
        feedback_id, policy_id, feedback_type, feedback_value, context_json, timestamp, processed, created_at = feedback
        
        # 根据反馈类型更新学习
        if feedback_type == "success":
            # 成功反馈，增强相关策略
            self._reinforce_policy(policy_id, feedback_value)
        elif feedback_type == "failure":
            # 失败反馈，减弱相关策略
            self._weaken_p