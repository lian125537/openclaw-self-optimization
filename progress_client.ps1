# 带进度条的客户端
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 创建主窗口
$form = New-Object System.Windows.Forms.Form
$form.Text = "88技术助手 - 带进度监控"
$form.Size = New-Object System.Drawing.Size(900, 700)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)

# 标题
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "👨💻 88技术助手 - 实时进度监控"
$titleLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(400, 40)
$form.Controls.Add($titleLabel)

# 任务创建区域
$taskGroup = New-Object System.Windows.Forms.GroupBox
$taskGroup.Text = "创建新任务"
$taskGroup.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$taskGroup.ForeColor = [System.Drawing.Color]::White
$taskGroup.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$taskGroup.Location = New-Object System.Drawing.Point(20, 80)
$taskGroup.Size = New-Object System.Drawing.Size(400, 150)
$form.Controls.Add($taskGroup)

# 任务名称
$taskNameLabel = New-Object System.Windows.Forms.Label
$taskNameLabel.Text = "任务名称:"
$taskNameLabel.ForeColor = [System.Drawing.Color]::White
$taskNameLabel.Location = New-Object System.Drawing.Point(20, 30)
$taskNameLabel.Size = New-Object System.Drawing.Size(80, 25)
$taskGroup.Controls.Add($taskNameLabel)

$taskNameBox = New-Object System.Windows.Forms.TextBox
$taskNameBox.Location = New-Object System.Drawing.Point(110, 30)
$taskNameBox.Size = New-Object System.Drawing.Size(250, 25)
$taskNameBox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
$taskNameBox.BackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
$taskNameBox.ForeColor = [System.Drawing.Color]::White
$taskGroup.Controls.Add($taskNameBox)

# 任务时长
$durationLabel = New-Object System.Windows.Forms.Label
$durationLabel.Text = "预计时长(秒):"
$durationLabel.ForeColor = [System.Drawing.Color]::White
$durationLabel.Location = New-Object System.Drawing.Point(20, 70)
$durationLabel.Size = New-Object System.Drawing.Size(80, 25)
$taskGroup.Controls.Add($durationLabel)

$durationBox = New-Object System.Windows.Forms.NumericUpDown
$durationBox.Location = New-Object System.Drawing.Point(110, 70)
$durationBox.Size = New-Object System.Drawing.Size(100, 25)
$durationBox.Minimum = 10
$durationBox.Maximum = 600
$durationBox.Value = 30
$durationBox.BackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
$durationBox.ForeColor = [System.Drawing.Color]::White
$taskGroup.Controls.Add($durationBox)

# 创建任务按钮
$createTaskButton = New-Object System.Windows.Forms.Button
$createTaskButton.Text = "创建任务"
$createTaskButton.Location = New-Object System.Drawing.Point(220, 70)
$createTaskButton.Size = New-Object System.Drawing.Size(140, 25)
$createTaskButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9, [System.Drawing.FontStyle]::Bold)
$createTaskButton.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 215)
$createTaskButton.ForeColor = [System.Drawing.Color]::White
$createTaskButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$taskGroup.Controls.Add($createTaskButton)

# 进度监控区域
$progressGroup = New-Object System.Windows.Forms.GroupBox
$progressGroup.Text = "任务进度监控"
$progressGroup.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$progressGroup.ForeColor = [System.Drawing.Color]::White
$progressGroup.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$progressGroup.Location = New-Object System.Drawing.Point(20, 250)
$progressGroup.Size = New-Object System.Drawing.Size(850, 400)
$form.Controls.Add($progressGroup)

# 进度列表
$progressList = New-Object System.Windows.Forms.ListView
$progressList.Location = New-Object System.Drawing.Point(20, 30)
$progressList.Size = New-Object System.Drawing.Size(810, 350)
$progressList.View = [System.Windows.Forms.View]::Details
$progressList.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 40)
$progressList.ForeColor = [System.Drawing.Color]::White
$progressList.FullRowSelect = $true
$progressList.GridLines = $true
$progressList.Columns.Add("任务ID", 150) | Out-Null
$progressList.Columns.Add("任务名称", 200) | Out-Null
$progressList.Columns.Add("进度", 100) | Out-Null
$progressList.Columns.Add("状态", 100) | Out-Null
$progressList.Columns.Add("开始时间", 150) | Out-Null
$progressGroup.Controls.Add($progressList)

# 进度条显示
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(440, 100)
$progressBar.Size = New-Object System.Drawing.Size(400, 30)
$progressBar.Style = [System.Windows.Forms.ProgressBarStyle]::Continuous
$progressBar.BackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
$progressBar.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 100)
$form.Controls.Add($progressBar)

# 进度标签
$progressLabel = New-Object System.Windows.Forms.Label
$progressLabel.Text = "进度: 0%"
$progressLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 12, [System.Drawing.FontStyle]::Bold)
$progressLabel.ForeColor = [System.Drawing.Color]::LightGreen
$progressLabel.Location = New-Object System.Drawing.Point(440, 140)
$progressLabel.Size = New-Object System.Drawing.Size(200, 30)
$form.Controls.Add($progressLabel)

# 时间标签
$timeLabel = New-Object System.Windows.Forms.Label
$timeLabel.Text = "已用: 0秒 | 剩余: 0秒"
$timeLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$timeLabel.ForeColor = [System.Drawing.Color]::Cyan
$timeLabel.Location = New-Object System.Drawing.Point(440, 180)
$timeLabel.Size = New-Object System.Drawing.Size(300, 25)
$form.Controls.Add($timeLabel)

# 控制按钮
$refreshButton = New-Object System.Windows.Forms.Button
$refreshButton.Text = "刷新进度"
$refreshButton.Location = New-Object System.Drawing.Point(440, 220)
$refreshButton.Size = New-Object System.Drawing.Size(120, 30)
$refreshButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
$refreshButton.BackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
$refreshButton.ForeColor = [System.Drawing.Color]::White
$refreshButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($refreshButton)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = "取消选中任务"
$cancelButton.Location = New-Object System.Drawing.Point(580, 220)
$cancelButton.Size = New-Object System.Drawing.Size(120, 30)
$cancelButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
$cancelButton.BackColor = [System.Drawing.Color]::FromArgb(200, 50, 50)
$cancelButton.ForeColor = [System.Drawing.Color]::White
$cancelButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($cancelButton)

# 状态标签
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "状态: 就绪"
$statusLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$statusLabel.ForeColor = [System.Drawing.Color]::Yellow
$statusLabel.Location = New-Object System.Drawing.Point(20, 660)
$statusLabel.Size = New-Object System.Drawing.Size(300, 25)
$form.Controls.Add($statusLabel)

# 全局变量
$tasks = @{}
$refreshTimer = New-Object System.Windows.Forms.Timer
$refreshTimer.Interval = 1000  # 1秒刷新一次

# 创建任务函数
function Create-Task {
    $taskName = $taskNameBox.Text.Trim()
    $duration = $durationBox.Value
    
    if ([string]::IsNullOrEmpty($taskName)) {
        $statusLabel.Text = "状态: 请输入任务名称"
        $statusLabel.ForeColor = [System.Drawing.Color]::Red
        return
    }
    
    try {
        $body = @{
            taskName = $taskName
            totalSeconds = $duration
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/task/create" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.taskId) {
            $tasks[$response.taskId] = @{
                Name = $taskName
                StartTime = Get-Date
                Duration = $duration
            }
            
            $statusLabel.Text = "状态: 任务创建成功"
            $statusLabel.ForeColor = [System.Drawing.Color]::Green
            
            # 添加到列表
            $item = New-Object System.Windows.Forms.ListViewItem($response.taskId)
            $item.SubItems.Add($taskName)
            $item.SubItems.Add("0%")
            $item.SubItems.Add("创建")
            $item.SubItems.Add((Get-Date -Format "HH:mm:ss"))
            $progressList.Items.Add($item)
        }
    } catch {
        $statusLabel.Text = "状态: 创建任务失败"
        $statusLabel.ForeColor = [System.Drawing.Color]::Red
    }
}

# 刷新进度函数
function Refresh-Progress {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/task/list" -TimeoutSec 2
        
        $progressList.Items.Clear()
        
        foreach ($task in $response.tasks) {
            $item = New-Object System.Windows.Forms.ListViewItem($task.taskId)
            $item.SubItems.Add($task.taskName)
            $item.SubItems.Add("$($task.progress)%")
            $item.SubItems.Add($task.status)
            $item.SubItems.Add((Get-Date -Format "HH:mm:ss"))
            $progressList.Items.Add($item)
            
            # 更新进度条（显示第一个任务）
            if ($progressList.Items.Count -eq 1) {
                $progressBar.Value = $task.progress
                $progressLabel.Text = "进度: $($task.progress)%"
                
                if ($tasks.ContainsKey($task.taskId)) {
                    $taskInfo = $tasks[$task.taskId]
                    $elapsed = (Get-Date - $taskInfo.StartTime).TotalSeconds
                    $remaining = $taskInfo.Duration - $elapsed
                    if ($remaining -lt 0) { $remaining = 0 }
                    $timeLabel.Text = "已用: $([math]::Round($elapsed))秒 | 剩余: $([math]::Round($remaining))秒"
                }
            }
        }
        
        $statusLabel.Text = "状态: 已刷新 ($($response.count)个任务)"
        $statusLabel.ForeColor = [System.Drawing.Color]::Green
    } catch {
        $statusLabel.Text = "状态: 刷新失败"
        $statusLabel.ForeColor = [System.Drawing.Color]::Red
    }
}

# 取消任务函数
function Cancel-SelectedTask {
    if ($progressList.SelectedItems.Count -eq 0) {
        $statusLabel.Text = "状态: 请先选择任务"
        $statusLabel.ForeColor = [System.Drawing.Color]::Yellow
        return
    }
    
    $taskId = $progressList.SelectedItems[0].Text
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/task/$taskId/cancel" -Method Post -TimeoutSec 2
        
        $statusLabel.Text = "状态: 任务已取消"
        $statusLabel.ForeColor = [System.Drawing.Color]::Green
        
        # 从列表移除
        $progressList.SelectedItems[0].Remove()
    } catch {
        $statusLabel.Text = "状态: 取消任务失败"
        $statusLabel.ForeColor = [System.Drawing.Color]::Red
    }
}

# 事件处理
$createTaskButton.Add_Click({ Create-Task })
$refreshButton.Add_Click({ Refresh-Progress })
$cancelButton.Add_Click({ Cancel-SelectedTask })

$refreshTimer.Add_Tick({ Refresh-Progress })
$refreshTimer.Start()

# 窗口关闭时停止定时器
$form.Add_FormClosing({
    $refreshTimer.Stop()
})

# 初始化
$taskNameBox.Text = "系统清理任务"
Refresh-Progress

# 显示窗口
$form.Add_Shown({$form.Activate()})
[System.Windows.Forms.Application]::Run($form)