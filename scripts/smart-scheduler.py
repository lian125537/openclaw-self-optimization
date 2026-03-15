#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能调度器
基于历史数据优化工作流触发时间
"""

import json
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import argparse

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SmartScheduler:
    """智能调度器"""
    
    def __init__(self, metrics_db: str = "data/performance-metrics.db"):
        self.metrics_db = metrics_db
        self.conn = None
        self.setup_database()
    
    def setup_database(self):
        """设置数据库"""
        try:
            self.conn = sqlite3.connect(self.metrics_db)
            self._create_tables()
            logger.info(f"Connected to metrics database: {self.metrics_db}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def _create_tables(self):
        """创建数据表"""
        cursor = self.conn.cursor()
        
        # 执行历史表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS execution_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            workflow_name TEXT NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            duration REAL NOT NULL,
            success_rate REAL NOT NULL,
            parallel_efficiency REAL,
            trigger_type TEXT NOT NULL,
            runner_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 技能安装详情表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_installations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            execution_id INTEGER,
            skill_name TEXT NOT NULL,
            status TEXT NOT NULL,
            duration REAL NOT NULL,
            retry_count INTEGER DEFAULT 0,
            error_message TEXT,
            installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (execution_id) REFERENCES execution_history (id)
        )
        """)
        
        # 性能趋势表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS performance_trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            avg_duration REAL NOT NULL,
            avg_success_rate REAL NOT NULL,
            total_executions INTEGER NOT NULL,
            peak_hour INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 优化建议表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS optimization_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            suggestion_type TEXT NOT NULL,
            description TEXT NOT NULL,
            priority INTEGER NOT NULL,
            expected_impact REAL,
            implemented BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        self.conn.commit()
    
    def analyze_execution_patterns(self) -> Dict[str, Any]:
        """分析执行模式"""
        try:
            # 读取历史数据
            query = """
            SELECT 
                strftime('%H', start_time) as hour,
                COUNT(*) as execution_count,
                AVG(duration) as avg_duration,
                AVG(success_rate) as avg_success_rate,
                AVG(parallel_efficiency) as avg_efficiency
            FROM execution_history
            WHERE start_time > datetime('now', '-30 days')
            GROUP BY hour
            ORDER BY hour
            """
            
            df = pd.read_sql_query(query, self.conn)
            
            if df.empty:
                return {"error": "No historical data available"}
            
            # 找到最佳执行时间（最短执行时间 + 最高成功率）
            df['composite_score'] = (1 / df['avg_duration']) * df['avg_success_rate']
            best_hour = df.loc[df['composite_score'].idxmax()]
            
            # 分析趋势
            trend_query = """
            SELECT 
                date(start_time) as date,
                AVG(duration) as avg_duration,
                AVG(success_rate) as avg_success_rate
            FROM execution_history
            WHERE start_time > datetime('now', '-7 days')
            GROUP BY date(start_time)
            ORDER BY date
            """
            
            trend_df = pd.read_sql_query(trend_query, self.conn)
            
            analysis = {
                "best_execution_hour": int(best_hour['hour']),
                "best_hour_metrics": {
                    "execution_count": int(best_hour['execution_count']),
                    "avg_duration": float(best_hour['avg_duration']),
                    "avg_success_rate": float(best_hour['avg_success_rate']),
                    "avg_efficiency": float(best_hour['avg_efficiency'])
                },
                "hourly_distribution": df.to_dict('records'),
                "weekly_trend": trend_df.to_dict('records'),
                "peak_hours": self._identify_peak_hours(df),
                "optimal_schedule": self._calculate_optimal_schedule(df)
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing execution patterns: {e}")
            return {"error": str(e)}
    
    def _identify_peak_hours(self, df: pd.DataFrame) -> List[int]:
        """识别高峰时段"""
        if df.empty:
            return []
        
        # 找到执行次数最多的3个小时
        peak_hours = df.nlargest(3, 'execution_count')['hour'].astype(int).tolist()
        return peak_hours
    
    def _calculate_optimal_schedule(self, df: pd.DataFrame) -> Dict[str, Any]:
        """计算最优调度计划"""
        if df.empty:
            return {"error": "No data available"}
        
        # 基于多个因素计算最优时间
        factors = {
            'duration_weight': 0.4,      # 执行时间权重
            'success_weight': 0.4,       # 成功率权重
            'efficiency_weight': 0.2     # 并行效率权重
        }
        
        # 归一化数据
        df_normalized = df.copy()
        for col in ['avg_duration', 'avg_success_rate', 'avg_efficiency']:
            if col in df.columns:
                if col == 'avg_duration':
                    # 持续时间越短越好，所以取倒数
                    df_normalized[col] = 1 / df[col]
                # 其他指标已经是越高越好
        
        # 计算综合得分
        df_normalized['composite_score'] = (
            df_normalized.get('avg_duration', 0) * factors['duration_weight'] +
            df_normalized.get('avg_success_rate', 0) * factors['success_weight'] +
            df_normalized.get('avg_efficiency', 0) * factors['efficiency_weight']
        )
        
        # 找到最优时间
        optimal_hour = df_normalized.loc[df_normalized['composite_score'].idxmax()]
        
        # 生成调度建议
        schedule = {
            "optimal_hour": int(optimal_hour['hour']),
            "optimal_time_utc": f"{int(optimal_hour['hour'])}:00 UTC",
            "optimal_time_local": self._convert_utc_to_local(int(optimal_hour['hour'])),
            "score_breakdown": {
                "duration_score": float(optimal_hour.get('avg_duration', 0)),
                "success_score": float(optimal_hour.get('avg_success_rate', 0)),
                "efficiency_score": float(optimal_hour.get('avg_efficiency', 0)),
                "composite_score": float(optimal_hour['composite_score'])
            },
            "recommended_frequency": self._recommend_frequency(df),
            "avoid_hours": self._identify_avoid_hours(df_normalized)
        }
        
        return schedule
    
    def _convert_utc_to_local(self, utc_hour: int) -> str:
        """UTC 时间转换为本地时间（北京时间）"""
        local_hour = (utc_hour + 8) % 24  # UTC+8
        return f"{local_hour}:00 (UTC+8)"
    
    def _recommend_frequency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """推荐执行频率"""
        total_executions = df['execution_count'].sum()
        avg_daily = total_executions / 30 if len(df) > 0 else 0
        
        if avg_daily < 0.5:
            return {
                "frequency": "weekly",
                "recommendation": "每周执行1-2次",
                "reason": "执行频率较低，建议保持当前频率"
            }
        elif avg_daily < 1:
            return {
                "frequency": "every_3_days",
                "recommendation": "每3天执行一次",
                "reason": "中等执行频率，适合定期维护"
            }
        else:
            return {
                "frequency": "daily",
                "recommendation": "每天执行一次",
                "reason": "高频执行，适合持续集成"
            }
    
    def _identify_avoid_hours(self, df: pd.DataFrame) -> List[int]:
        """识别应避免的时段"""
        if df.empty:
            return []
        
        # 找到得分最低的3个小时
        avoid_hours = df.nsmallest(3, 'composite_score')['hour'].astype(int).tolist()
        return avoid_hours
    
    def generate_cron_schedule(self, analysis: Dict[str, Any]) -> str:
        """生成 cron 表达式"""
        optimal_hour = analysis.get("optimal_schedule", {}).get("optimal_hour", 18)
        
        # 默认：每周一、四的 optimal_hour 点
        cron_expression = f"0 {optimal_hour} * * 1,4"
        
        # 根据频率调整
        frequency = analysis.get("optimal_schedule", {}).get("recommended_frequency", {}).get("frequency")
        
        if frequency == "daily":
            cron_expression = f"0 {optimal_hour} * * *"
        elif frequency == "every_3_days":
            # 每3天执行一次
            cron_expression = f"0 {optimal_hour} */3 * *"
        
        return cron_expression
    
    def generate_optimization_suggestions(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """生成优化建议"""
        suggestions = []
        
        # 基于分析结果生成建议
        best_hour = analysis.get("best_execution_hour", 18)
        current_hour = 18  # 当前设置的UTC 18点
        
        if best_hour != current_hour:
            suggestions.append({
                "type": "schedule_optimization",
                "description": f"调整执行时间从 UTC {current_hour}:00 到 UTC {best_hour}:00",
                "priority": 1,
                "expected_impact": 0.15,  # 预计提升15%性能
                "action": f"更新 cron 表达式为 '0 {best_hour} * * 1,4'"
            })
        
        # 检查并行效率
        avg_efficiency = analysis.get("best_hour_metrics", {}).get("avg_efficiency", 0)
        if avg_efficiency < 0.7:
            suggestions.append({
                "type": "parallel_optimization",
                "description": f"并行效率较低 ({avg_efficiency*100:.1f}%)，建议优化并发设置",
                "priority": 2,
                "expected_impact": 0.25,
                "action": "减少并发数或优化网络连接"
            })
        
        # 检查成功率
        avg_success = analysis.get("best_hour_metrics", {}).get("avg_success_rate", 0)
        if avg_success < 0.9:
            suggestions.append({
                "type": "reliability_improvement",
                "description": f"成功率较低 ({avg_success*100:.1f}%)，建议加强错误处理",
                "priority": 1,
                "expected_impact": 0.20,
                "action": "增加重试次数或改进安装方法"
            })
        
        return suggestions
    
    def save_schedule(self, output_file: str = "schedule/next-run-schedule.json"):
        """保存调度计划"""
        try:
            analysis = self.analyze_execution_patterns()
            
            if "error" in analysis:
                logger.warning(f"Cannot generate schedule: {analysis['error']}")
                return
            
            schedule = {
                "generated_at": datetime.now().isoformat(),
                "analysis": analysis,
                "cron_schedule": self.generate_cron_schedule(analysis),
                "optimization_suggestions": self.generate_optimization_suggestions(analysis),
                "next_optimal_run": self._calculate_next_run(analysis)
            }
            
            # 确保目录存在
            Path(output_file).parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(schedule, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Schedule saved to {output_file}")
            
            # 打印摘要
            self._print_schedule_summary(schedule)
            
        except Exception as e:
            logger.error(f"Error saving schedule: {e}")
    
    def _calculate_next_run(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """计算下次最优运行时间"""
        optimal_hour = analysis.get("optimal_schedule", {}).get("optimal_hour", 18)
        
        now = datetime.utcnow()
        next_run = now.replace(hour=optimal_hour, minute=0, second=0, microsecond=0)
        
        # 如果是今天已经过了这个时间，就安排到下一个周一或周四
        if next_run < now:
            # 找到下一个周一或周四
            days_ahead = 0
            while True:
                next_run += timedelta(days=1)
                days_ahead += 1
                if next_run.weekday() in [0, 3]:  # 周一=0, 周四=3
                    break
        
        return {
            "datetime_utc": next_run.isoformat(),
            "datetime_local": (next_run + timedelta(hours=8)).isoformat(),  # UTC+8
            "days_until": (next_run - now).days,
            "hours_until": int((next_run - now).total_seconds() / 3600)
        }
    
    def _print_schedule_summary(self, schedule: Dict[str, Any]):
        """打印调度摘要"""
        print("\n" + "="*60)
        print("智能调度分析结果")
        print("="*60)
        
        cron = schedule.get("cron_schedule", "0 18 * * 1,4")
        print(f"推荐 cron 表达式: {cron}")
        
        next_run = schedule.get("next_optimal_run", {})
        if next_run:
            print(f"下次最优运行: {next_run.get('datetime_local', 'N/A')}")
            print(f"距离现在: {next_run.get('hours_until', 0)} 小时")
        
        suggestions = schedule.get("optimization_suggestions", [])
        if suggestions:
            print(f"\n优化建议 ({len(suggestions)} 条):")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"{i}. [{suggestion['priority']}] {suggestion['description']}")
        
        print("="*60)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="智能调度器")
    parser.add_argument("--metrics-db", type=str, default="data/performance-metrics.db",
                       help="性能指标数据库路径")
    parser.add_argument("--output", type=str, default="schedule/next-run-schedule.json",
                       help="输出文件路径")
    
    args = parser.parse_args()
    
    try:
        scheduler = SmartScheduler(metrics_db=args.metrics_db)
        scheduler.save_schedule(output_file=args.output)
        
    except Exception as e:
        logger.error(f"Error in smart scheduler: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()