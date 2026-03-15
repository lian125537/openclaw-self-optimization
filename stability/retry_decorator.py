#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重试装饰器 - 稳定性增强核心组件
提供带指数退避的重试机制
"""

import time
import logging
from functools import wraps
from typing import Callable, Any, Optional, Type, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class RetryConfig:
    """重试配置类"""
    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retry_on_exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ):
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retry_on_exceptions = retry_on_exceptions

def retry_with_backoff(config: Optional[RetryConfig] = None):
    """
    带指数退避的重试装饰器
    
    参数:
        config: 重试配置，如果为None则使用默认配置
    
    使用示例:
        @retry_with_backoff()
        def risky_operation():
            # 可能失败的操作
            pass
        
        @retry_with_backoff(RetryConfig(max_attempts=5, initial_delay=2.0))
        def critical_operation():
            # 关键操作，需要更多重试
            pass
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            operation_name = func.__name__
            
            for attempt in range(1, config.max_attempts + 1):
                try:
                    logger.debug(f"执行 {operation_name} - 第{attempt}次尝试")
                    result = func(*args, **kwargs)
                    
                    if attempt > 1:
                        logger.info(f"{operation_name} 在第{attempt}次尝试成功")
                    
                    return result
                    
                except config.retry_on_exceptions as e:
                    last_exception = e
                    
                    # 如果是最后一次尝试，不再等待
                    if attempt == config.max_attempts:
                        logger.error(f"{operation_name} 所有{config.max_attempts}次尝试均失败")
                        break
                    
                    # 计算等待时间（指数退避）
                    delay = min(
                        config.initial_delay * (config.exponential_base ** (attempt - 1)),
                        config.max_delay
                    )
                    
                    # 添加随机抖动（避免惊群效应）
                    if config.jitter:
                        import random
                        delay = delay * (0.5 + random.random())
                    
                    logger.warning(
                        f"{operation_name} 第{attempt}次尝试失败: {e}\n"
                        f"等待 {delay:.2f} 秒后重试..."
                    )
                    
                    time.sleep(delay)
            
            # 所有尝试都失败，抛出最后一个异常
            raise last_exception
        
        return wrapper
    
    return decorator

def retry_on_condition(
    condition_func: Callable[[Exception], bool],
    config: Optional[RetryConfig] = None
):
    """
    基于条件的重试装饰器
    
    参数:
        condition_func: 判断是否应该重试的函数
        config: 重试配置
    
    使用示例:
        def should_retry_on_timeout(e):
            return isinstance(e, TimeoutError)
        
        @retry_on_condition(should_retry_on_timeout)
        def network_operation():
            pass
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            operation_name = func.__name__
            
            for attempt in range(1, config.max_attempts + 1):
                try:
                    logger.debug(f"执行 {operation_name} - 第{attempt}次尝试")
                    return func(*args, **kwargs)
                    
                except Exception as e:
                    last_exception = e
                    
                    # 检查是否应该重试
                    if not condition_func(e):
                        logger.error(f"{operation_name} 遇到不可重试错误: {e}")
                        raise e
                    
                    # 如果是最后一次尝试
                    if attempt == config.max_attempts:
                        logger.error(f"{operation_name} 所有{config.max_attempts}次尝试均失败")
                        break
                    
                    # 计算等待时间
                    delay = min(
                        config.initial_delay * (config.exponential_base ** (attempt - 1)),
                        config.max_delay
                    )
                    
                    logger.warning(
                        f"{operation_name} 第{attempt}次尝试失败 (可重试): {e}\n"
                        f"等待 {delay:.2f} 秒后重试..."
                    )
                    
                    time.sleep(delay)
            
            raise last_exception
        
        return wrapper
    
    return decorator

# 预定义的重试配置
DEFAULT_RETRY = RetryConfig(max_attempts=3, initial_delay=1.0)
NETWORK_RETRY = RetryConfig(max_attempts=5, initial_delay=2.0, max_delay=30.0)
CRITICAL_RETRY = RetryConfig(max_attempts=10, initial_delay=0.5, max_delay=120.0)

# 常用的条件判断函数
def is_network_error(e: Exception) -> bool:
    """判断是否为网络错误（可重试）"""
    network_errors = (
        ConnectionError,
        TimeoutError,
        OSError,  # 包含socket错误
    )
    return isinstance(e, network_errors)

def is_temporary_error(e: Exception) -> bool:
    """判断是否为临时错误（可重试）"""
    import requests
    temporary_errors = (
        ConnectionError,
        TimeoutError,
        requests.exceptions.RequestException,
    )
    return isinstance(e, temporary_errors)

# 快捷装饰器
retry = retry_with_backoff()
retry_network = retry_on_condition(is_network_error, NETWORK_RETRY)
retry_critical = retry_with_backoff(CRITICAL_RETRY)

if __name__ == "__main__":
    # 测试代码
    import logging
    logging.basicConfig(level=logging.INFO)
    
    @retry
    def test_success():
        print("测试成功操作")
        return "success"
    
    @retry
    def test_failure():
        print("测试失败操作")
        raise ValueError("测试错误")
    
    try:
        result = test_success()
        print(f"成功结果: {result}")
        
        result = test_failure()
        print(f"失败结果: {result}")
    except Exception as e:
        print(f"最终捕获异常: {e}")