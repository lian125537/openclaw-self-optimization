# Fix memory file encoding - GB2312 to UTF-8
$files = @(
    "C:\Users\yodat\.openclaw\workspace\memory\2026-03-07.md",
    "C:\Users\yodat\.openclaw\workspace\memory\2026-03-11.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::GetEncoding('GB2312'))
        $newFile = $file -replace '.md$', '-fixed.md'
        [System.IO.File]::WriteAllText($newFile, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $file -> $newFile"
    }
}

Write-Host "Done!"