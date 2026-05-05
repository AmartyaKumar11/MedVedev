# Start Medvedev V2 (Windows / PowerShell).
# Opens two cmd windows: backend (uvicorn) + web (next dev).
# Run:  .\start-medvedev.ps1
# Stop: close both cmd windows, or run  .\stop-medvedev.ps1
#
# PostgreSQL is NOT started here. The API connects via backend\.env DATABASE_URL.

$Root = $PSScriptRoot

$backendDir = Join-Path $Root 'backend'
$webDir = Join-Path $Root 'web'
$py = Join-Path $backendDir 'venv\Scripts\python.exe'

if (-not (Test-Path $backendDir)) { Write-Error ("Missing folder: {0}" -f $backendDir); exit 1 }
if (-not (Test-Path $webDir)) { Write-Error ("Missing folder: {0}" -f $webDir); exit 1 }
if (-not (Test-Path $py)) { Write-Error ("Python venv not found at: {0}" -f $py); exit 1 }

Write-Host ''
Write-Host 'NOTE: This script only starts the FastAPI app + Next.js.' -ForegroundColor Cyan
Write-Host '      PostgreSQL must already be running (API uses DATABASE_URL from backend\.env).' -ForegroundColor Cyan
Write-Host ''

try {
  $pg = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
  if ($pg -and $pg.TcpTestSucceeded) {
    Write-Host 'Port 5432 is reachable (PostgreSQL may be up).' -ForegroundColor DarkGreen
  } else {
    Write-Warning 'Nothing accepted a connection on 127.0.0.1:5432 — start the PostgreSQL Windows service if the API fails.'
  }
} catch {
  Write-Warning 'Could not probe port 5432; ensure PostgreSQL is running if the API fails.'
}

$backendCmd = ('"{0}" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000' -f $py)
$webCmd = 'npm run dev'

Start-Process -FilePath 'cmd.exe' -WorkingDirectory $backendDir -ArgumentList @('/k', $backendCmd) | Out-Null
Start-Process -FilePath 'cmd.exe' -WorkingDirectory $webDir -ArgumentList @('/k', $webCmd) | Out-Null

Write-Host ''
Write-Host 'Started:'
Write-Host '  Backend: http://127.0.0.1:8000'
Write-Host '  Web:     http://127.0.0.1:3000 (or next available port)'
Write-Host 'Stop: close both cmd windows, or run: .\stop-medvedev.ps1'

