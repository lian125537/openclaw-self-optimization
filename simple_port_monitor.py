# 简单端口监控测试脚本
import socket
import json
from datetime import datetime

def check_port(host, port, timeout=2):
    """检查端口是否开放"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def check_common_ports():
    """检查常见端口"""
    common_ports = {
        80: "HTTP",
        443: "HTTPS",
        22: "SSH",
        21: "FTP",
        23: "Telnet",
        25: "SMTP",
        53: "DNS",
        110: "POP3",
        143: "IMAP",
        3306: "MySQL",
        5432: "PostgreSQL",
        8080: "HTTP Alt",
        8443: "HTTPS Alt",
        3000: "Node.js",
        5000: "Flask",
        8000: "Python dev",
        3389: "RDP",
    }
    
    results = []
    open_ports = []
    
    print("===== 端口监控测试报告 =====")
    print(f"测试时间: {datetime.now()}")
    print(f"测试主机: localhost")
    print("=" * 40)
    
    for port, service in common_ports.items():
        is_open = check_port("localhost", port)
        status = "OPEN" if is_open else "CLOSED"
        
        if is_open:
            open_ports.append(f"{port} ({service})")
            print(f"端口 {port:5d} ({service:15s}): [OPEN]")
        else:
            print(f"端口 {port:5d} ({service:15s}): [CLOSED]")
        
        results.append({
            "port": port,
            "service": service,
            "status": status,
            "open": is_open
        })
    
    print("=" * 40)
    print(f"总检查端口数: {len(common_ports)}")
    print(f"开放端口数: {len(open_ports)}")
    
    if open_ports:
        print("\n开放的端口:")
        for port_desc in open_ports:
            print(f"  - {port_desc}")
    
    # 保存结果到JSON文件
    report = {
        "timestamp": datetime.now().isoformat(),
        "host": "localhost",
        "total_ports_checked": len(common_ports),
        "open_ports_count": len(open_ports),
        "open_ports": open_ports,
        "detailed_results": results
    }
    
    filename = f"port_monitor_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n报告已保存到: {filename}")
    print("=" * 40)
    
    return report

if __name__ == "__main__":
    check_common_ports()