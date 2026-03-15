#!/usr/bin/env pwsh
# Autobiography Updater for Elder
# Auto-appends today's summary to MEMORY.md based on daily log

param(
    [string]$Workspace = "$env:USERPROFILE\.openclaw\workspace",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$Today = Get-Date -Format "yyyy-MM-dd"
$DailyLog = Join-Path $Workspace "memory\$Today.md"
$MemoryMd = Join-Path $Workspace "MEMORY.md"
$LogFile = Join-Path $Workspace "autobiography-update.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

try {
    Write-Log "=== Autobiography Update Started ==="

    if (!(Test-Path $DailyLog)) {
        Write-Log "No daily log found for $Today at $DailyLog. Skipping."
        exit 0
    }

    # Check if MEMORY.md already has an entry for today (match "## 2026-03-11 " at line start)
    $hasEntry = $false
    if (Test-Path $MemoryMd) {
        $hasEntry = Select-String -Path $MemoryMd -Pattern "^## $Today\b" -Quiet
    }

    if ($hasEntry -and !$Force) {
        Write-Log "MEMORY.md already contains entry for $Today. Skipping (use -Force to override)."
        exit 0
    }

    # Extract first ~30 lines of daily log for summary
    $summaryLines = Get-Content $DailyLog -TotalCount 30
    $summary = $summaryLines -join "`n"

    # Build entry
    $entry = @"
---

## $Today - Auto-generated Entry

$summary
"@

    # Ensure MEMORY.md exists
    if (!(Test-Path $MemoryMd)) {
        Write-Log "Creating new MEMORY.md"
        "# Elder's Memory - Auto-Archive`n`nThis file is auto-updated by autobiography script." | Set-Content $MemoryMd
    }

    # Record original length to detect changes
    $originalLength = (Get-Item $MemoryMd).Length

    # Append entry
    Add-Content -Path $MemoryMd -Value $entry
    $newLength = (Get-Item $MemoryMd).Length

    if ($newLength -eq $originalLength) {
        Write-Log "No changes made to MEMORY.md (entry may be empty). Skipping git."
        exit 0
    }

    Write-Log "Appended entry for $Today to MEMORY.md (size: $originalLength -> $newLength bytes)"

    # Git operations
    Push-Location $Workspace
    git add MEMORY.md 2>&1 | ForEach-Object { Write-Log "git: $_" }
    $commitMsg = "auto: append $Today daily log to MEMORY.md"
    git commit -m $commitMsg 2>&1 | ForEach-Object { Write-Log "git: $_" }
    # Try push, if fails try pull and push again
    $pushOutput = git push origin master 2>&1
    $pushOutput | ForEach-Object { Write-Log "git: $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Push failed, attempting to pull and re-push..."
        git pull origin master --rebase 2>&1 | ForEach-Object { Write-Log "git: $_" }
        git push origin master 2>&1 | ForEach-Object { Write-Log "git: $_" }
    }
    Pop-Location

    Write-Log "=== Autobiography Update Completed ==="
    exit 0
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "=== Autobiography Update Failed ==="
    exit 1
}
