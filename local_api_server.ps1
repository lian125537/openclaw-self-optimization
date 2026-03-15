# 本地HTTP API服务器 - 最稳定通信方案
Add-Type -TypeDefinition @"
using System;
using System.Net;
using System.Text;
using System.Threading;

public class LocalApiServer {
    private HttpListener listener;
    private Thread listenerThread;
    private bool isRunning = false;
    
    public void Start(int port = 8080) {
        listener = new HttpListener();
        listener.Prefixes.Add($"http://localhost:{port}/");
        listener.Prefixes.Add($"http://127.0.0.1:{port}/");
        
        listener.Start();
        isRunning = true;
        
        listenerThread = new Thread(() => {
            while (isRunning) {
                try {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((ctx) => {
                        ProcessRequest((HttpListenerContext)ctx);
                    }, context);
                } catch (Exception ex) {
                    if (isRunning) {
                        Console.WriteLine($"监听错误: {ex.Message}");
                    }
                }
            }
        });
        
        listenerThread.Start();
        Console.WriteLine($"✅ API服务器已启动: http://localhost:{port}");
    }
    
    private void ProcessRequest(HttpListenerContext context) {
        try {
            var request = context.Request;
            var response = context.Response;
            
            // 读取请求内容
            string requestBody = "";
            if (request.HasEntityBody) {
                using (var reader = new System.IO.StreamReader(request.InputStream, request.ContentEncoding)) {
                    requestBody = reader.ReadToEnd();
                }
            }
            
            // 处理请求
            var result = HandleApiRequest(request.Url.LocalPath, requestBody, request.HttpMethod);
            
            // 返回响应
            byte[] buffer = Encoding.UTF8.GetBytes(result);
            response.ContentLength64 = buffer.Length;
            response.ContentType = "application/json; charset=utf-8";
            
            using (var output = response.OutputStream) {
                output.Write(buffer, 0, buffer.Length);
            }
        } catch (Exception ex) {
            context.Response.StatusCode = 500;
            var error = $"{{\"error\": \"{ex.Message}\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
            byte[] buffer = Encoding.UTF8.GetBytes(error);
            context.Response.ContentLength64 = buffer.Length;
            context.Response.OutputStream.Write(buffer, 0, buffer.Length);
        }
    }
    
    private string HandleApiRequest(string path, string body, string method) {
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        
        switch (path.ToLower()) {
            case "/api/chat":
                return HandleChatRequest(body);
            case "/api/status":
                return $"{{\"status\": \"running\", \"server\": \"OpenClaw Local API\", \"timestamp\": \"{timestamp}\"}}";
            case "/api/tasks":
                return HandleTaskRequest(body, method);
            case "/api/files":
                return HandleFileRequest(body, method);
            default:
                return $"{{\"error\": \"Endpoint not found\", \"path\": \"{path}\", \"timestamp\": \"{timestamp}\"}}";
        }
    }
    
    private string HandleChatRequest(string body) {
        try {
            dynamic request = Newtonsoft.Json.JsonConvert.DeserializeObject(body);
            string message = request.message;
            
            // 这里可以集成AI处理逻辑
            string response = $"{{\"reply\": \"已收到消息: {message}\", \"processed\": true, \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
            
            return response;
        } catch {
            return $"{{\"reply\": \"消息处理中...\", \"queued\": true, \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
        }
    }
    
    private string HandleTaskRequest(string body, string method) {
        return $"{{\"action\": \"task_{method.ToLower()}\", \"status\": \"processed\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
    }
    
    private string HandleFileRequest(string body, string method) {
        return $"{{\"action\": \"file_{method.ToLower()}\", \"status\": \"processed\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
    }
    
    public void Stop() {
        isRunning = false;
        if (listener != null && listener.IsListening) {
            listener.Stop();
        }
        if (listenerThread != null && listenerThread.IsAlive) {
            listenerThread.Join(1000);
        }
        Console.WriteLine("API服务器已停止");
    }
}
"@ -ReferencedAssemblies "System.Net.Http"

# 启动服务器
$server = New-Object LocalApiServer
$server.Start(8080)

Write-Host "`n📡 **本地API服务器已启动**" -ForegroundColor Green
Write-Host "访问地址: http://localhost:8080" -ForegroundColor Cyan
Write-Host "可用端点:" -ForegroundColor Yellow
Write-Host "  GET  /api/status    - 服务器状态" -ForegroundColor Gray
Write-Host "  POST /api/chat      - 发送消息" -ForegroundColor Gray
Write-Host "  POST /api/tasks     - 提交任务" -ForegroundColor Gray
Write-Host "  POST /api/files     - 文件操作" -ForegroundColor Gray

Write-Host "`n🔄 **保持服务器运行...**" -ForegroundColor Magenta
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Red

# 保持运行
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $server.Stop()
}