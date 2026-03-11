#!/usr/bin/env pwsh
# Memory Auto-Sync Script for OpenClaw Elder
# Syncs local memory files to/from GitHub daily

param(
    [string]$Workspace = "$env:USERPROFILE\.openclaw\workspace",
    [string]$RepoUrl = "https://github.com/lian125537/openclaw-self-optimization",
    [string]$Branch = "master",
    [ValidateSet("pull","push","both")]
    [string]$Action = "both"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$LogFile = Join-Path $Workspace "memory-sync.log"

function Write-Log {
    param([string]$Message)
    $logEntry = "[$Timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Ensure-Backup {
    $backupDir = Join-Path $Workspace ("backup_{0:yyyyMMdd_HHmmss}" -f (Get-Date))
    Write-Log "Creating backup at $backupDir"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item (Join-Path $Workspace "*") $backupDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Backup complete"
}

function Git-Command {
    param([string]$Cmd)
    $gitPath = "git"
    $args = @("-C", $Workspace) + $Cmd -split ' '
    & $gitPath @args 2>&1 | ForEach-Object { Write-Log "git: $_" }
    if ($LASTEXITCODE -ne 0) { throw "Git command failed: $Cmd" }
}

try {
    Write-Log "=== Memory Sync Started ==="

    # Change to workspace
    Push-Location $Workspace

    # Ensure git remote exists
    $remotes = Git-Command "remote -v"
    if ($remotes -notmatch "origin") {
        Write-Log "Adding remote origin: $RepoUrl"
        Git-Command "remote add origin $RepoUrl"
    } else {
        Write-Log "Remote origin already exists"
    }

    if ($Action -in "pull", "both") {
        Write-Log "Pulling from GitHub..."
        Git-Command "fetch origin"
        # Try fast-forward merge, fallback to reset if needed
        try {
            Git-Command "merge origin/$Branch --ff-only"
        } catch {
            Write-Log "Fast-forward failed, resetting to origin/$Branch"
            Git-Command "reset --hard origin/$Branch"
        }
        Write-Log "Pull complete"
    }

    if ($Action -in "push", "both") {
        Write-Log "Preparing to push..."

        # Add all memory files
        Git-Command "add memory/ MEMORY.md SOUL.md IDENTITY.md USER.md"

        # Check if there are changes to commit
        $status = Git-Command "status --porcelain"
        if ($status) {
            $commitMsg = "Auto-sync: Memory update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            Git-Command "commit -m `"$commitMsg`""
            Write-Log "Committed changes"
        } else {
            Write-Log "No changes to commit"
        }

        Write-Log "Pushing to GitHub..."
        Git-Command "push origin $Branch"
        Write-Log "Push complete"
    }

    Pop-Location
    Write-Log "=== Memory Sync Completed Successfully ==="
    exit 0
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "=== Memory Sync Failed ==="
    exit 1
}
