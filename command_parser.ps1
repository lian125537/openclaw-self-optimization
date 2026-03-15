# 智能指令解析器 - 将普通聊天转为专业指令
function Parse-UserCommand {
    param(
        [string]$UserInput
    )
    
    # 指令模式识别
    $patterns = @{
        # 文件操作
        "打开.*文件" = "FILE_OPEN"
        "创建.*文件" = "FILE_CREATE"
        "删除.*文件" = "FILE_DELETE"
        "查看.*文件" = "FILE_READ"
        
        # 系统操作
        "打开.*软件" = "APP_LAUNCH"
        "关闭.*软件" = "APP_CLOSE"
        "检查.*系统" = "SYSTEM_CHECK"
        "优化.*系统" = "SYSTEM_OPTIMIZE"
        
        # 网络操作
        "检查.*网络" = "NETWORK_CHECK"
        "测试.*连接" = "NETWORK_TEST"
        "搜索.*信息" = "WEB_SEARCH"
        
        # 任务管理
        "执行.*任务" = "TASK_EXECUTE"
        "监控.*进度" = "TASK_MONITOR"
        "清理.*空间" = "SYSTEM_CLEANUP"
        
        # 信息查询
        "查看.*状态" = "STATUS_CHECK"
        "获取.*信息" = "INFO_GET"
        "分析.*数据" = "DATA_ANALYZE"
    }
    
    # 识别指令类型
    $commandType = "GENERAL"
    $matchedPattern = ""
    
    foreach ($pattern in $patterns.Keys) {
        if ($UserInput -match $pattern) {
            $commandType = $patterns[$pattern]
            $matchedPattern = $pattern
            break
        }
    }
    
    # 提取关键参数
    $parameters = @{
        Target = ""
        Action = ""
        Options = @()
    }
    
    # 根据指令类型提取参数
    switch ($commandType) {
        "FILE_OPEN" {
            $parameters.Action = "OPEN"
            if ($UserInput -match "打开(.+?)文件") {
                $parameters.Target = $matches[1].Trim()
            }
        }
        "APP_LAUNCH" {
            $parameters.Action = "LAUNCH"
            if ($UserInput -match "打开(.+?)软件") {
                $parameters.Target = $matches[1].Trim()
            }
        }
        "SYSTEM_CHECK" {
            $parameters.Action = "CHECK"
            $parameters.Target = "SYSTEM"
        }
        "SYSTEM_CLEANUP" {
            $parameters.Action = "CLEANUP"
            if ($UserInput -match "清理(.+?)空间") {
                $parameters.Target = $matches[1].Trim()
            }
        }
        default {
            $parameters.Action = "PROCESS"
            $parameters.Target = "UNKNOWN"
        }
    }
    
    # 生成专业指令
    $professionalCommand = @{
        OriginalInput = $UserInput
        CommandType = $commandType
        MatchedPattern = $matchedPattern
        Parameters = $parameters
        Timestamp = Get-Date
        Confidence = if ($commandType -ne "GENERAL") { "HIGH" } else { "MEDIUM" }
    }
    
    return $professionalCommand
}

function Format-ProfessionalResponse {
    param(
        [hashtable]$ParsedCommand
    )
    
    $output = @()
    
    # 指令确认
    $output += "🔍 **指令解析完成**"
    $output += "原始输入: `"$($ParsedCommand.OriginalInput)`""
    $output += "指令类型: **$($ParsedCommand.CommandType)**"
    $output += "匹配模式: $($ParsedCommand.MatchedPattern)"
    $output += "置信度: $($ParsedCommand.Confidence)"
    
    # 参数展示
    if ($ParsedCommand.Parameters.Target) {
        $output += "目标: **$($ParsedCommand.Parameters.Target)**"
    }
    if ($ParsedCommand.Parameters.Action) {
        $output += "操作: **$($ParsedCommand.Parameters.Action)**"
    }
    
    # 建议行动
    $suggestions = @{
        "FILE_OPEN" = "立即定位并打开指定文件"
        "APP_LAUNCH" = "搜索并启动指定应用程序"
        "SYSTEM_CHECK" = "执行全面系统健康检查"
        "SYSTEM_CLEANUP" = "分析并清理指定空间"
        "NETWORK_CHECK" = "测试网络连接和速度"
        "TASK_EXECUTE" = "创建任务计划并执行"
        "GENERAL" = "进行语义分析并推荐最佳行动"
    }
    
    $suggestion = $suggestions[$ParsedCommand.CommandType]
    if ($suggestion) {
        $output += "建议行动: $suggestion"
    }
    
    $output += "---"
    
    return $output -join "`n"
}

# 示例使用
# $cmd = Parse-UserCommand "帮我打开PS软件"
# Format-ProfessionalResponse $cmd