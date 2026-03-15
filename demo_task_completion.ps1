# 演示增强版任务完成系统
# 展示成功、失败、部分成功三种情况

# 导入任务系统
. .\task_completion_system.ps1

Write-Host "🎭 演示增强版任务完成系统" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor DarkGray

# 演示1：成功任务
Write-Host "`n🎯 演示1：成功任务" -ForegroundColor Green

$task1 = Start-Task -TaskName "清理系统临时文件" -Description "清理Windows临时文件和浏览器缓存"

# 模拟成功执行
Start-Sleep -Seconds 1

Complete-Task -TaskInfo $task1 `
    -Status "成功" `
    -CompletedItems @(
        "清理Windows临时文件夹",
        "清理Chrome浏览器缓存", 
        "清理Edge浏览器缓存",
        "释放磁盘空间"
    ) `
    -CreatedFiles @(
        "cleanup_report.md",
        "$env:TEMP\cleanup.log"
    ) `
    -NextSteps @(
        "建议每周清理一次",
        "可以设置自动清理任务"
    )

# 演示2：部分成功任务
Write-Host "`n🎯 演示2：部分成功任务" -ForegroundColor Yellow

$task2 = Start-Task -TaskName "安装和配置新插件" -Description "安装三个新插件并配置"

# 模拟部分成功执行
Start-Sleep -Seconds 1

Complete-Task -TaskInfo $task2 `
    -Status "部分成功" `
    -CompletedItems @(
        "成功安装插件A",
        "成功配置插件A",
        "成功安装插件B"
    ) `
    -FailedItems @(
        "安装插件C失败：网络连接问题",
        "配置插件B失败：缺少依赖"
    ) `
    -CreatedFiles @(
        "plugins\plugin_a.json",
        "plugins\plugin_b.json"
    ) `
    -NextSteps @(
        "检查网络连接后重试插件C",
        "安装缺失的依赖包",
        "测试已安装的插件功能"
    )

# 演示3：失败任务
Write-Host "`n🎯 演示3：失败任务" -ForegroundColor Red

$task3 = Start-Task -TaskName "连接到远程数据库" -Description "连接到MySQL数据库并导入数据"

# 模拟失败执行
Start-Sleep -Seconds 1

Complete-Task -TaskInfo $task3 `
    -Status "失败" `
    -ErrorMessage "无法连接到数据库服务器：连接超时 (30秒)" `
    -AttemptedSolutions @(
        "检查数据库服务器地址",
        "验证网络连接",
        "检查防火墙设置",
        "尝试不同的端口"
    ) `
    -FailedItems @(
        "数据库连接失败",
        "数据导入未执行"
    ) `
    -NextSteps @(
        "确认数据库服务器是否运行",
        "检查网络配置",
        "联系数据库管理员"
    ) `
    -CanRetry $true

# 演示4：带错误信息的任务
Write-Host "`n🎯 演示4：带详细错误的任务" -ForegroundColor Magenta

$task4 = Start-Task -TaskName "编译项目代码" -Description "编译TypeScript项目为JavaScript"

# 模拟带详细错误的失败
Start-Sleep -Seconds 1

Complete-Task -TaskInfo $task4 `
    -Status "失败" `
    -ErrorMessage @"
编译错误：类型不匹配
文件：src/main.ts (第42行)
错误：TS2322: Type 'string' is not assignable to type 'number'.
代码：const count: number = "123";
建议：将字符串转换为数字或修改变量类型
"@ `
    -AttemptedSolutions @(
        "检查类型定义",
        "查看相关文档",
        "运行类型检查"
    ) `
    -FailedItems @(
        "编译失败，生成0个文件",
        "类型检查未通过"
    ) `
    -NextSteps @(
        "修复第42行的类型错误",
        "重新运行编译",
        "运行完整的类型检查"
    ) `
    -CanRetry $true

# 显示所有任务历史
Write-Host "`n📊 所有演示任务历史" -ForegroundColor Cyan
Show-TaskHistory -Limit 10

# 创建任务报告总结
Write-Host "`n📈 任务统计总结" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor DarkGray

$historyFile = "$env:USERPROFILE\.openclaw\task_history.json"
if (Test-Path $historyFile) {
    $history = Get-Content $historyFile -Raw | ConvertFrom-Json
    
    $totalTasks = $history.Count
    $successTasks = ($history | Where-Object { $_.Completion.Status -eq "成功" }).Count
    $partialTasks = ($history | Where-Object { $_.Completion.Status -eq "部分成功" }).Count
    $failedTasks = ($history | Where-Object { $_.Completion.Status -eq "失败" }).Count
    
    $successRate = if ($totalTasks -gt 0) { ($successTasks / $totalTasks * 100).ToString("F1") } else { "0.0" }
    
    Write-Host "📊 任务统计：" -ForegroundColor Yellow
    Write-Host "  总任务数: $totalTasks" -ForegroundColor Gray
    Write-Host "  成功: $successTasks ($successRate%)" -ForegroundColor Green
    Write-Host "  部分成功: $partialTasks" -ForegroundColor Yellow
    Write-Host "  失败: $failedTasks" -ForegroundColor Red
    
    # 平均耗时
    $avgDuration = if ($totalTasks -gt 0) { 
        ($history | Measure-Object -Property Completion.Duration -Average).Average.ToString("F1")
    } else { "0.0" }
    
    Write-Host "  平均耗时: ${avgDuration}秒" -ForegroundColor Gray
    
    # 可重试的任务
    $retryableTasks = ($history | Where-Object { $_.Completion.CanRetry -eq $true }).Count
    if ($retryableTasks -gt 0) {
        Write-Host "  可重试任务: $retryableTasks" -ForegroundColor Cyan
    }
}

Write-Host "`n🎯 总结：现在每次任务完成后都会明确报告成功与否！" -ForegroundColor Green