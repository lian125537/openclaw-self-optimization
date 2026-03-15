# OpenClaw配置中文转换工具
# 将OpenClaw配置目录下的所有内容转换为中文

param(
    [string]$OpenClawDir = "$env:USERPROFILE\.openclaw",
    [switch]$Backup = $true,
    [switch]$DryRun = $false
)

Write-Host "🎯 OpenClaw配置中文转换工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "目标目录: $OpenClawDir" -ForegroundColor Yellow
Write-Host "备份: $(if($Backup){'✅'}else{'❌'})" -ForegroundColor Gray
Write-Host "试运行: $(if($DryRun){'✅'}else{'❌'})" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Gray

# 检查目录是否存在
if (-not (Test-Path $OpenClawDir)) {
    Write-Host "❌ 目录不存在: $OpenClawDir" -ForegroundColor Red
    exit 1
}

# 创建备份
if ($Backup -and -not $DryRun) {
    $backupDir = "$OpenClawDir-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "`n📦 创建备份..." -ForegroundColor Yellow
    try {
        Copy-Item -Path $OpenClawDir -Destination $backupDir -Recurse -Force
        Write-Host "✅ 备份创建完成: $backupDir" -ForegroundColor Green
    } catch {
        Write-Host "❌ 备份失败: $_" -ForegroundColor Red
    }
}

# 中英文对照表
$translationMap = @{
    # 通用配置项
    "enabled" = "启用"
    "disabled" = "禁用"
    "true" = "真"
    "false" = "假"
    "host" = "主机"
    "port" = "端口"
    "api" = "接口"
    "key" = "密钥"
    "token" = "令牌"
    "secret" = "密钥"
    "url" = "网址"
    "path" = "路径"
    "file" = "文件"
    "directory" = "目录"
    "name" = "名称"
    "type" = "类型"
    "value" = "值"
    "default" = "默认"
    "required" = "必填"
    "optional" = "可选"
    "description" = "描述"
    "version" = "版本"
    "author" = "作者"
    "license" = "许可证"
    
    # OpenClaw特定配置
    "gateway" = "网关"
    "agent" = "代理"
    "model" = "模型"
    "provider" = "提供商"
    "channel" = "频道"
    "plugin" = "插件"
    "skill" = "技能"
    "tool" = "工具"
    "memory" = "记忆"
    "session" = "会话"
    "runtime" = "运行时"
    "config" = "配置"
    "settings" = "设置"
    "preferences" = "偏好"
    "theme" = "主题"
    "ui" = "界面"
    "font" = "字体"
    "icon" = "图标"
    "color" = "颜色"
    "size" = "大小"
    "width" = "宽度"
    "height" = "高度"
    "timeout" = "超时"
    "retry" = "重试"
    "limit" = "限制"
    "max" = "最大"
    "min" = "最小"
    "average" = "平均"
    "total" = "总计"
    "count" = "计数"
    "status" = "状态"
    "error" = "错误"
    "warning" = "警告"
    "info" = "信息"
    "debug" = "调试"
    "log" = "日志"
    "level" = "级别"
    
    # 网络相关
    "network" = "网络"
    "connection" = "连接"
    "socket" = "套接字"
    "websocket" = "WebSocket"
    "http" = "HTTP"
    "https" = "HTTPS"
    "ssl" = "SSL"
    "tls" = "TLS"
    "certificate" = "证书"
    "authentication" = "认证"
    "authorization" = "授权"
    "permission" = "权限"
    "role" = "角色"
    "user" = "用户"
    "password" = "密码"
    "username" = "用户名"
    
    # 日期时间
    "date" = "日期"
    "time" = "时间"
    "timestamp" = "时间戳"
    "duration" = "时长"
    "interval" = "间隔"
    "schedule" = "计划"
    "cron" = "定时任务"
    
    # 文件操作
    "read" = "读取"
    "write" = "写入"
    "create" = "创建"
    "update" = "更新"
    "delete" = "删除"
    "copy" = "复制"
    "move" = "移动"
    "rename" = "重命名"
    "compress" = "压缩"
    "extract" = "解压"
    "backup" = "备份"
    "restore" = "恢复"
    
    # 系统相关
    "system" = "系统"
    "process" = "进程"
    "thread" = "线程"
    "memory" = "内存"
    "cpu" = "CPU"
    "disk" = "磁盘"
    "storage" = "存储"
    "resource" = "资源"
    "performance" = "性能"
    "monitor" = "监控"
    "alert" = "警报"
    "notification" = "通知"
    
    # 布尔值
    "yes" = "是"
    "no" = "否"
    "on" = "开"
    "off" = "关"
    "active" = "活跃"
    "inactive" = "非活跃"
    "running" = "运行中"
    "stopped" = "已停止"
    "paused" = "已暂停"
    
    # 方向位置
    "left" = "左"
    "right" = "右"
    "top" = "上"
    "bottom" = "下"
    "center" = "居中"
    "middle" = "中间"
    "start" = "开始"
    "end" = "结束"
    "begin" = "开始"
    "finish" = "完成"
    
    # 颜色
    "red" = "红色"
    "green" = "绿色"
    "blue" = "蓝色"
    "yellow" = "黄色"
    "orange" = "橙色"
    "purple" = "紫色"
    "pink" = "粉色"
    "brown" = "棕色"
    "black" = "黑色"
    "white" = "白色"
    "gray" = "灰色"
    "grey" = "灰色"
    "cyan" = "青色"
    "magenta" = "洋红色"
    
    # 常见短语
    "hello" = "你好"
    "world" = "世界"
    "welcome" = "欢迎"
    "goodbye" = "再见"
    "thank you" = "谢谢"
    "please" = "请"
    "sorry" = "抱歉"
    "error occurred" = "发生错误"
    "success" = "成功"
    "failed" = "失败"
    "completed" = "已完成"
    "in progress" = "进行中"
    "pending" = "待处理"
    "waiting" = "等待中"
    "ready" = "就绪"
    "busy" = "忙碌"
    "idle" = "空闲"
}

# 需要处理的文件类型
$fileTypes = @('.json', '.yml', '.yaml', '.js', '.ts', '.md', '.txt', '.cfg', '.conf', '.ini')

# 需要排除的目录和文件
$excludePatterns = @(
    'node_modules',
    '\.git',
    '\.vs',
    '\.idea',
    '\.vscode',
    'Thumbs\.db',
    'desktop\.ini',
    '\.exe$',
    '\.dll$',
    '\.so$',
    '\.dylib$',
    '\.bin$',
    '\.dat$',
    '\.db$'
)

function Convert-ToChinese {
    param(
        [string]$Text
    )
    
    $result = $Text
    
    # 按长度降序排序，避免部分匹配问题
    $sortedKeys = $translationMap.Keys | Sort-Object Length -Descending
    
    foreach ($key in $sortedKeys) {
        # 只替换完整的单词（前后有边界）
        $pattern = "\b$key\b"
        if ($result -match $pattern) {
            $result = $result -replace $pattern, $translationMap[$key]
        }
    }
    
    return $result
}

function Process-File {
    param(
        [string]$FilePath
    )
    
    Write-Host "  🔄 处理文件: $(Split-Path $FilePath -Leaf)" -ForegroundColor Gray
    
    try {
        # 读取文件内容
        $content = Get-Content $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        
        # 检查是否需要转换
        $needsConversion = $false
        foreach ($key in $translationMap.Keys) {
            if ($content -match "\b$key\b") {
                $needsConversion = $true
                break
            }
        }
        
        if (-not $needsConversion) {
            Write-Host "    ℹ️ 无需转换" -ForegroundColor Gray
            return
        }
        
        # 转换内容
        $convertedContent = Convert-ToChinese -Text $content
        
        if ($DryRun) {
            # 试运行：只显示差异
            if ($content -ne $convertedContent) {
                Write-Host "    📝 将修改内容" -ForegroundColor Yellow
                
                # 显示差异
                $diffLines = Compare-Object ($content -split "`n") ($convertedContent -split "`n") | 
                    Where-Object { $_.SideIndicator -eq "<=" -or $_.SideIndicator -eq "=>" } |
                    Select-Object -First 5
                
                if ($diffLines) {
                    Write-Host "    差异示例：" -ForegroundColor Gray
                    $diffLines | ForEach-Object {
                        $color = if ($_.SideIndicator -eq "<=") { "Red" } else { "Green" }
                        Write-Host "      $($_.SideIndicator) $($_.InputObject)" -ForegroundColor $color
                    }
                }
            }
        } else {
            # 实际写入
            $convertedContent | Out-File $FilePath -Encoding UTF8 -Force
            Write-Host "    ✅ 已转换" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "    ❌ 处理失败: $_" -ForegroundColor Red
    }
}

function Process-Directory {
    param(
        [string]$DirectoryPath
    )
    
    Write-Host "`n📁 处理目录: $(Split-Path $DirectoryPath -Leaf)" -ForegroundColor Yellow
    
    # 处理文件
    $files = Get-ChildItem $DirectoryPath -File | 
        Where-Object { 
            $fileExt = $_.Extension.ToLower()
            $fileName = $_.Name
            $fileTypes -contains $fileExt -and
            ($excludePatterns | Where-Object { $fileName -match $_ }).Count -eq 0
        }
    
    if ($files.Count -gt 0) {
        Write-Host "  找到 $($files.Count) 个文件需要处理" -ForegroundColor Gray
        foreach ($file in $files) {
            Process-File -FilePath $file.FullName
        }
    } else {
        Write-Host "  ℹ️ 没有需要处理的文件" -ForegroundColor Gray
    }
    
    # 递归处理子目录
    $subdirs = Get-ChildItem $DirectoryPath -Directory | 
        Where-Object { 
            $dirName = $_.Name
            ($excludePatterns | Where-Object { $dirName -match $_ }).Count -eq 0
        }
    
    foreach ($subdir in $subdirs) {
        Process-Directory -DirectoryPath $subdir.FullName
    }
}

# 主处理流程
Write-Host "`n🚀 开始转换..." -ForegroundColor Cyan

$startTime = Get-Date
Process-Directory -DirectoryPath $OpenClawDir
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n==========================================" -ForegroundColor Gray
Write-Host "🎉 转换完成！" -ForegroundColor Green
Write-Host "⏱️ 耗时: $($duration.TotalSeconds.ToString('F2')) 秒" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "📋 这是试运行，没有实际修改文件" -ForegroundColor Yellow
    Write-Host "   要实际转换，请运行: .\convert_to_chinese.ps1 -Backup" -ForegroundColor Gray
} else {
    Write-Host "✅ 所有配置文件已转换为中文" -ForegroundColor Green
    Write-Host "📦 备份已创建（如果启用）" -ForegroundColor Gray
}

Write-Host "`n🚀 重启OpenClaw使更改生效：" -ForegroundColor Cyan
Write-Host "  openclaw gateway restart" -ForegroundColor Green