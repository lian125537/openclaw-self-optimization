#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
断路器模式 - 防止级联故障
当服务连续失败时，暂时停止调用，给服务恢复时间
"""

import time
import threading
import logging
from typing import Callable, Any, Optional, Dict
from enum import Enum
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import deque
from functools import wraps

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    """断路器状态"""
    CLOSED = "closed"      # 正常状态，请求可以通过
    OPEN = "open"          # 打开状态，请求被拒绝
    HALF_OPEN = "half_open" # 半开状态，尝试恢复

@dataclass
class CircuitBreakerConfig:
    """断路器配置"""
    failure_threshold: int = 5          # 失败阈值，达到后打开断路器
    reset_timeout: float = 60.0         # 重置超时（秒），OPEN状态后尝试恢复的时间
    success_threshold: int = 3          # 半开状态下成功次数，达到后关闭断路器
    sliding_window_size: int = 10       # 滑动窗口大小，用于统计失败率
    failure_percentage_threshold: float = 0.5  # 失败率阈值（0-1）
    excluded_exceptions: tuple = ()     # 排除的异常类型（不计入失败）

@dataclass
class CircuitMetrics:
    """断路器指标"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None
    request_history: deque = field(default_factory=lambda: deque(maxlen=100))
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 1.0
        return self.successful_requests / self.total_requests
    
    @property
    def failure_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.failed_requests / self.total_requests
    
    def record_success(self):
        """记录成功请求"""
        self.total_requests += 1
        self.successful_requests += 1
        self.last_success_time = datetime.now()
        self.request_history.append(True)
    
    def record_failure(self):
        """记录失败请求"""
        self.total_requests += 1
        self.failed_requests += 1
        self.last_failure_time = datetime.now()
        self.request_history.append(False)
    
    def get_recent_failure_rate(self, window_size: int = 10) -> float:
        """获取最近N次请求的失败率"""
        if len(self.request_history) == 0:
            return 0.0
        
        recent = list(self.request_history)[-window_size:]
        failures = sum(1 for success in recent if not success)
        return failures / len(recent)

class CircuitBreaker:
    """
    断路器实现
    
    使用示例:
        breaker = CircuitBreaker("external_api")
        
        @breaker
        def call_external_api():
            # 调用可能失败的外部API
            pass
        
        # 或者直接使用
        try:
            result = breaker.execute(call_external_api)
        except CircuitBreakerOpenError:
            # 断路器打开时的处理
            pass
    """
    
    def __init__(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None,
        fallback_func: Optional[Callable] = None
    ):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.fallback_func = fallback_func
        
        self.state = CircuitState.CLOSED
        self.metrics = CircuitMetrics()
        self.last_state_change = datetime.now()
        self.lock = threading.RLock()
        
        logger.info(f"断路器 '{name}' 已初始化")
    
    def __call__(self, func: Callable) -> Callable:
        """作为装饰器使用"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self.execute(func, *args, **kwargs)
        return wrapper
    
    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        执行受保护的操作
        
        参数:
            func: 要执行的操作
            *args, **kwargs: 传递给func的参数
        
        返回:
            func的执行结果
        
        异常:
            CircuitBreakerOpenError: 断路器打开时
            Exception: func执行时的异常
        """
        with self.lock:
            # 检查断路器状态
            if self.state == CircuitState.OPEN:
                # 检查是否应该尝试恢复
                time_since_open = (datetime.now() - self.last_state_change).total_seconds()
                if time_since_open >= self.config.reset_timeout:
                    logger.info(f"断路器 '{self.name}' 尝试恢复，进入半开状态")
                    self.state = CircuitState.HALF_OPEN
                    self.last_state_change = datetime.now()
                else:
                    logger.warning(f"断路器 '{self.name}' 处于打开状态，请求被拒绝")
                    if self.fallback_func:
                        return self.fallback_func(*args, **kwargs)
                    raise CircuitBreakerOpenError(
                        f"断路器 '{self.name}' 打开，请稍后重试"
                    )
            
            # 执行操作
            try:
                result = func(*args, **kwargs)
                self._record_success()
                return result
                
            except Exception as e:
                # 检查是否为排除的异常
                if isinstance(e, self.config.excluded_exceptions):
                    logger.debug(f"断路器 '{self.name}' 排除异常: {e}")
                    raise e
                
                self._record_failure()
                
                # 检查是否需要打开断路器
                if self._should_trip():
                    logger.error(f"断路器 '{self.name}' 触发打开，失败率过高")
                    self.state = CircuitState.OPEN
                    self.last_state_change = datetime.now()
                
                # 如果有备用函数，尝试使用
                if self.fallback_func:
                    logger.info(f"断路器 '{self.name}' 使用备用函数")
                    try:
                        return self.fallback_func(*args, **kwargs)
                    except Exception as fallback_e:
                        logger.error(f"断路器 '{self.name}' 备用函数也失败: {fallback_e}")
                
                raise e
    
    def _record_success(self):
        """记录成功"""
        with self.lock:
            self.metrics.record_success()
            
            # 如果是半开状态，检查是否应该关闭
            if self.state == CircuitState.HALF_OPEN:
                recent_successes = sum(1 for success in 
                    list(self.metrics.request_history)[-self.config.success_threshold:]
                    if success)
                
                if recent_successes >= self.config.success_threshold:
                    logger.info(f"断路器 '{self.name}' 恢复成功，进入关闭状态")
                    self.state = CircuitState.CLOSED
                    self.last_state_change = datetime.now()
    
    def _record_failure(self):
        """记录失败"""
        with self.lock:
            self.metrics.record_failure()
    
    def _should_trip(self) -> bool:
        """判断是否应该触发断路器"""
        # 基于失败次数
        if self.metrics.failed_requests >= self.config.failure_threshold:
            return True
        
        # 基于失败率（滑动窗口）
        recent_failure_rate = self.metrics.get_recent_failure_rate(
            self.config.sliding_window_size
        )
        if recent_failure_rate >= self.config.failure_percentage_threshold:
            return True
        
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """获取断路器状态"""
        with self.lock:
            return {
                "name": self.name,
                "state": self.state.value,
                "metrics": {
                    "total_requests": self.metrics.total_requests,
                    "successful_requests": self.metrics.successful_requests,
                    "failed_requests": self.metrics.failed_requests,
                    "success_rate": self.metrics.success_rate,
                    "failure_rate": self.metrics.failure_rate,
                    "recent_failure_rate": self.metrics.get_recent_failure_rate(10),
                },
                "state_since": self.last_state_change.isoformat(),
                "time_in_state": (datetime.now() - self.last_state_change).total_seconds(),
                "config": {
                    "failure_threshold": self.config.failure_threshold,
                    "reset_timeout": self.config.reset_timeout,
                    "success_threshold": self.config.success_threshold,
                }
            }
    
    def reset(self):
        """重置断路器"""
        with self.lock:
            self.state = CircuitState.CLOSED
            self.metrics = CircuitMetrics()
            self.last_state_change = datetime.now()
            logger.info(f"断路器 '{self.name}' 已重置")

class CircuitBreakerOpenError(Exception):
    """断路器打开时抛出的异常"""
    pass

# 断路器管理器（单例）
class CircuitBreakerManager:
    """断路器管理器，用于管理多个断路器"""
    
    _instance = None
    _breakers: Dict[str, CircuitBreaker] = {}
    _lock = threading.RLock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    def get_breaker(
        cls,
        name: str,
        config: Optional[CircuitBreakerConfig] = None,
        fallback_func: Optional[Callable] = None
    ) -> CircuitBreaker:
        """获取或创建断路器"""
        with cls._lock:
            if name not in cls._breakers:
                cls._breakers[name] = CircuitBreaker(name, config, fallback_func)
            return cls._breakers[name]
    
    @classmethod
    def get_all_status(cls) -> Dict[str, Dict]:
        """获取所有断路器状态"""
        with cls._lock:
            return {
                name: breaker.get_status()
                for name, breaker in cls._breakers.items()
            }
    
    @classmethod
    def reset_breaker(cls, name: str):
        """重置指定断路器"""
        with cls._lock:
            if name in cls._breakers:
                cls._breakers[name].reset()
    
    @classmethod
    def reset_all(cls):
        """重置所有断路器"""
        with cls._lock:
            for breaker in cls._breakers.values():
                breaker.reset()

# 预定义的断路器配置
NETWORK_BREAKER_CONFIG = CircuitBreakerConfig(
    failure_threshold=3,
    reset_timeout=30.0,
    success_threshold=2,
    sliding_window_size=5,
    failure_percentage_threshold=0.6
)

DATABASE_BREAKER_CONFIG = CircuitBreakerConfig(
    failure_threshold=2,
    reset_timeout=120.0,
    success_threshold=3,
    sliding_window_size=3,
    failure_percentage_threshold=0.7
)

API_BREAKER_CONFIG = CircuitBreakerConfig(
    failure_threshold=5,
    reset_timeout=60.0,
    success_threshold=3,
    sliding_window_size=10,
    failure_percentage_threshold=0.5
)

if __name__ == "__main__":
    # 测试代码
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # 创建断路器
    breaker = CircuitBreaker("test_service", NETWORK_BREAKER_CONFIG)
    
    # 测试函数
    call_count = 0
    
    @breaker
    def unreliable_service():
        global call_count
        call_count += 1
        
        if call_count <= 3:
            raise ConnectionError("模拟网络错误")
        return "服务正常"
    
    # 执行测试
    for i in range(10):
        try:
            result = unreliable_service()
            print(f"调用 {i+1}: {result}")
        except CircuitBreakerOpenError as e:
            print(f"调用 {i+1}: 断路器打开 - {e}")
            time.sleep(1)
        except Exception as e:
            print(f"调用 {i+1}: 其他错误 - {e}")
    
    # 查看状态
    print("\n断路器状态:")
    print(breaker.get_status())