#!/usr/bin/env python3
"""
OpenClaw 会话成本审计分析工具
Steve Jobs 成本审计模式启动
统计过去24小时的模型调用、Token消耗、工具使用情况
"""

import os
import json
import glob
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import statistics

def parse_iso_timestamp(timestamp_str):
    """解析ISO8601时间戳"""
    try:
        # 移除毫秒部分，然后解析
        if '.' in timestamp_str and 'Z' in timestamp_str:
            timestamp_str = timestamp_str.split('.')[0] + 'Z'
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except Exception as e:
        print(f"无法解析时间戳 {timestamp_str}: {e}")
        return None

def calculate_cost(tokens, model_name, provider):
    """估算Token成本（简化版）"""
    # 不同模型的估算成本（每百万token的美元成本）
    cost_rates = {
        "DeepSeek-V3.2": {"input": 0.14, "output": 0.56},  # 假设值
        "gpt-4": {"input": 10.0, "output": 30.0},
        "claude-3": {"input": 3.0, "output": 15.0},
        "gemini": {"input": 0.35, "output": 1.05},
        "default": {"input": 1.0, "output": 4.0}
    }
    
    model_key = model_name if model_name in cost_rates else "default"
    rate = cost_rates.get(model_key, cost_rates["default"])
    
    # 这里简化计算，实际需要区分输入/输出token
    total_tokens = tokens.get("totalTokens", 0) or tokens.get("input", 0) + tokens.get("output", 0)
    input_tokens = tokens.get("input", int(total_tokens * 0.8))  # 估算输入占80%
    output_tokens = tokens.get("output", int(total_tokens * 0.2))  # 估算输出占20%
    
    cost = (input_tokens / 1_000_000 * rate["input"]) + (output_tokens / 1_000_000 * rate["output"])
    return cost

def analyze_session_log(log_file):
    """分析单个会话日志文件"""
    session_data = {
        "session_id": os.path.basename(log_file).replace('.jsonl', ''),
        "total_messages": 0,
        "total_tokens": 0,
        "cost_estimate": 0,
        "models_used": set(),
        "tools_used": Counter(),
        "message_timestamps": [],
        "token_breakdown": defaultdict(int),
        "model_usage": Counter()
    }
    
    print(f"正在分析会话文件: {log_file}")
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    event = json.loads(line.strip())
                    event_type = event.get("type")
                    timestamp = parse_iso_timestamp(event.get("timestamp"))
                    
                    # 只分析最近24小时的事件
                    if timestamp:
                        cutoff_time = datetime.now() - timedelta(hours=24)
                        if timestamp < cutoff_time:
                            continue
                    
                    # 分析不同类型的日志事件
                    if event_type == "message":
                        session_data["total_messages"] += 1
                        
                        message = event.get("message", {})
                        if message.get("role") == "assistant":
                            usage = message.get("usage", {})
                            if usage:
                                input_tokens = usage.get("input", 0)
                                output_tokens = usage.get("output", 0)
                                total_tokens = usage.get("totalTokens", input_tokens + output_tokens)
                                
                                session_data["total_tokens"] += total_tokens
                                model = message.get("model", "unknown")
                                session_data["models_used"].add(model)
                                
                                # 按模型统计token使用
                                session_data["model_usage"][model] += total_tokens
                                
                                # 记录token明细
                                session_data["token_breakdown"]["input"] += input_tokens
                                session_data["token_breakdown"]["output"] += output_tokens
                            
                            if timestamp:
                                session_data["message_timestamps"].append(timestamp)
                    
                    elif event_type == "toolUse":
                        # 从toolCall事件统计工具使用
                        if "message" in event:
                            tool_call = event["message"].get("content", [])
                            for content in tool_call:
                                if isinstance(content, dict) and content.get("type") == "toolCall":
                                    tool_name = content.get("name")
                                    if tool_name:
                                        session_data["tools_used"][tool_name] += 1
                    
                    elif event_type == "toolResult":
                        tool_name = event.get("toolName")
                        if tool_name:
                            session_data["tools_used"][tool_name] += 1
                            
                except json.JSONDecodeError as e:
                    print(f"  行 {line_num}: JSON解析错误 - {e}")
                    continue
                except Exception as e:
                    print(f"  行 {line_num}: 错误 - {e}")
                    continue
        
        # 计算成本估算
        if session_data["total_tokens"] > 0:
            # 使用最常见的模型进行成本估算
            most_common_model = max(session_data["model_usage"], key=session_data["model_usage"].get) if session_data["model_usage"] else "DeepSeek-V3.2"
            tokens_dict = {
                "totalTokens": session_data["total_tokens"],
                "input": session_data["token_breakdown"]["input"],
                "output": session_data["token_breakdown"]["output"]
            }
            session_data["cost_estimate"] = calculate_cost(tokens_dict, most_common_model, "unknown")
            
    except Exception as e:
        print(f"分析文件 {log_file} 时出错: {e}")
    
    return session_data

def generate_report(sessions_data):
    """生成审计报告"""
    report = []
    
    # 总体统计
    total_sessions = len(sessions_data)
    total_messages = sum(s["total_messages"] for s in sessions_data)
    total_tokens = sum(s["total_tokens"] for s in sessions_data)
    total_cost = sum(s["cost_estimate"] for s in sessions_data)
    
    # 按模型统计
    model_stats = defaultdict(lambda: {"tokens": 0, "sessions": set(), "cost": 0})
    for session in sessions_data:
        for model, tokens in session["model_usage"].items():
            model_stats[model]["tokens"] += tokens
            model_stats[model]["sessions"].add(session["session_id"])
    
    # 按工具统计
    tool_stats = Counter()
    for session in sessions_data:
        for tool, count in session["tools_used"].items():
            tool_stats[tool] += count
    
    # 找出消耗最高的会话
    top_sessions = sorted(sessions_data, key=lambda x: x["total_tokens"], reverse=True)[:5]
    
    report.append("# OpenClaw 成本审计报告")
    report.append(f"*生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    report.append(f"*审计周期: 过去24小时*")
    report.append("")
    
    report.append("## 1. 总体统计")
    report.append(f"- 分析会话数: {total_sessions}")
    report.append(f"- 总消息数: {total_messages}")
    report.append(f"- 总Token消耗: {total_tokens:,}")
    report.append(f"- 预估总成本: ${total_cost:.4f}")
    report.append("")
    
    report.append("## 2. 模型使用统计")
    for model, stats in sorted(model_stats.items(), key=lambda x: x[1]["tokens"], reverse=True):
        sessions_count = len(stats["sessions"])
        report.append(f"### {model}")
        report.append(f"- Token消耗: {stats['tokens']:,}")
        report.append(f"- 使用会话数: {sessions_count}")
        report.append(f"- 平均每会话: {stats['tokens'] // max(1, sessions_count):,} tokens")
        report.append("")
    
    report.append("## 3. 工具使用统计")
    for tool, count in tool_stats.most_common(10):
        report.append(f"- **{tool}**: {count} 次调用")
    report.append("")
    
    report.append("## 4. 消耗最高的Top 5会话")
    for i, session in enumerate(top_sessions, 1):
        models_list = ", ".join(session["models_used"])
        tools_list = ", ".join([f"{tool}({count})" for tool, count in session["tools_used"].most_common(3)])
        
        report.append(f"### 第{i}名: {session['session_id'][:8]}...")
        report.append(f"- 总Token数: {session['total_tokens']:,}")
        report.append(f"- 预估成本: ${session['cost_estimate']:.4f}")
        report.append(f"- 消息数量: {session['total_messages']}")
        report.append(f"- 使用模型: {models_list}")
        report.append(f"- 常用工具: {tools_list}")
        report.append("")
    
    report.append("## 5. 审计发现与建议")
    report.append("### 🤖 Steve Jobs 洞察:")
    report.append("1. **成本意识** - '创新不应该是浪费'")
    report.append("2. **效率优先** - 检查是否有重复或不必要的工具调用")
    report.append("3. **设计优化** - 心跳循环可能导致不必要的API调用")
    report.append("4. **简化系统** - 考虑合并相似功能的技能")
    report.append("")
    
    report.append("### 🔍 潜在问题:")
    report.append("1. 检查心跳循环调用（HEARTBEAT_CHECK可能过于频繁）")
    report.append("2. 高频工具调用（如read、exec）可能表示低效的工作流程")
    report.append("3. 多个会话同时运行可能导致重复计算")
    report.append("")
    
    report.append("### 💡 优化建议:")
    report.append("1. **会话合并** - 考虑将短任务合并到同一个会话中")
    report.append("2. **工具缓存** - 对于频繁读取的文件使用缓存机制")
    report.append("3. **心跳频率** - 调整心跳检查的频率")
    report.append("4. **模型选择** - 为简单任务选择更经济的模型")
    
    return "\n".join(report)

def main():
    """主函数"""
    print("[START] Steve Jobs 成本审计模式启动...")
    print("[INFO] 正在分析会话日志...")
    
    # 会话日志路径
    sessions_dir = r"C:\Users\yodat\.openclaw\agents\main\sessions"
    
    # 收集所有jsonl文件（排除.deleted文件和lock文件）
    session_files = []
    for file in glob.glob(os.path.join(sessions_dir, "*.jsonl")):
        if ".deleted." not in file and ".lock" not in file:
            session_files.append(file)
    
    print(f"找到 {len(session_files)} 个会话文件")
    
    # 分析每个会话
    all_sessions_data = []
    
    for i, session_file in enumerate(session_files, 1):
        print(f"进程: {i}/{len(session_files)} - {os.path.basename(session_file)}")
        session_data = analyze_session_log(session_file)
        if session_data["total_tokens"] > 0:
            all_sessions_data.append(session_data)
    
    print(f"分析完成，找到 {len(all_sessions_data)} 个有效会话")
    
    # 生成报告
    report = generate_report(all_sessions_data)
    
    # 保存报告
    report_filename = r"C:\Users\yodat\.openclaw\workspace\.learnings\COST_AUDIT.md"
    os.makedirs(os.path.dirname(report_filename), exist_ok=True)
    
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"[SUCCESS] 审计报告已生成: {report_filename}")
    
    # 输出关键统计
    total_tokens = sum(s["total_tokens"] for s in all_sessions_data)
    total_cost = sum(s["cost_estimate"] for s in all_sessions_data)
    print(f"\n[STATS] 关键统计:")
    print(f"   总Token消耗: {total_tokens:,}")
    print(f"   预估总成本: ${total_cost:.4f}")
    print(f"   会话数量: {len(session_files)}")
    
    return all_sessions_data

if __name__ == "__main__":
    main()