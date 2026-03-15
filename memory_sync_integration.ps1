# 🚀 OpenClaw记忆系统与Google Drive集成

Write-Host "🚀 OpenClaw记忆系统与Google Drive集成" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor DarkGray

# 配置信息
$openclawMemoryPath = "$env:USERPROFILE\.openclaw\workspace\memory"
$googleDriveConfig = "google_drive_integration\config"

Write-Host "📊 系统配置：" -ForegroundColor Yellow
Write-Host "  OpenClaw记忆路径: $openclawMemoryPath" -ForegroundColor Gray
Write-Host "  Google Drive配置: $googleDriveConfig" -ForegroundColor Gray

# 1. 确保本地记忆目录存在
Write-Host "`n1. 📁 准备本地记忆目录..." -ForegroundColor Yellow
if (-not (Test-Path $openclawMemoryPath)) {
    New-Item -ItemType Directory -Path $openclawMemoryPath -Force | Out-Null
    Write-Host "  ✅ 创建本地记忆目录" -ForegroundColor Green
} else {
    Write-Host "  ✅ 本地记忆目录已存在" -ForegroundColor Green
}

# 2. 创建记忆同步脚本
Write-Host "`n2. 🔄 创建记忆同步脚本..." -ForegroundColor Yellow

$syncScript = @'
# OpenClaw记忆同步脚本
# 自动同步本地记忆到Google Drive

param(
    [string]$Action = "sync",  # sync, upload, download, status
    [string]$FilePath,
    [switch]$Force
)

# 加载配置
$configPath = Join-Path $PSScriptRoot "google_drive_integration\config\google_drive_config.json"
$tokenPath = Join-Path $PSScriptRoot "google_drive_integration\config\tokens.json"
$folderPath = Join-Path $PSScriptRoot "google_drive_integration\config\folders.json"

if (-not (Test-Path $configPath) -or -not (Test-Path $tokenPath)) {
    Write-Host "❌ Google Drive配置未找到，请先完成集成配置" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$tokens = Get-Content $tokenPath -Raw | ConvertFrom-Json
$folders = if (Test-Path $folderPath) { Get-Content $folderPath -Raw | ConvertFrom-Json } else { @{} }

# 记忆路径
$localMemoryPath = Join-Path $PSScriptRoot "memory"
$memoryFolderId = $folders.memory_folder_id

# 获取有效访问令牌
function Get-ValidAccessToken {
    # 检查令牌是否过期
    $tokenAge = (Get-Date) - [datetime]::ParseExact($tokens.created_at, "yyyy-MM-dd HH:mm:ss", $null)
    
    if ($tokenAge.TotalSeconds -gt ($tokens.expires_in - 300)) {
        Write-Host "🔄 刷新访问令牌..." -ForegroundColor Yellow
        Refresh-AccessToken
    }
    
    return $tokens.access_token
}

# 刷新访问令牌
function Refresh-AccessToken {
    $refreshUrl = "https://oauth2.googleapis.com/token"
    $body = @{
        client_id = $config.google_drive.client_id
        client_secret = $config.google_drive.client_secret
        refresh_token = $tokens.refresh_token
        grant_type = "refresh_token"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $refreshUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded" -ErrorAction Stop
        
        $tokens.access_token = $response.access_token
        $tokens.expires_in = $response.expires_in
        $tokens.created_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        
        $tokens | ConvertTo-Json -Depth 3 | Out-File $tokenPath -Encoding UTF8
        Write-Host "  ✅ 令牌刷新成功" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ 令牌刷新失败: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# 上传文件到Google Drive
function Upload-ToGoogleDrive {
    param($localPath, $remoteName)
    
    $accessToken = Get-ValidAccessToken
    $content = Get-Content $localPath -Raw -Encoding UTF8
    
    $url = "https://www.googleapis.com/drive/v3/files"
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    # 创建文件元数据
    $metadata = @{
        name = $remoteName
        parents = @($memoryFolderId)
    } | ConvertTo-Json
    
    try {
        # 创建文件
        $file = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $metadata -ErrorAction Stop
        
        # 上传内容
        $uploadUrl = "https://www.googleapis.com/upload/drive/v3/files/$($file.id)?uploadType=media"
        $uploadHeaders = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "text/plain"
        }
        
        Invoke-RestMethod -Uri $uploadUrl -Method Patch -Headers $uploadHeaders -Body $content -ErrorAction Stop | Out-Null
        
        Write-Host "  ✅ 上传成功: $remoteName ($([math]::Round($content.Length/1KB,2))KB)" -ForegroundColor Green
        return $file.id
        
    } catch {
        Write-Host "  ❌ 上传失败: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 从Google Drive下载文件
function Download-FromGoogleDrive {
    param($fileId, $localPath)
    
    $accessToken = Get-ValidAccessToken
    $url = "https://www.googleapis.com/drive/v3/files/$fileId?alt=media"
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    try {
        $content = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        
        # 确保目录存在
        $directory = Split-Path $localPath -Parent
        if (-not (Test-Path $directory)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        
        $content | Out-File $localPath -Encoding UTF8 -Force
        Write-Host "  ✅ 下载成功: $(Split-Path $localPath -Leaf) ($([math]::Round($content.Length/1KB,2))KB)" -ForegroundColor Green
        
        return $true
    } catch {
        Write-Host "  ❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 列出Google Drive中的记忆文件
function List-GoogleDriveFiles {
    $accessToken = Get-ValidAccessToken
    $url = "https://www.googleapis.com/drive/v3/files"
    $query = "mimeType='text/plain' and '$memoryFolderId' in parents and trashed=false"
    $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
    
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$url?q=$encodedQuery&fields=files(id,name,size,modifiedTime)" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($response.files) {
            Write-Host "📁 Google Drive记忆文件 ($($response.files.Count)个):" -ForegroundColor Yellow
            foreach ($file in $response.files) {
                $sizeKB = if ($file.size) { [math]::Round($file.size/1KB,2) } else { "未知" }
                Write-Host "  • $($file.name) ($sizeKB KB) - $($file.modifiedTime)" -ForegroundColor Gray
            }
        } else {
            Write-Host "📁 Google Drive中没有记忆文件" -ForegroundColor Gray
        }
        
        return $response.files
    } catch {
        Write-Host "  ❌ 列出文件失败: $($_.Exception.Message)" -ForegroundColor Red
        return @()
    }
}

# 同步本地记忆到Google Drive
function Sync-Memories {
    Write-Host "🔄 同步记忆到Google Drive..." -ForegroundColor Cyan
    
    # 获取本地记忆文件
    $localFiles = Get-ChildItem $localMemoryPath -Recurse -File -Include "*.md", "*.json", "*.txt" | 
        Where-Object { $_.FullName -notlike "*\.sync*" }
    
    Write-Host "  本地记忆文件: $($localFiles.Count)个" -ForegroundColor Gray
    
    $uploadCount = 0
    foreach ($file in $localFiles) {
        $relativePath = $file.FullName.Replace($localMemoryPath, '').TrimStart('\')
        
        # 检查是否已同步
        $syncState = Get-SyncState $relativePath
        if (-not $syncState -or $file.LastWriteTime -gt $syncState.last_sync_time -or $Force) {
            Write-Host "  上传: $relativePath" -ForegroundColor Gray
            $fileId = Upload-ToGoogleDrive -localPath $file.FullName -remoteName $relativePath
            
            if ($fileId) {
                Update-SyncState $relativePath @{
                    remote_id = $fileId
                    last_sync_time = Get-Date
                    local_modified = $file.LastWriteTime
                    size = $file.Length
                }
                $uploadCount++
            }
        }
    }
    
    Write-Host "  ✅ 同步完成，上传了 $uploadCount 个文件" -ForegroundColor Green
}

# 获取同步状态
function Get-SyncState($relativePath) {
    $stateFile = Join-Path $localMemoryPath ".sync_states.json"
    
    if (Test-Path $stateFile) {
        $states = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
        if ($states.ContainsKey($relativePath)) {
            return $states[$relativePath]
        }
    }
    
    return $null
}

# 更新同步状态
function Update-SyncState($relativePath, $state) {
    $stateFile = Join-Path $localMemoryPath ".sync_states.json"
    $states = @{}
    
    if (Test-Path $stateFile) {
        $states = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
    }
    
    $states[$relativePath] = $state
    $states | ConvertTo-Json -Depth 3 | Out-File $stateFile -Encoding UTF8
}

# 主逻辑
switch ($Action) {
    "sync" {
        Sync-Memories
    }
    "upload" {
        if ($FilePath -and (Test-Path $FilePath)) {
            $relativePath = (Get-Item $FilePath).Name
            Upload-ToGoogleDrive -localPath $FilePath -remoteName $relativePath
        } else {
            Write-Host "❌ 请指定有效的文件路径" -ForegroundColor Red
        }
    }
    "download" {
        Write-Host "下载功能待实现..." -ForegroundColor Yellow
    }
    "status" {
        Write-Host "📊 记忆同步状态" -ForegroundColor Cyan
        Write-Host "=" * 40 -ForegroundColor DarkGray
        
        # 本地文件统计
        $localFiles = Get-ChildItem $localMemoryPath -Recurse -File -Include "*.md", "*.json", "*.txt" | 
            Where-Object { $_.FullName -notlike "*\.sync*" }
        
        Write-Host "📁 本地记忆: $($localFiles.Count)个文件" -ForegroundColor White
        
        # Google Drive文件
        $driveFiles = List-GoogleDriveFiles
        
        # 同步状态
        $stateFile = Join-Path $localMemoryPath ".sync_states.json"
        if (Test-Path $stateFile) {
            $states = Get-Content $stateFile -Raw | ConvertFrom-Json -AsHashtable
            Write-Host "🔄 已同步: $($states.Count)个文件" -ForegroundColor White
        }
        
        Write-Host "=" * 40 -ForegroundColor DarkGray
    }
    default {
        Write-Host "用法: .\memory_sync.ps1 [sync|upload|download|status]" -ForegroundColor Yellow
        Write-Host "  sync    - 同步所有记忆文件" -ForegroundColor White
        Write-Host "  upload  - 上传指定文件" -ForegroundColor White
        Write-Host "  download - 从Google Drive下载" -ForegroundColor White
        Write-Host "  status  - 查看同步状态" -ForegroundColor White
    }
}
'@

$syncScriptPath = "memory_sync.ps1"
$syncScript | Out-File $syncScriptPath -Encoding UTF8
Write-Host "  ✅ 记忆同步脚本已创建: $syncScriptPath" -ForegroundColor Green

# 3. 创建自动同步任务
Write-Host "`n3. ⏰ 创建自动同步任务..." -ForegroundColor Yellow

$taskScript = @'
# 自动记忆同步任务
# 每30分钟自动同步记忆到Google Drive

$syncScript = Join-Path $PSScriptRoot "memory_sync.ps1"

# 检查是否在运行
$processName = "powershell"
$running = Get-Process $processName -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*memory_sync.ps1*" }

if ($running) {
    Write-Host "🔄 记忆同步已在运行，跳过本次同步" -ForegroundColor Yellow
    exit 0
}

# 执行同步
Write-Host "🔄 开始自动记忆同步..." -ForegroundColor Cyan
Write-Host "时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

try {
    & $syncScript -Action sync
    Write-Host "✅ 自动同步完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 自动同步失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 记录日志
$logDir = "$env:USERPROFILE\.openclaw\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$logFile = Join-Path $logDir "memory_sync_$(Get-Date -Format 'yyyyMMdd').log"
"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - 自动同步完成" | Out-File $logFile -Append -Encoding UTF8
'@

$taskScriptPath = "auto_sync.ps1"
$taskScript | Out-File $taskScriptPath -Encoding UTF8
Write-Host "  ✅ 自动同步脚本已创建: $taskScriptPath" -ForegroundColor Green

# 4. 创建Windows计划任务
Write-Host "`n4. 📅 创建Windows计划任务..." -ForegroundColor Yellow

$taskXml = @'
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>OpenClaw记忆自动同步到Google Drive</Description>
    <Author>OpenClaw System</Author>
  </RegistrationInfo>
  <Triggers>
    <TimeTrigger>
      <Repetition>
        <Interval>PT30M</Interval>
      </Repetition>
      <StartBoundary>2026-03-04T10:00:00</StartBoundary>
      <Enabled>true</Enabled>
    </TimeTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>true</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetwork