#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
稳定性系统初始化
提供统一的稳定性组件接口
"""

import sys
import os
from pathlib import Path

# 添加当前目录到 Python 路径
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# 导入稳定性组件
try:
    from retry_decorator import (
        retry_with_backoff,
        retry_on_condition,
        RetryConfig,
        retry,
        retry_network,
        retry_critical,
        is_network_error,
        is_temporary_error
    )
    
    from circuit_breaker import (
        CircuitBreaker,
        CircuitBreakerConfig,
        CircuitBreakerManager,
        CircuitBreakerOpenError,
        NETWORK_BREAKER_CONFIG,
        DATABASE_BREAKER_CONFIG,
        API_BREAKER_CONFIG
    )
    
    from health_check import (
        HealthCheckSystem,
        HealthCheckAPI,
        HealthStatus,
        CheckSeverity,
        DirectoryHealthChecker,
        FileHealthChecker,
        DatabaseHealthChecker,
        ScriptHealthChecker,
        SystemResourceChecker
    )
    
    # 创建全局实例
    health_system = HealthCheckSystem()
    health_api = HealthCheckAPI(health_system)
    
    # 创建常用断路器
    network_breaker = CircuitBreakerManager.get_breaker(
        "network_service",
        NETWORK_BREAKER_CONFIG
    )
    
    database_breaker = CircuitBreakerManager.get_breaker(
        "database_service",
        DATABASE_BREAKER_CONFIG
    )
    
    api_breaker = CircuitBreakerManager.get_breaker(
        "external_api",
        API_BREAKER_CONFIG
    )
    
    STABILITY_AVAILABLE = True
    print("稳定性系统初始化完成")
    
except ImportError as e:
    STABILITY_AVAILABLE = False
    print(f"稳定性组件导入失败: {e}")
    print("系统将以基本模式运行，稳定性功能不可用")

# 如果可用，提供便捷函数
if STABILITY_AVAILABLE:
    
    def check_system_health():
        """检查系统健康状态"""
        return health_api.get_health()
    
    def get_system_status():
        """获取系统状态"""
        return health_api.get_status()
    
    def run_with_stability(func, *args, **kwargs):
        """
        使用稳定性机制执行函数
        
        参数:
            func: 要执行的函数
            *args, **kwargs: 函数参数
        
        返回:
            函数执行结果
        
        特性:
            - 自动重试（网络错误）
            - 断路器保护
            - 健康状态检查
        """
        # 获取函数名称用于断路器
        func_name = func.__name__
        
        # 获取或创建断路器
        breaker = CircuitBreakerManager.get_breaker(func_name)
        
        # 定义带重试的执行函数
        @retry_network
        def execute_with_retry():
            return breaker.execute(func, *args, **kwargs)
        
        # 执行
        return execute_with_retry()

# 测试函数
def test_stability_system():
    """测试稳定性系统"""
    if not STABILITY_AVAILABLE:
        print("稳定性系统不可用")
        return False
    
    print("测试稳定性系统...")
    
    # 测试重试机制
    @retry
    def test_retry():
        print("测试重试机制")
        return "重试测试成功"
    
    # 测试健康检查
    health = check_system_health()
    print(f"健康检查状态: {health['data']['report']['overall_status']}")
    
    # 测试断路器
    @network_breaker
    def test_breaker():
        print("测试断路器")
        return "断路器测试成功"
    
    try:
        retry_result = test_retry()
        breaker_result = test_breaker()
        
        print(f"重试测试: {retry_result}")
        print(f"断路器测试: {breaker_result}")
        
        return True
    except Exception as e:
        print(f"稳定性测试失败: {e}")
        return False

if __name__ == "__main__":
    print("运行稳定性系统测试...")
    success = test_stability_system()
    
    if success:
        print("稳定性系统测试通过！")
    else:
        print("稳定性系统测试失败")