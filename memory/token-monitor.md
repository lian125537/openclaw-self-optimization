# Token 消耗监控系统

## 监控目标
- 实时追踪 token 消耗速率
- 检测异常飙升 (>50% 增长)
- 记录上下文利用率趋势

## 阈值设置
- 告警阈值: context > 80% 或 单次请求 > 50k tokens
- 危险阈值: context > 90% 或 速率 > 1000 tokens/min

## 运行方式
通过 heartbeat 或 cron 定期检查