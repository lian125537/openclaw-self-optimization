#!/usr/bin/env python3
# 调试健康检查问题

from scripts.health_check import HealthCheckSystem

hs = HealthCheckSystem()
report = hs.run_checks()

print("="*60)
print("HEALTH CHECK REPORT")
print("="*60)
print()

print(f"Overall Status: {report['overall_status']}")
print(f"Total Checks: {report['total_checks']}")
print(f"Healthy Checks: {report['successful_checks']}")
print(f"Degraded Checks: {report['degraded_checks']}")
print(f"Unhealthy Checks: {report['unhealthy_checks']}")

print()
print("="*60)
print("DETAILED ISSUES")
print("="*60)

# 显示所有非健康状态的问题
issues_found = False
for check in report['checks']:
    if check['status'] != 'healthy':
        issues_found = True
        print()
        print(f"[ISSUE] {check['check_name']}")
        print(f"   Status: {check['status'].upper()}")
        print(f"   Severity: {check['severity']}")
        print(f"   Message: {check['message']}")
        
        # 显示详细信息
        if check['details']:
            print(f"   Details:")
            for key, value in check['details'].items():
                if isinstance(value, list):
                    print(f"     - {key}: {len(value)} items")
                else:
                    print(f"     - {key}: {value}")

if not issues_found:
    print()
    print("[SUCCESS] No issues found - all checks are healthy!")

print()
print("="*60)
print("RECOMMENDATIONS")
print("="*60)

# 根据问题给出建议
for check in report['checks']:
    if check['status'] == 'degraded':
        check_name = check['check_name']
        
        if 'directory_' in check_name:
            print(f"• Fix directory issue: {check['message']}")
        elif 'file_' in check_name:
            print(f"• Fix file issue: {check['message']}")
        elif 'script_' in check_name:
            print(f"• Fix script issue: {check['message']}")

print()
print("="*60)