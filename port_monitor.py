#!/usr/bin/env python3
"""
端口监控脚本 - 用于测试端口监控功能
"""

import socket
import subprocess
import time
import json
from datetime import datetime
from typing import Dict, List, Tuple
import sys

class PortMonitor:
    def __init__(self):
        self.common_ports = {
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
            27017: "MongoDB",
            6379: "Redis",
            8080: "HTTP Alt",
            8443: "HTTPS Alt",
            3000: "Node.js dev",
            4200: "Angular dev",
            5000: "Flask dev",
            8000: "Python dev",
        }
        
        # 记录测试开始时间
        self.start_time = datetime.now()
        
    def check_port_status(self, host: str = "localhost", port: int = None) -> Tuple[bool, str]:
        """
        检查端口状态
        
        Args:
            host: 主机地址
            port: 端口号
            
        Returns:
            (是否开放, 详细信息)
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                return True, f"Port {port} is OPEN on {host}"
            else:
                return False, f"Port {port} is CLOSED on {host} (error: {result})"
        except Exception as e:
            return False, f"Error checking port {port}: {str(e)}"
    
    def check_listening_ports(self) -> Dict[str, List[Dict]]:
        """
        检查系统正在监听的端口
        """
        listening_ports = []
        
        try:
            # 使用netstat命令获取监听端口
            cmd = ["netstat", "-an", "-p", "TCP"]
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            
            lines = result.stdout.split('\n')
            for line in lines:
                if "LISTENING" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        # 解析地址和端口
                        local_addr = parts[1]
                        if ':' in local_addr:
                            addr, port_str = local_addr.rsplit(':', 1)
                            try:
                                port = int(port_str)
                                listening_ports.append({
                                    "address": addr,
                                    "port": port,
                                    "state": "LISTENING",
                                    "full_line": line.strip()
                                })
                            except ValueError:
                                continue
        except Exception as e:
            print(f"Error getting listening ports: {e}")
            
        return {"listening_ports": listening_ports}
    
    def check_common_ports(self) -> Dict[str, List[Dict]]:
        """
        检查常见端口状态
        """
        results = []
        
        for port, service in self.common_ports.items():
            is_open, message = self.check_port_status("localhost", port)
            results.append({
                "port": port,
                "service": service,
                "open": is_open,
                "message": message
            })
            time.sleep(0.1)  # 避免太频繁的连接
        
        return {"common_ports": results}
    
    def get_port_statistics(self) -> Dict:
        """
        获取端口统计信息
        """
        stats = {
            "timestamp": datetime.now().isoformat(),
            "total_checked_ports": len(self.common_ports),
            "test_duration": (datetime.now() - self.start_time).total_seconds(),
            "system_info": {
                "platform": sys.platform,
                "python_version": sys.version,
            }
        }
        
        return stats
    
    def generate_report(self) -> Dict:
        """
        生成监控报告
        """
        print("=" * 60)
        print("端口监控测试报告")
        print("=" * 60)
        print(f"测试开始时间: {self.start_time}")
        print(f"当前时间: {datetime.now()}")
        print()
        
        # 检查监听端口
        print("1. 系统监听端口检查:")
        listening_result = self.check_listening_ports()
        listening_ports = listening_result.get("listening_ports", [])
        
        if listening_ports:
            for port_info in listening_ports[:10]:  # 只显示前10个
                print(f"   {port_info['address']}:{port_info['port']} - {port_info['state']}")
            if len(listening_ports) > 10:
                print(f"   ... 还有 {len(listening_ports) - 10} 个监听端口")
        else:
            print("   未找到监听端口信息")
        
        print()
        
        # 检查常见端口
        print("2. 常见服务端口检查:")
        common_result = self.check_common_ports()
        
        open_ports = []
        closed_ports = []
        
        for port_info in common_result.get("common_ports", []):
            status = "✅ 开放" if port_info["open"] else "❌ 关闭"
            service_desc = f"{port_info['port']} ({port_info['service']})"
            
            if port_info["open"]:
                open_ports.append((port_info["port"], port_info["service"]))
            else:
                closed_ports.append((port_info["port"], port_info["service"]))
            
            print(f"   {status} - {service_desc}")
        
        print()
        print("3. 统计信息:")
        print(f"   开放端口数: {len(open_ports)}")
        print(f"   关闭端口数: {len(closed_ports)}")
        print(f"   总检查端口: {len(open_ports) + len(closed_ports)}")
        
        # 获取统计信息
        stats = self.get_port_statistics()
        
        print()
        print("开放的端口服务:")
        if open_ports:
            for port, service in sorted(open_ports):
                print(f"   {port}: {service}")
        else:
            print("   无开放端口")
        
        print("=" * 60)
        
        # 返回整合的报告
        report = {
            "timestamp": datetime.now().isoformat(),
            "test_start": self.start_time.isoformat(),
            "listening_ports": listening_ports,
            "common_ports": common_result.get("common_ports", []),
            "stats": stats,
            "summary": {
                "total_open": len(open_ports),
                "total_closed": len(closed_ports),
                "open_ports": open_ports,
                "closed_ports": closed_ports
            }
        }
        
        return report

def main():
    """主函数"""
    print("🚀 开始端口监控测试...")
    print()
    
    monitor = PortMonitor()
    
    try:
        # 生成完整报告
        report = monitor.generate_report()
        
        # 保存报告到文件
        report_filename = f"port_monitor_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 报告已保存到: {report_filename}")
        
        # 检查是否有任何安全问题（如开放的敏感端口）
        sensitive_ports = [22, 23, 21, 25, 3389]  # SSH, Telnet, FTP, SMTP, RDP
        for port, service in report["summary"]["open_ports"]:
            if port in sensitive_ports:
                print(f"\n⚠️  安全警告: 敏感端口 {port} ({service}) 是开放的!")
        
        return 0
        
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)