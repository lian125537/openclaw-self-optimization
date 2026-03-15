#!/usr/bin/env python3
"""
🎯 防循环保护系统 - 自动检测和终止无限对话循环
史蒂夫·乔布斯标准: "保持饥饿，保持愚蠢，但对成本保持警惕"
"""

import json
import hashlib
from collections import deque
from datetime import datetime, timedelta
import logging

class AntiLoopProtector:
    """防止AI对话无限循环的守护者"""
    
    def __init__(self, max_repetitions: int = 3, time_window_seconds: int = 300):
        """
        参数:
            max_repetitions: 允许的最大重复次数
            time_window_seconds: 检测重复的时间窗口
        """
        self.max_repetitions = max_repetitions
        self.time_window = timedelta(seconds=time_window_seconds)
        
        # 存储用户消息的历史
        self.user_message_history = deque(maxlen=50)
        # 存储助手响应的历史  
        self.assistant_response_history = deque(maxlen=50)
        
        # 消息去重缓存 (哈希值 → 时间戳)
        self.message_cache = {}
        
        # 重复检测计数器
        self.repetition_counts = {}
        
        # 日志记录
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def hash_message(self, content: str, role: str) -> str:
        """生成消息哈希值用于去重检测"""
        # 提取关键内容 - 去除时间戳、ID等变化部分
        simplified = f"{role}:{content[:100]}"  # 只取前100字符防止过长文本差异
        return hashlib.md5(simplified.encode()).hexdigest()
    
    def detect_loop(self, message_content: str, role: str) -> dict:
        """
        检测对话是否进入循环
        
        返回:
            {
                "in_loop": bool,
                "reason": str, 
                "repetition_count": int,
                "suggested_action": str
            }
        """
        current_time = datetime.now()
        message_hash = self.hash_message(message_content, role)
        
        # 更新历史记录
        if role == "user":
            self.user_message_history.append({
                "content": message_content,
                "hash": message_hash,
                "timestamp": current_time
            })
        elif role == "assistant":
            self.assistant_response_history.append({
                "content": message_content,
                "hash": message_hash,
                "timestamp": current_time
            })
        
        # 检查重复次数
        if message_hash in self.repetition_counts:
            self.repetition_counts[message_hash]["count"] += 1
            self.repetition_counts[message_hash]["last_seen"] = current_time
        else:
            self.repetition_counts[message_hash] = {
                "count": 1,
                "first_seen": current_time,
                "last_seen": current_time
            }
        
        # 清理旧记录
        self._clean_old_records(current_time)
        
        count_info = self.repetition_counts[message_hash]
        repetition_count = count_info["count"]
        
        # 检测循环条件
        if repetition_count >= self.max_repetitions:
            time_since_first = (current_time - count_info["first_seen"]).total_seconds()
            
            # 快速重复(高频循环)
            if time_since_first < 60:  # 1分钟内重复多次
                return {
                    "in_loop": True,
                    "reason": f"高频重复检测: {role} 消息 '{content_preview(message_content)}' 在 {time_since_first:.1f}秒内重复了{repetition_count}次",
                    "repetition_count": repetition_count,
                    "frequency": f"{repetition_count/time_since_first:.2f}次/秒",
                    "suggested_action": "立即终止对话，启动冷却模式"
                }
            
            # 持续重复(低频但长时循环)
            elif time_since_first < self.time_window.total_seconds():
                return {
                    "in_loop": True,
                    "reason": f"持续重复检测: {role} 消息在 {time_since_first:.1f}秒内重复{repetition_count}次",
                    "repetition_count": repetition_count,
                    "frequency": f"{repetition_count/time_since_first * 60:.2f}次/分钟",
                    "suggested_action": "提示用户异常，建议重置对话"
                }
        
        # 检查助手重复响应
        if role == "assistant":
            # 获取最近10条助手消息
            recent_responses = list(self.assistant_response_history)[-10:] if len(self.assistant_response_history) >= 10 else list(self.assistant_response_history)
            recent_hashes = [resp["hash"] for resp in recent_responses]
            
            # 如果最近10条中有8条以上相同
            if len(set(recent_hashes)) == 1 and len(recent_hashes) >= 8:
                return {
                    "in_loop": True,
                    "reason": f"助手响应模式锁定: 最近{len(recent_hashes)}条消息完全相同",
                    "repetition_count": len(recent_hashes),
                    "frequency": "响应模式固定",
                    "suggested_action": "切换响应策略，添加随机性"
                }
        
        return {
            "in_loop": False,
            "reason": None,
            "repetition_count": repetition_count,
            "suggested_action": "正常对话"
        }
    
    def _clean_old_records(self, current_time: datetime):
        """清理过时的记录"""
        # 清理repetition_counts
        hashes_to_remove = []
        for msg_hash, info in self.repetition_counts.items():
            if (current_time - info["last_seen"]) > self.time_window:
                hashes_to_remove.append(msg_hash)
        
        for msg_hash in hashes_to_remove:
            del self.repetition_counts[msg_hash]
    
    def generate_protection_actions(self, loop_detection_result: dict) -> list:
        """基于检测结果生成保护动作"""
        actions = []
        
        if loop_detection_result["in_loop"]:
            severity = "HIGH" if loop_detection_result.get("frequency", "").endswith("次/秒") else "MEDIUM"
            
            actions.append({
                "priority": severity,
                "action": "terminate_conversation",
                "message": f"🔁 检测到对话循环: {loop_detection_result['reason']}"
            })
            
            actions.append({
                "priority": severity,
                "action": "switch_to_economy_model",
                "reason": "检测到循环，切换到免费模型防止成本扩大"
            })
            
            actions.append({
                "priority": "MEDIUM",
                "action": "notify_guardian",
                "data": loop_detection_result
            })
            
            actions.append({
                "priority": "LOW",
                "action": "log_incident",
                "description": f"循环事件已记录: {loop_detection_result['reason']}"
            })
        
        return actions
    
    def simulate_cost_saving(self, loop_detection_count: int) -> dict:
        """估算防止循环的潜在成本节省"""
        # 假设参数
        avg_tokens_per_message = 500  # 每条消息平均Token数
        cost_per_million_tokens = 0.50  # $0.50/百万Token（假设）
        
        # 600万Token事件的基准
        incident_tokens = 6000000
        incident_cost = incident_tokens / 1000000 * cost_per_million_tokens
        
        # 估算保护效果
        prevented_incidents = loop_detection_count
        potential_tokens_saved = incident_tokens * prevented_incidents * 0.7  # 假设防止70%的损失
        
        return {
            "estimated_incidents_prevented": prevented_incidents,
            "potential_tokens_saved": int(potential_tokens_saved),
            "potential_cost_saved": round(potential_tokens_saved / 1000000 * cost_per_million_tokens, 2),
            "current_incident_cost": f"${incident_cost:.2f}",
            "roi_multiplier": round(potential_tokens_saved / incident_tokens, 1) if incident_tokens > 0 else 0
        }


def content_preview(content: str, max_length: int = 50) -> str:
    """内容预览"""
    if not content:
        return "[空内容]"
    if len(content) <= max_length:
        return content
    return content[:max_length] + "..."


# 测试函数
def test_anti_loop_system():
    """测试防循环系统"""
    protector = AntiLoopProtector(max_repetitions=3)
    
    print("[TEST] Anti-loop protection system - Test run")
    print("=" * 60)
    
    # 模拟重复消息
    repeat_message = "请重新加载所有技能"
    
    for i in range(5):
        detection = protector.detect_loop(repeat_message, "user")
        actions = protector.generate_protection_actions(detection)
        
        print(f"消息 {i+1}: '{repeat_message}'")
        print(f"  检测结果: {'循环中' if detection['in_loop'] else '正常'}")
        print(f"  重复次数: {detection['repetition_count']}")
        
        if detection['in_loop']:
            print(f"  原因: {detection['reason']}")
            print(f"  建议动作: {detection['suggested_action']}")
            
            for action in actions:
                print(f"    • {action['priority']}: {action['action']}")
        
        print()
    
    # 成本节省分析
    cost_saving = protector.simulate_cost_saving(5)  # 假设防止了5个事件
    print("💰 成本节省估算:")
    print(f"  预计防止事件: {cost_saving['estimated_incidents_prevented']}")
    print(f"  潜在Token节省: {cost_saving['potential_tokens_saved']:,}")
    print(f"  潜在成本节省: ${cost_saving['potential_cost_saved']}")
    print(f"  ROI倍率: {cost_saving['roi_multiplier']}x")


if __name__ == "__main__":
    test_anti_loop_system()