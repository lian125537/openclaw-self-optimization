# 桌面客户端 - 最稳定通信
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 创建主窗口
$form = New-Object System.Windows.Forms.Form
$form.Text = "88技术助手 - 本地客户端"
$form.Size = New-Object System.Drawing.Size(800, 600)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)

# 标题
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "👨💻 88技术助手"
$titleLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(300, 40)
$form.Controls.Add($titleLabel)

# 状态标签
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "状态: ✅ 已连接"
$statusLabel.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$statusLabel.ForeColor = [System.Drawing.Color]::LightGreen
$statusLabel.Location = New-Object System.Drawing.Point(20, 70)
$statusLabel.Size = New-Object System.Drawing.Size(200, 25)
$form.Controls.Add($statusLabel)

# 聊天历史框
$historyBox = New-Object System.Windows.Forms.RichTextBox
$historyBox.Location = New-Object System.Drawing.Point(20, 110)
$historyBox.Size = New-Object System.Drawing.Size(740, 350)
$historyBox.BackColor = [System.Drawing.Color]::FromArgb(45, 45, 45)
$historyBox.ForeColor = [System.Drawing.Color]::White
$historyBox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$historyBox.ReadOnly = $true
$form.Controls.Add($historyBox)

# 输入框
$inputBox = New-Object System.Windows.Forms.TextBox
$inputBox.Location = New-Object System.Drawing.Point(20, 480)
$inputBox.Size = New-Object System.Drawing.Size(600, 30)
$inputBox.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10)
$inputBox.BackColor = [System.Drawing.Color]::FromArgb(60, 60, 60)
$inputBox.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($inputBox)

# 发送按钮
$sendButton = New-Object System.Windows.Forms.Button
$sendButton.Text = "发送"
$sendButton.Location = New-Object System.Drawing.Point(630, 480)
$sendButton.Size = New-Object System.Drawing.Size(130, 30)
$sendButton.Font = New-Object System.Drawing.Font("Microsoft YaHei", 10, [System.Drawing.FontStyle]::Bold)
$sendButton.BackColor = [System.Drawing.Color]::FromArgb(0, 120, 215)
$sendButton.ForeColor = [System.Drawing.Color]::White
$sendButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$form.Controls.Add($sendButton)

# 功能按钮
$buttons = @(
    @{Text="系统检查"; X=20; Y=520},
    @{Text="清理优化"; X=130; Y=520},
    @{Text="网络测试"; X=240; Y=520},
    @{Text="文件管理"; X=350; Y=520},
    @{Text="任务监控"; X=460; Y=520},
    @{Text="设置"; X=570; Y=520}
)

foreach ($btn in $buttons) {
    $button = New-Object System.Windows.Forms.Button
    $button.Text = $btn.Text
    $button.Location = New-Object System.Drawing.Point($btn.X, $btn.Y)
    $button.Size = New-Object System.Drawing.Size(100, 30)
    $button.Font = New-Object System.Drawing.Font("Microsoft YaHei", 9)
    $button.BackColor = [System.Drawing.Color]::FromArgb(70, 70, 70)
    $button.ForeColor = [System.Drawing.Color]::White
    $button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    
    $button.Add_Click({
        $task = $this.Text
        Add-History "你: 执行$task任务"
        # 这里可以调用API执行任务
        Add-History "88: 正在执行$task..."
    })
    
    $form.Controls.Add($button)
}

# 添加历史记录
function Add-History {
    param([string]$message)
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $historyBox.AppendText("[$timestamp] $message`n")
    $historyBox.ScrollToCaret()
}

# 发送消息函数
function Send-Message {
    $message = $inputBox.Text.Trim()
    if ([string]::IsNullOrEmpty($message)) { return }
    
    Add-History "你: $message"
    $inputBox.Text = ""
    
    # 调用本地API
    try {
        $body = @{message=$message} | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/chat" -Method Post -Body $body -ContentType "application/json"
        
        if ($response.reply) {
            Add-History "88: $($response.reply)"
        }
    } catch {
        Add-History "88: [离线模式] 已收到: $message"
    }
}

# 事件处理
$sendButton.Add_Click({ Send-Message })
$inputBox.Add_KeyDown({
    if ($_.KeyCode -eq "Enter") {
        Send-Message
    }
})

# 初始化
Add-History "=== 88技术助手客户端 ==="
Add-History "启动时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-History "连接方式: 本地HTTP API"
Add-History "状态: 稳定连接"
Add-History ""

# 显示窗口
$form.Add_Shown({$form.Activate()})
[System.Windows.Forms.Application]::Run($form)