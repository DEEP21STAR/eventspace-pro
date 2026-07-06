# serve.ps1 — local HTTP server for EVENTSPACE 3D demo (uses python http.server, no admin needed)
# Usage: pwsh serve.ps1
# Open: http://localhost:5050/threed-view-demo.html
$port = 5050
$root = $PSScriptRoot
if (-not $root) { $root = 'C:\EVENTSPACE' }
Write-Host "Serving $root on http://localhost:$port" -ForegroundColor Cyan
Write-Host "Open demo: http://localhost:$port/threed-view-demo.html" -ForegroundColor Yellow
Write-Host "Ctrl+C to stop`n"
Set-Location $root
py -m http.server $port
