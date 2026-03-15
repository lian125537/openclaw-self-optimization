import socket
import json
from datetime import datetime
import concurrent.futures
import sys

def check_port(host, port, timeout=2):
    """快速检查端口是否开放"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(timeout)
            return sock.connect_ex((host, port)) == 0
    except:
        return False

def main():
    # 关键端口列表
    key_ports = [
        (80, "HTTP"),
        (443, "HTTPS"),
        (22, "SSH"),
        (21, "FTP"),
        (23, "Telnet"),
        (25, "SMTP"),
        (53, "DNS"),
        (3306, "MySQL"),
        (5432, "PostgreSQL"),
        (8080, "HTTP Alt"),
        (8443, "HTTPS Alt"),
        (3000, "Node.js"),
        (5000, "Flask"),
        (8000, "Python dev"),
        (3389, "RDP"),
    ]
    
    print("快速端口检测开始...")
    print(f"时间: {datetime.now()}")
    print(f"目标: localhost")
    print("-" * 40)
    
    open_ports = []
    results = []
    
    # 使用线程池并行检查
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_port = {executor.submit(check_port, "localhost", port, 1): (port, service) 
                         for port, service in key_ports}
        
        for future in concurrent.futures.as_completed(future_to_port):
            port, service = future_to_port[future]
            try:
                is_open = future.result()
                status = "OPEN" if is_open else "CLOSED"
                
                if is_open:
                    open_ports.append(f"{port} ({service})")
                    print(f"端口 {port:5d} ({service:15s}): [OPEN]")
                else:
                    print(f"端口 {port:5d} ({service:15s}): [CLOSED]")
                
                results.append({
                    "port": port,
                    "service": service,
                    "open": is_open,
                    "status": status
                })
            except Exception as e:
                print(f"端口 {port} 检查失败: {e}")
    
    print("-" * 40)
    print(f"检查完成!")
    print(f"检查端口数: {len(key_ports)}")
    print(f"开放端口数: {len(open_ports)}")
    
    # 生成报告
    report = {
        "test_type": "快速端口监控测试",
        "timestamp": datetime.now().isoformat(),
        "target": "localhost",
        "total_ports": len(key_ports),
        "open_ports_count": len(open_ports),
        "open_ports": open_ports,
        "port_details": results,
        "system": sys.platform,
        "test_result": "成功" if len(results) == len(key_ports) else "部分成功"
    }
    
    # 保存报告
    filename = f"quick_port_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n报告已保存: {filename}")
    
    # 简单分析
    if open_ports:
        print("\n开放的端口:")
        for port_desc in open_ports:
            print(f"  - {port_desc}")
        
        # 安全提醒
        sensitive_services = ["SSH", "Telnet", "FTP", "SMTP", "RDP"]
        for port, service in key_ports:
            if service in sensitive_services and any(f"{port} ({service})" == desc for desc in open_ports):
                print(f"\n⚠️  注意: 敏感服务 {service} (端口 {port}) 是开放的!")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n测试被用户中断")
        sys.exit(1)