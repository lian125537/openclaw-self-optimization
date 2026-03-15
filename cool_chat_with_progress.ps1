# 炫酷聊天框 - 带进度条版本
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 导入进度功能
. "$PWD\progress_integration.ps1"

# 创建主窗口
$form = New-Object System.Windows.Forms.Form
$form.Text = "✨ 88 - 智能助手"
$form.Size = New-Object System.Drawing.Size(1000, 700)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)

# 标题栏
$titleBar = New-Object System.Windows.Forms.Panel
$titleBar.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$titleBar.Location = New-Object System.Drawing.Point(0, 0)
$titleBar.Size = New-Object System.Drawing.Size(1000, 40)
$titleBar.MouseDown = { $form.Capture = $true; $form.mousePos = [System.Windows.Forms.Cursor]::Position }
$titleBar.MouseMove = {
    if ($form.Capture) {
        $mousePos = [System.Windows.Forms.Cursor]::Position
        $delta = New-Object System.Drawing.Point($mousePos.X - $form.mousePos.X, $mousePos.Y - $form.mousePos.Y)
        $form.Location = New-Object System.Drawing.Point($form.Location.X + $delta.X, $form.Location.Y + $delta.Y)
        $form.mousePos = $mousePos
    }
}
$titleBar.MouseUp = { $form.Capture = $false }
$form.Controls.Add($titleBar)

# 标题
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "✨ 88"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 255)
$titleLabel.Location = New-Object System.Drawing.Point(15, 8)
$titleLabel.Size = New-Object System.Drawing.Size(100, 30)
$titleBar.Controls.Add($titleLabel)

# 关闭按钮
$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = "✕"
$closeButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$closeButton.ForeColor = [System.Drawing.Color]::White
$closeButton.BackColor = [System.Drawing.Color]::Transparent
$closeButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$closeButton.FlatAppearance.BorderSize = 0
$closeButton.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(255, 50, 50)
$closeButton.Size = New-Object System.Drawing.Size(40, 40)
$closeButton.Location = New-Object System.Drawing.Point(960, 0)
$closeButton.Add_Click({ $form.Close() })
$titleBar.Controls.Add($closeButton)

# 聊天区域容器
$global:chatContainer = New-Object System.Windows.Forms.Panel
$global:chatContainer.BackColor = [System.Drawing.Color]::FromArgb(25, 25, 25)
$global:chatContainer.Location = New-Object System.Drawing.Point(0, 40)
$global:chatContainer.Size = New-Object System.Drawing.Size(1000, 560)
$global:chatContainer.AutoScroll = $true
$form.Controls.Add($global:chatContainer)

# 输入区域
$inputPanel = New-Object System.Windows.Forms.Panel
$inputPanel.BackColor = [System.Drawing.Color]::FromArgb(35, 35, 35)
$inputPanel.Location = New-Object System.Drawing.Point(0, 600)
$inputPanel.Size = New-Object System.Drawing.Size(1000, 100)
$form.Controls.Add($inputPanel)

# 输入框
$inputBox = New-Object System.Windows.Forms.RichTextBox
$inputBox.Location = New-Object System.Drawing.Point(20, 15)
$inputBox.Size = New-Object System.Drawing.Size(800, 70)
$inputBox.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$inputBox.ForeColor = [System.Drawing.Color]::White
$inputBox.Font = New-Object System.Drawing.Font("Segoe UI", 11)
$inputBox.BorderStyle = [System.Windows.Forms.BorderStyle]::None
$inputBox.ScrollBars = [System.Windows.Forms.RichTextBoxScrollBars]::Vertical
$inputPanel.Controls.Add($inputBox)

# 发送按钮
$sendButton = New-Object System.Windows.Forms.Button
$sendButton.Text = "发送"
$sendButton.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$sendButton.ForeColor = [System.Drawing.Color]::White
$sendButton.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 215)
$sendButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$sendButton.FlatAppearance.BorderSize = 0
$sendButton.Size = New-Object System.Drawing.Size(120, 70)
$sendButton.Location = New-Object System.Drawing.Point(840, 15)
$sendButton.Cursor = [System.Windows.Forms.Cursors]::Hand
$inputPanel.Controls.Add($sendButton)

# 快捷按钮面板
$quickPanel = New-Object System.Windows.Forms.Panel
$quickPanel.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$quickPanel.Location = New-Object System.Drawing.Point(0, 40)
$quickPanel.Size = New-Object System.Drawing.Size(250, 560)
$form.Controls.Add($quickPanel)

# 快捷按钮标题
$quickTitle = New-Object System.Windows.Forms.Label
$quickTitle.Text = "快捷任务"
$quickTitle.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$quickTitle.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 255)
$quickTitle.Location = New-Object System.Drawing.Point(20, 20)
$quickTitle.Size = New-Object System.Drawing.Size(200, 30)
$quickPanel.Controls.Add($quickTitle)

# 进度任务按钮
$progressButtons = @(
    @{Text="🔍 系统检查 (30秒)"; Task="系统全面检查"; Seconds=30},
    @{Text="🧹 清理优化 (45秒)"; Task="系统清理优化"; Seconds=45},
    @{Text="🌐 网络测试 (20秒)"; Task="网络连接测试"; Seconds=20},
    @{Text="📊 资源监控 (25秒)"; Task="资源使用监控"; Seconds=25},
    @{Text="⚡ 性能加速 (40秒)"; Task="系统性能加速"; Seconds=40},
    @{Text="🔄 更新检查 (15秒)"; Task="系统更新检查"; Seconds=15}
)

$buttonY = 60
foreach ($btn in $progressButtons) {
    $button = New-Object System.Windows.Forms.Button
    $button.Text = $btn.Text
    $button.Font = New-Object System.Drawing.Font("Segoe UI", 10)
    $button.ForeColor = [System.Drawing.Color]::White
    $button.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
    $button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $button.FlatAppearance.BorderSize = 0
    $button.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
    $button.Size = New-Object System.Drawing.Size(210, 40)
    $button.Location = New-Object System.Drawing.Point(20, $buttonY)
    $button.Cursor = [System.Windows.Forms.Cursors]::Hand
    $button.Tag = $btn
    
    $button.Add_Click({
        $taskInfo = $this.Tag
        Add-Message "你" "开始任务: $($taskInfo.Task)" $true
        
        # 启动进度任务
        $taskScript = {
            # 模拟任务执行
            $steps = @("准备...", "执行中...", "处理数据...", "完成检查...", "生成报告...")
            foreach ($step in $steps) {
                Start-Sleep -Seconds ($using:taskInfo.Seconds / $steps.Count)
                $step
            }
            "✅ 任务完成"
        }
        
        Start-ProgressTask -taskName $taskInfo.Task -totalSeconds $taskInfo.Seconds -taskScript $taskScript
    })
    
    $quickPanel.Controls.Add($button)
    $buttonY += 50
}

# 添加消息函数
function Add-Message {
    param(
        [string]$sender,
        [string]$message,
        [bool]$isUser
    )
    
    $messagePanel = New-Object System.Windows.Forms.Panel
    $messagePanel.BackColor = if ($isUser) { [System.Drawing.Color]::FromArgb(0, 90, 180) } else { [System.Drawing.Color]::FromArgb(50, 50, 50) }
    $messagePanel.Size = New-Object System.Drawing.Size(650, 0)
    $messagePanel.Padding = New-Object System.Windows.Forms.Padding(15, 15, 15, 15)
    
    # 发送者标签
    $senderLabel = New-Object System.Windows.Forms.Label
    $senderLabel.Text = $sender
    $senderLabel.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $senderLabel.ForeColor = if ($isUser) { [System.Drawing.Color]::FromArgb(180, 220, 255) } else { [System.Drawing.Color]::FromArgb(0, 200, 255) }
    $senderLabel.Location = New-Object System.Drawing.Point(0, 0)
    $senderLabel.Size = New-Object System.Drawing.Size(100, 20)
    $messagePanel.Controls.Add($senderLabel)
    
    # 消息内容
    $messageLabel = New-Object System.Windows.Forms.Label
    $messageLabel.Text = $message
    $messageLabel.Font = New-Object System.Drawing.Font("Segoe UI", 11)
    $messageLabel.ForeColor = [System.Drawing.Color]::White
    $messageLabel.Location = New-Object System.Drawing.Point(0, 25)
    $messageLabel.Size = New-Object System.Drawing.Size(620, 0)
    $messageLabel.AutoSize = $true
    $messagePanel.Controls.Add($messageLabel)
    
    # 调整面板高度
    $messagePanel.Height = $messageLabel.Height + 50
    
    # 设置位置
    $yPos = 20
    foreach ($control in $global:chatContainer.Controls) {
        if ($control.GetType().Name -eq "Panel") {
            $yPos += $control.Height + 10
        }
    }
    
    $messagePanel.Location = New-Object System.Drawing.Point(270, $yPos)
    $global:chatContainer.Controls.Add($messagePanel)
    
    # 滚动到底部
    $global:chatContainer.VerticalScroll.Value = $global:chatContainer.VerticalScroll.Maximum
    $global:chatContainer.PerformLayout()
}

# 发送消息函数
function Send-Message {
    $message = $inputBox.Text.Trim()
    if ([string]::IsNullOrEmpty($message)) { return }
    
    Add-Message "你" $message $true
    $inputBox.Text = ""
    
    # 检查是否是进度任务指令
    if ($message -match "进度|任务|执行|检查|清理|优化|测试") {
        Add-Message "88" "检测到任务指令，正在启动进度监控..." $false
        
        # 启动示例进度任务
        $task = Start-SystemCheckTask
    } else {
        # 普通回复
        $responses = @(
            "已收到消息，正在处理...",
            "分析完成，准备执行",
            "任务已加入队列",
            "正在优化处理流程...",
            "准备就绪，等待指令"
        )
        
        $randomResponse = $responses | Get-Random
        Add-Message "88" $randomResponse $false
    }
}

# 事件处理
$sendButton.Add_Click({ Send-Message })
$inputBox.Add_KeyDown({
    if ($_.KeyCode -eq "Enter" -and $_.Control) {
        Send-Message
        $_.SuppressKeyPress = $true
    }
})

# 初始化欢迎消息
Add-Message "88" "✨ 欢迎使用88智能助手！" $false
Add-Message "88" "现在支持实时进度条显示任务执行！" $false
Add-Message "88" "点击左侧任务按钮或输入指令开始使用。" $false

# 显示窗口
$form.Add_Shown({$form.Activate()})
[System.Windows.Forms.Application]::Run($form)