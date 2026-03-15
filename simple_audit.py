#!/usr/bin/env python3
"""
简化版OpenClaw会话成本审计
仅关注过去24小时内的Token使用统计
"""

import os
import json
import glob
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import re

def parse_iso_timestamp(timestamp_str):
    """解析ISO8601时间戳 - 简化版"""
    try:
        # 移除毫秒部分
        if '.' in timestamp_str:
            timestamp_str = timestamp_str.split('.')[0]
        
        # 检查是否有Z结尾
        if timestamp_str.endswith('Z'):
            timestamp_str = timestamp_str[:-1] + '+00:00'
            
        # 解析
        return datetime.fromisoformat(timestamp_str)
    except Exception as e:
        # 尝试其他格式
        try:
            return datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S')
        except:
            return None

def analyze_sessions():
    """分析所有会话日志"""
    sessions_dir = r"C:\Users\yodat\.openclaw\agents\main\sessions"
    
    # 收集所有jsonl文件
    session_files = []
    for file in glob.glob(os.path.join(sessions_dir, "*.jsonl")):
        if ".deleted." not in file and ".lock" not in file:
            session_files.append(file)
    
    print(f"找到 {len(session_files)} 个会话日志文件")
    
    # 统计最近24小时内（3月14日以后）的数据
    cutoff_time = datetime.now() - timedelta(hours=72)  # 放宽到72小时
    
    total_tokens = 0
    total_messages = 0
    model_usage = Counter()
    tool_usage = Counter()
    session_stats = []
    
    for session_file in session_files:
        session_id = os.path.basename(session_file)[:8]
        try:
            with open(session_file, 'r', encoding='utf-8', errors='ignore') as f:
                session_tokens = 0
                session_messages = 0
                session_models = set()
                session_tools = Counter()
                
                for line_num, line in enumerate(f, 1):
                    try:
                        if not line.strip():
                            continue
                            
                        event = json.loads(line.strip())
                        event_type = event.get("type")
                        
                        # 只分析最近的活跃会话
                        timestamp_str = event.get("timestamp")
                        if timestamp_str:
                            event_time = parse_iso_timestamp(timestamp_str)
                            if event_time and event_time < cutoff_time:
                                continue
                        
                        if event_type == "message":
                            message = event.get("message", {})
                            
                            if message.get("role") == "assistant":
                                session_messages += 1
                                usage = message.get("usage", {})
                                
                                if usage:
                                    # 提取Token使用
                                    input_tokens = usage.get("input", 0)
                                    output_tokens = usage.get("output", 0)
                                    total_tokens_event = usage.get("totalTokens", 0)
                                    
                                    # 优先使用totalTokens，或者input+output
                                    event_tokens = total_tokens_event if total_tokens_event > 0 else input_tokens + output_tokens
                                    session_tokens += event_tokens
                                    total_tokens += event_tokens
                                    
                                    # 记录模型使用
                                    model = message.get("model", "unknown")
                                    if model and model != "unknown":
                                        session_models.add(model)
                                        model_usage[model] += event_tokens
                            
                        elif event_type == "toolResult":
                            tool_name = event.get("toolName")
                            if tool_name:
                                session_tools[tool_name] += 1
                                tool_usage[tool_name] += 1
                                
                        elif event_type == "toolCall":
                            # 从toolUse事件中提取信息
                            if "message" in event:
                                message_content = event["message"]
                                if isinstance(message_content, dict) and "content" in message_content:
                                    for content_item in message_content["content"]:
                                        if isinstance(content_item, dict) and content_item.get("type") == "toolCall":
                                            tool_name = content_item.get("name")
                                            if tool_name:
                                                session_tools[tool_name] += 1
                                                tool_usage[tool_name] += 1
                    
                    except json.JSONDecodeError:
                        # 跳过格式错误的行
                        continue
                    except Exception as e:
                        # 跳过其他错误
                        continue
                
                # 如果有活跃的token使用，记录下来
                if session_tokens > 100:  # 只记录有一定token使用的会话
                    session_stats.append({
                        "id": session_id,
                        "tokens": session_tokens,
                        "messages": session_messages,
                        "models": list(session_models),
                        "tools": dict(session_tools)
                    })
                    
                    print(f"会话 {session_id}: {session_tokens:,} tokens, {session_messages} 条消息")
                
        except Exception as e:
            print(f"读取文件 {session_file} 时出错: {e}")
    
    return {
        "total_tokens": total_tokens,
        "total_messages": total_messages,
        "model_usage": model_usage,
        "tool_usage": tool_usage,
        "session_stats": session_stats
    }

def generate_report(data):
    """从分析数据生成报告"""
    report = []
    
    # 计算过去72小时的活跃会话
    total_sessions = len(data["session_stats"])
    
    report.append("# OpenClaw 成本审计报告 (过去72小时)")
    report.append(f"*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    report.append("")
    
    report.append("## 1. 总体统计")
    report.append(f"- 活跃会话数: {total_sessions}")
    report.append(f"- 总消息数: {data['total_messages']}")
    report.append(f"- 总Token消耗: {data['total_tokens']:,}")
    report.append("")
    
    # 按模型统计
    report.append("## 2. 模型使用统计")
    for model, tokens in data["model_usage"].most_common(10):
        report.append(f"- **{model}**: {tokens:,} tokens")
    report.append("")
    
    report.append("## 3. 工具使用统计")
    for tool, count in data["tool_usage"].most_common(10):
        report.append(f"- **{tool}**: {count} 次调用")
    report.append("")
    
    # 消耗最高的会话
    if data["session_stats"]:
        report.append("## 4. 消耗最高的会话")
        # 按token消耗排序
        top_sessions = sorted(data["session_stats"], key=lambda x: x["tokens"], reverse=True)[:10]
        
        for i, session in enumerate(top_sessions[:5], 1):
            models = ", ".join(session["models"]) or "unknown"
            top_tools = ", ".join([f"{k}({v})" for k, v in sorted(session["tools"].items(), key=lambda x: x[1], reverse=True)[:3]])
            
            report.append(f"### 第{i}名: {session['id']}")
            report.append(f"- Token数: {session['tokens']:,}")
            report.append(f"- 消息数: {session['messages']}")
            report.append(f"- 使用模型: {models}")
            if top_tools:
                report.append(f"- 常用工具: {top_tools}")
            report.append("")
    
    report.append("## 5. Steve Jobs 成本洞察")
    report.append("### 🔍 审计关键发现:")
    report.append("1. **Token使用效率** - 检查是否有循环调用或不必要的工具使用")
    report.append("2. **模型选择优化** - DeepSeek-V3可能是主要成本来源")
    report.append("3. **会话生命周期** - 长时间的会话可能导致token累积")
    report.append("")
    
    report.append("### 💡 乔布斯式建议:")
    report.append("1. **简化工作流程** - '简单是终极的复杂' - 减少不必要的工具调用")
    report.append("2. **批量处理** - 聚合任务以减少模型调用次数")
    report.append("3. **定期清理** - 关闭不再使用的会话")
    report.append("4. **成本意识** - '保持饥饿，保持节俭' - 监控高成本会话")
    report.append("")
    
    report.append("## 6. 潜在问题检查")
    report.append("### ❗ 需要关注:")
    report.append("1. **心跳循环** - 检查是否有频繁的HEARTBEAT_CHECK或定期cron任务")
    report.append("2. **内存泄漏问题** - 检查是否有工具调用失败导致的重试循环")
    report.append("3. **长会话成本** - 识别运行时间超长的会话")
    
    return "\n".join(report)

def main():
    print("[INFO] 史蒂夫·乔布斯成本审计模式启动...")
    print("[INFO] 正在分析会话日志...")
    
    # 分析数据
    analysis_data = analyze_sessions()
    
    # 生成报告
    report = generate_report(analysis_data)
    
    # 保存报告
    report_filename = r"C:\Users\yodat\.openclaw\workspace\.learnings\COST_AUDIT.md"
    os.makedirs(os.path.dirname(report_filename), exist_ok=True)
    
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"[SUCCESS] 成本审计报告已保存到: {report_filename}")
    print("")
    print("📊 关键统计摘要:")
    print(f"   总Token消耗: {analysis_data['total_tokens']:,}")
    print(f"   活跃会话数: {len(analysis_data['session_stats'])}")
    print(f"   模型种类: {len(analysis_data['model_usage'])}")
    print(f"   工具种类: {len(analysis_data['tool_usage'])}")
    
    return analysis_data

if __name__ == "__main__":
    main()