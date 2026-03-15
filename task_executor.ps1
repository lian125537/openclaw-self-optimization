# 任务执行包装器 - 带倒计时显示
. "$PWD\task_timer.ps1"

function Execute-WithTimer {
    param(
        [string]$TaskName,
        [scriptblock]$ScriptBlock,
        [int]$EstimatedSeconds = 30,
        [string]$Description = ""
    )
    
    # 显示任务开始
    $timer = Show-TaskTimer -TaskName $TaskName -EstimatedSeconds $EstimatedSeconds
    
    if ($Description) {
        Write-Host "描述: $Description" -ForegroundColor Gray
    }
    
    try {
        # 执行任务
        $result = & $ScriptBlock
        
        # 标记完成
        Complete-TaskTimer -Timer $timer -Result "成功"
        
        return $result
    } catch {
        Complete-TaskTimer -Timer $timer -Result "失败: $_"
        throw $_
    }
}

# 示例使用：
# $result = Execute-WithTimer -TaskName "清理临时文件" -EstimatedSeconds 60 -Description "清理Windows和用户临时文件" -ScriptBlock {
#     Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
#     Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
#     return "清理完成"
# }