# 进度条集成到炫酷聊天框
function Add-ProgressBar {
    param(
        [string]$taskName,
        [int]$totalSeconds
    )
    
    # 创建进度容器
    $progressContainer = New-Object System.Windows.Forms.Panel
    $progressContainer.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 40)
    $progressContainer.Size = New-Object System.Drawing.Size(650, 120)
    $progressContainer.Padding = New-Object System.Windows.Forms.Padding(15, 15, 15, 15)
    
    # 任务标题
    $taskTitle = New-Object System.Windows.Forms.Label
    $taskTitle.Text = "📊 $taskName"
    $taskTitle.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $taskTitle.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 255)
    $taskTitle.Location = New-Object System.Drawing.Point(0, 0)
    $taskTitle.Size = New-Object System.Drawing.Size(400, 25)
    $progressContainer.Controls.Add($taskTitle)
    
    # 进度条
    $progressBar = New-Object System.Windows.Forms.ProgressBar
    $progressBar.Location = New-Object System.Drawing.Point(0, 35)
    $progressBar.Size = New-Object System.Drawing.Size(620, 25)
    $progressBar.Style = [System.Windows.Forms.ProgressBarStyle]::Continuous
    $progressBar.BackColor = [System.Drawing.Color]::FromArgb(60, 60, 60)
    $progressBar.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 100)
    $progressContainer.Controls.Add($progressBar)
    
    # 进度百分比
    $progressLabel = New-Object System.Windows.Forms.Label
    $progressLabel.Text = "0%"
    $progressLabel.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $progressLabel.ForeColor = [System.Drawing.Color]::LightGreen
    $progressLabel.Location = New-Object System.Drawing.Point(0, 65)
    $progressLabel.Size = New-Object System.Drawing.Size(100, 25)
    $progressContainer.Controls.Add($progressLabel)
    
    # 时间统计
    $timeLabel = New-Object System.Windows.Forms.Label
    $timeLabel.Text = "已用: 0秒 | 剩余: ${totalSeconds}秒"
    $timeLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $timeLabel.ForeColor = [System.Drawing.Color]::Cyan
    $timeLabel.Location = New-Object System.Drawing.Point(120, 65)
    $timeLabel.Size = New-Object System.Drawing.Size(300, 25)
    $progressContainer.Controls.Add($timeLabel)
    
    # 状态标签
    $statusLabel = New-Object System.Windows.Forms.Label
    $statusLabel.Text = "状态: 准备开始"
    $statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
    $statusLabel.Location = New-Object System.Drawing.Point(450, 65)
    $statusLabel.Size = New-Object System.Drawing.Size(200, 25)
    $progressContainer.Controls.Add($statusLabel)
    
    # 添加到聊天框
    $yPos = 20
    foreach ($control in $global:chatContainer.Controls) {
        $yPos += $control.Height + 10
    }
    
    $progressContainer.Location = New-Object System.Drawing.Point(270, $yPos)
    $global:chatContainer.Controls.Add($progressContainer)
    
    # 返回进度对象用于更新
    return @{
        Container = $progressContainer
        ProgressBar = $progressBar
        ProgressLabel = $progressLabel
        TimeLabel = $timeLabel
        StatusLabel = $statusLabel
        TaskName = $taskName
        TotalSeconds = $totalSeconds
        StartTime = Get-Date
        CurrentProgress = 0
    }
}

function Update-Progress {
    param(
        [hashtable]$progressObj,
        [int]$newProgress
    )
    
    $progressObj.CurrentProgress = $newProgress
    $progressObj.ProgressBar.Value = $newProgress
    $progressObj.ProgressLabel.Text = "$newProgress%"
    
    # 计算时间
    $elapsed = (Get-Date - $progressObj.StartTime).TotalSeconds
    $remaining = $progressObj.TotalSeconds * (100 - $newProgress) / 100
    
    $progressObj.TimeLabel.Text = "已用: $([math]::Round($elapsed))秒 | 剩余: $([math]::Round($remaining))秒"
    
    # 更新状态
    if ($newProgress -lt 100) {
        $progressObj.StatusLabel.Text = "状态: 进行中"
        $progressObj.StatusLabel.ForeColor = [System.Drawing.Color]::Yellow
    } else {
        $progressObj.StatusLabel.Text = "状态: ✅ 完成"
        $progressObj.StatusLabel.ForeColor = [System.Drawing.Color]::LightGreen
    }
}

function Start-ProgressTask {
    param(
        [string]$taskName,
        [int]$totalSeconds,
        [scriptblock]$taskScript
    )
    
    # 添加进度条到聊天框
    $progress = Add-ProgressBar -taskName $taskName -totalSeconds $totalSeconds
    
    # 在后台执行任务
    $job = Start-Job -ScriptBlock $taskScript -Name $taskName
    
    # 启动进度更新定时器
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 1000  # 1秒更新一次
    
    $timer.Add_Tick({
        if ($job.State -eq "Running") {
            # 计算进度（基于时间）
            $elapsed = (Get-Date - $progress.StartTime).TotalSeconds
            $newProgress = [math]::Min(100, [math]::Round(($elapsed / $progress.TotalSeconds) * 100))
            
            Update-Progress -progressObj $progress -newProgress $newProgress
            
            # 如果任务完成
            if ($job.State -eq "Completed") {
                $timer.Stop()
                Update-Progress -progressObj $progress -newProgress 100
                $progress.StatusLabel.Text = "状态: ✅ 任务完成"
                $progress.StatusLabel.ForeColor = [System.Drawing.Color]::LightGreen
            }
        } else {
            $timer.Stop()
        }
    })
    
    $timer.Start()
    
    return @{
        Job = $job
        Timer = $timer
        Progress = $progress
    }
}

# 示例任务
function Start-SystemCheckTask {
    $task = Start-ProgressTask -taskName "系统全面检查" -totalSeconds 30 -taskScript {
        # 模拟系统检查任务
        Start-Sleep -Seconds 5
        "1. 检查网络连接..."
        
        Start-Sleep -Seconds 5
        "2. 检查系统资源..."
        
        Start-Sleep -Seconds 5
        "3. 检查磁盘空间..."
        
        Start-Sleep -Seconds 5
        "4. 检查服务状态..."
        
        Start-Sleep -Seconds 5
        "5. 生成检查报告..."
        
        Start-Sleep -Seconds 5
        "✅ 系统检查完成"
    }
    
    return $task
}