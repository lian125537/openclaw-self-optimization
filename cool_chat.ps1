# 炫酷简洁聊天框
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework  # 用于动画

# 创建主窗口
$form = New-Object System.Windows.Forms.Form
$form.Text = "✨ 88 - 智能助手"
$form.Size = New-Object System.Drawing.Size(1000, 700)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None  # 无边框
$form.BackColor = [System.Drawing.Color]::FromArgb(18, 18, 18)

# 标题栏（自定义）
$titleBar = New-Object System.Windows.Forms.Panel
$titleBar.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$titleBar.Location = New-Object System.Drawing.Point(0, 0)
$titleBar.Size = New-Object System.Drawing.Size(1000, 40)
$titleBar.MouseDown = {
    $form.Capture = $true
    $form.mousePos = [System.Windows.Forms.Cursor]::Position
}
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

# 副标题
$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "智能技术助手"
$subtitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subtitleLabel.ForeColor = [System.Drawing.Color]::FromArgb(150, 150, 150)
$subtitleLabel.Location = New-Object System.Drawing.Point(70, 12)
$subtitleLabel.Size = New-Object System.Drawing.Size(150, 20)
$titleBar.Controls.Add($subtitleLabel)

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

# 最小化按钮
$minButton = New-Object System.Windows.Forms.Button
$minButton.Text = "─"
$minButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$minButton.ForeColor = [System.Drawing.Color]::White
$minButton.BackColor = [System.Drawing.Color]::Transparent
$minButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$minButton.FlatAppearance.BorderSize = 0
$minButton.FlatAppearance.MouseOverBackColor = [System.Drawing.Color]::FromArgb(60, 60, 60)
$minButton.Size = New-Object System.Drawing.Size(40, 40)
$minButton.Location = New-Object System.Drawing.Point(920, 0)
$minButton.Add_Click({ $form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized })
$titleBar.Controls.Add($minButton)

# 聊天区域容器
$chatContainer = New-Object System.Windows.Forms.Panel
$chatContainer.BackColor = [System.Drawing.Color]::FromArgb(25, 25, 25)
$chatContainer.Location = New-Object System.Drawing.Point(0, 40)
$chatContainer.Size = New-Object System.Drawing.Size(1000, 560)
$chatContainer.AutoScroll = $true
$form.Controls.Add($chatContainer)

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
$quickTitle.Text = "快捷功能"
$quickTitle.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
$quickTitle.ForeColor = [System.Drawing.Color]::FromArgb(0, 200, 255)
$quickTitle.Location = New-Object System.Drawing.Point(20, 20)
$quickTitle.Size = New-Object System.Drawing.Size(200, 30)
$quickPanel.Controls.Add($quickTitle)

# 快捷按钮
$quickButtons = @(
    @{Text="🔍 系统检查"; Command="检查系统状态"},
    @{Text="🧹 清理优化"; Command="清理系统垃圾"},
    @{Text="🌐 网络测试"; Command="测试网络连接"},
    @{Text="📊 资源监控"; Command="查看系统资源"},
    @{Text="⚡ 性能加速"; Command="优化系统性能"},
    @{Text="📁 文件管理"; Command="打开文件管理器"},
    @{Text="🎯 任务计划"; Command="查看任务计划"},
    @{Text="🔧 设置"; Command="打开设置"}
)

$buttonY = 60
foreach ($btn in $quickButtons) {
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
    $button.Tag = $btn.Command
    
    $button.Add_Click({
        $command = $this.Tag
        Add-Message "你" $command $true
        # 这里可以执行命令
        Add-Message "88" "正在执行: $command" $false
    })
    
    $quickPanel.Controls.Add($button)
    $buttonY += 50
}

# 聊天消息容器
$chatMessages = New-Object System.Collections.ArrayList

# 添加消息函数
function Add-Message {
    param(
        [string]$sender,
        [string]$message,
        [bool]$isUser
    )
    
    $messagePanel = New-Object System.Windows.Forms.Panel
    $messagePanel.BackColor = if ($isUser) { [System.Drawing.Color]::FromArgb(0, 90, 180) } else { [System.Drawing.Color]::FromArgb(50, 50, 50) }
    $messagePanel.Size = New-Object System.Drawing.Size(650, 0)  # 高度自动调整
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
    $messageLabel.Size = New-Object System.Drawing.Size(620, 0)  # 高度自动调整
    $messageLabel.AutoSize = $true
    $messagePanel.Controls.Add($messageLabel)
    
    # 时间标签
    $timeLabel = New-Object System.Windows.Forms.Label
    $timeLabel.Text = Get-Date -Format "HH:mm:ss"
    $timeLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $timeLabel.ForeColor = [System.Drawing.Color]::FromArgb(150, 150, 150)
    $timeLabel.Location = New-Object System.Drawing.Point(550, 0)
    $timeLabel.Size = New-Object System.Drawing.Size(80, 20)
    $messagePanel.Controls.Add($timeLabel)
    
    # 调整面板高度
    $messagePanel.Height = $messageLabel.Height + 50
    
    # 设置位置
    $yPos = 20
    foreach ($msg in $chatMessages) {
        $yPos += $msg.Height + 10
    }
    
    $messagePanel.Location = New-Object System.Drawing.Point(270, $yPos)
    
    # 添加到容器和列表
    $chatContainer.Controls.Add($messagePanel)
    $chatMessages.Add($messagePanel) | Out-Null
    
    # 滚动到底部
    $chatContainer.VerticalScroll.Value = $chatContainer.VerticalScroll.Maximum
    $chatContainer.PerformLayout()
    
    # 动画效果
    $messagePanel.Opacity = 0
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 10
    $timer.Add_Tick({
        if ($messagePanel.Opacity -lt 1) {
            $messagePanel.Opacity += 0.1
        } else {
            $timer.Stop()
            $timer.Dispose()
        }
    })
    $timer.Start()
}

# 发送消息函数
function Send-Message {
    $message = $inputBox.Text.Trim()
    if ([string]::IsNullOrEmpty($message)) { return }
    
    Add-Message "你" $message $true
    $inputBox.Text = ""
    
    # 模拟AI回复
    $responses = @(
        "已收到你的指令，正在处理中...",
        "分析完成，开始执行任务",
        "任务执行中，请稍候",
        "处理完成，结果已就绪",
        "正在优化系统性能...",
        "网络连接测试中..."
    )
    
    $randomResponse = $responses | Get-Random
    Start-Sleep -Milliseconds 500
    Add-Message "88" $randomResponse $false
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
Add-Message "88" "我是你的技术伙伴，随时为你服务。" $false
Add-Message "88" "点击左侧快捷按钮或直接输入指令开始使用。" $false

# 显示窗口
$form.Add_Shown({$form.Activate()})
[System.Windows.Forms.Application]::Run($form)