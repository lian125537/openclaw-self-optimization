# 带进度功能的API服务器
Add-Type -TypeDefinition @"
using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Concurrent;

public class ProgressApiServer {
    private HttpListener listener;
    private Thread listenerThread;
    private bool isRunning = false;
    private ConcurrentDictionary<string, TaskProgress> tasks = new ConcurrentDictionary<string, TaskProgress>();
    
    public class TaskProgress {
        public string TaskId { get; set; }
        public string TaskName { get; set; }
        public int TotalSeconds { get; set; }
        public int CurrentProgress { get; set; }
        public string Status { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public bool IsCompleted { get; set; }
    }
    
    public void Start(int port = 8081) {
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
        Console.WriteLine($"✅ 进度API服务器已启动: http://localhost:{port}");
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
            var result = HandleProgressRequest(request.Url.LocalPath, requestBody, request.HttpMethod);
            
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
    
    private string HandleProgressRequest(string path, string body, string method) {
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        
        if (path.StartsWith("/api/task/")) {
            var parts = path.Split('/');
            if (parts.Length >= 4) {
                var taskId = parts[3];
                var action = parts.Length >= 5 ? parts[4] : "";
                
                return HandleTaskAction(taskId, action, body, method);
            }
        }
        
        switch (path.ToLower()) {
            case "/api/task/create":
                return CreateTask(body);
            case "/api/task/list":
                return ListTasks();
            case "/api/progress/stream":
                return HandleProgressStream(body);
            default:
                return $"{{\"error\": \"Endpoint not found\", \"path\": \"{path}\", \"timestamp\": \"{timestamp}\"}}";
        }
    }
    
    private string CreateTask(string body) {
        try {
            dynamic request = Newtonsoft.Json.JsonConvert.DeserializeObject(body);
            string taskName = request.taskName;
            int totalSeconds = request.totalSeconds;
            
            var taskId = Guid.NewGuid().ToString();
            var progress = new TaskProgress {
                TaskId = taskId,
                TaskName = taskName,
                TotalSeconds = totalSeconds,
                CurrentProgress = 0,
                Status = "created",
                StartTime = DateTime.Now,
                IsCompleted = false
            };
            
            tasks[taskId] = progress;
            
            // 启动模拟进度更新（后台线程）
            ThreadPool.QueueUserWorkItem((state) => {
                UpdateTaskProgress(taskId, totalSeconds);
            });
            
            return $"{{\"taskId\": \"{taskId}\", \"taskName\": \"{taskName}\", \"status\": \"created\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
        } catch {
            return $"{{\"error\": \"Invalid request\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
        }
    }
    
    private void UpdateTaskProgress(string taskId, int totalSeconds) {
        if (tasks.TryGetValue(taskId, out var progress)) {
            progress.Status = "running";
            
            for (int i = 0; i <= 100; i += 10) {
                if (!tasks.ContainsKey(taskId)) break;
                
                progress.CurrentProgress = i;
                progress.Status = i < 100 ? "running" : "completed";
                
                // 模拟任务执行时间
                Thread.Sleep(totalSeconds * 1000 / 10);
                
                if (i == 100) {
                    progress.IsCompleted = true;
                    progress.EndTime = DateTime.Now;
                }
            }
        }
    }
    
    private string HandleTaskAction(string taskId, string action, string body, string method) {
        if (!tasks.TryGetValue(taskId, out var progress)) {
            return $"{{\"error\": \"Task not found\", \"taskId\": \"{taskId}\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
        }
        
        switch (action.ToLower()) {
            case "progress":
                return $"{{\"taskId\": \"{taskId}\", \"taskName\": \"{progress.TaskName}\", \"progress\": {progress.CurrentProgress}, \"status\": \"{progress.Status}\", \"isCompleted\": {progress.IsCompleted.ToString().ToLower()}, \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
            case "cancel":
                tasks.TryRemove(taskId, out _);
                return $"{{\"taskId\": \"{taskId}\", \"status\": \"cancelled\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
            default:
                return $"{{\"error\": \"Unknown action\", \"action\": \"{action}\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
        }
    }
    
    private string ListTasks() {
        var taskList = new System.Text.StringBuilder("[");
        bool first = true;
        
        foreach (var task in tasks.Values) {
            if (!first) taskList.Append(",");
            first = false;
            
            taskList.Append($"{{\"taskId\": \"{task.TaskId}\", \"taskName\": \"{task.TaskName}\", \"progress\": {task.CurrentProgress}, \"status\": \"{task.Status}\"}}");
        }
        
        taskList.Append("]");
        return $"{{\"tasks\": {taskList}, \"count\": {tasks.Count}, \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
    }
    
    private string HandleProgressStream(string body) {
        // 长轮询实现
        return $"{{\"message\": \"Progress streaming endpoint\", \"timestamp\": \"{DateTime.Now:yyyy-MM-dd HH:mm:ss}\"}}";
    }
    
    public void Stop() {
        isRunning = false;
        if (listener != null && listener.IsListening) {
            listener.Stop();
        }
        if (listenerThread != null && listenerThread.IsAlive) {
            listenerThread.Join(1000);
        }
        Console.WriteLine("进度API服务器已停止");
    }
}
"@ -ReferencedAssemblies "System.Net.Http"

# 启动服务器
$progressServer = New-Object ProgressApiServer
$progressServer.Start(8081)

Write-Host "`n📊 **进度API服务器已启动**" -ForegroundColor Green
Write-Host "访问地址: http://localhost:8081" -ForegroundColor Cyan
Write-Host "进度功能端点:" -ForegroundColor Yellow
Write-Host "  POST /api/task/create    - 创建任务" -ForegroundColor Gray
Write-Host "  GET  /api/task/list      - 任务列表" -ForegroundColor Gray
Write-Host "  GET  /api/task/{id}/progress - 查询进度" -ForegroundColor Gray
Write-Host "  POST /api/task/{id}/cancel - 取消任务" -ForegroundColor Gray

Write-Host "`n🔄 **保持服务器运行...**" -ForegroundColor Magenta
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Red

# 保持运行
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $progressServer.Stop()
}