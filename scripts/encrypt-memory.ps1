#!/usr/bin/env pwsh
# Safestore Memory Encryption for Elder
# Encrypts memory/*.md files using safestore with master password

param(
    [string]$Workspace = "$env:USERPROFILE\.openclaw\workspace",
    [string]$MemoryDir = "memory",
    [string]$PasswordFile = ".memory-encryption-key",  # stored locally, NOT committed
    [string]$SafestoreExe = "safestore",
    [switch]$Decrypt,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $Workspace "memory-encryption.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Get-MasterPassword {
    param([string]$PwdFile)
    if (Test-Path $PwdFile) {
        $pwd = Get-Content $PwdFile -Raw
        if ($pwd -and $pwd.Length -ge 32) {
            return $pwd
        }
    }
    # Generate new strong password
    $bytes = New-Object byte[] 32
    (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    $pwd = [Convert]::ToBase64String($bytes)
    Set-Content -Path $PwdFile -Value $pwd -Encoding UTF8
    Write-Log "Generated new master password and saved to $PwdFile"
    return $pwd
}

try {
    Write-Log "=== Memory Encryption $($Decrypt ? 'Decryption' : 'Encryption') Started ==="

    $memPath = Join-Path $Workspace $MemoryDir
    if (!(Test-Path $memPath)) {
        Write-Log "Memory directory not found: $memPath"
        exit 1
    }

    # Get master password
    $pwdFile = Join-Path $Workspace $PasswordFile
    $masterPwd = Get-MasterPassword -PwdFile $pwdFile

    # Find target files
    $files = Get-ChildItem -Path $memPath -Filter "*.md" -File | Where-Object { $_.Name -ne "README.md" }
    if ($files.Count -eq 0) {
        Write-Log "No .md files found in $memPath"
        exit 0
    }

    foreach ($file in $files) {
        $encFile = "$($file.FullName).enc"
        if ($Decrypt) {
            if (!(Test-Path $encFile)) {
                Write-Log "Skipped $($file.Name): no encrypted version found"
                continue
            }
            Write-Log "Decrypting $($file.Name) from $($file.Name).enc"
            & $SafestoreExe decrypt --password $masterPwd --input $encFile --output $file.FullName 2>&1 | ForEach-Object { Write-Log "safestore: $_" }
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ Decrypted $($file.Name)"
                if ($Force) {
                    Remove-Item $encFile -Force
                    Write-Log "  Removed encrypted file"
                }
            } else {
                Write-Log "✗ Decrypt failed for $($file.Name)"
            }
        } else {
            Write-Log "Encrypting $($file.Name) to $($file.Name).enc"
            & $SafestoreExe encrypt --password $masterPwd --input $file.FullName --output $encFile 2>&1 | ForEach-Object { Write-Log "safestore: $_" }
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ Encrypted $($file.Name)"
                if ($Force) {
                    # Optionally remove plaintext after successful encryption
                    # Remove-Item $file.FullName -Force
                    # Write-Log "  Removed plaintext version"
                }
            } else {
                Write-Log "✗ Encrypt failed for $($file.Name)"
            }
        }
    }

    Write-Log "=== Memory Encryption Completed ==="
    exit 0
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "=== Memory Encryption Failed ==="
    exit 1
}
