# 极简学习记录 - 无阻塞，纯英文，快速执行
param($Type, $Content)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$record = @"
## [$timestamp] Quick Learning
**Type**: $Type
**Content**: $Content
**System**: Minimal record for speed
---
"@

Add-Content -Path "C:\Users\yodat\.openclaw\workspace\.learnings\MINIMAL_LEARNINGS.md" -Value $record
Write-Host "✓ Recorded: $Type"