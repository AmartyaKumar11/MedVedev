# Stop Medvedev dev servers: listeners on ports 8000 (API) and 3000 (Next.js).
# Run from repo root:  .\stop-medvedev.ps1
$ErrorActionPreference = "SilentlyContinue"

function Stop-PortListener {
    param([int]$Port)
    $pids = @()
    try {
        $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop |
            Select-Object -ExpandProperty OwningProcess -Unique)
    } catch {
        # Fallback: parse netstat (works if Get-NetTCPConnection unavailable)
        $lines = netstat -ano | Select-String -Pattern ":$Port\s"
        foreach ($line in $lines) {
            $parts = ($line.ToString().Trim() -split '\s+') | Where-Object { $_ -ne "" }
            if ($parts -contains "LISTENING") {
                $last = $parts[-1]
                if ($last -match '^\d+$') { $pids += [int]$last }
            }
        }
        $pids = $pids | Select-Object -Unique
    }
    foreach ($pid in ($pids | Select-Object -Unique)) {
        if ($pid -gt 0) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped PID $pid (port $Port)"
        }
    }
}

Write-Host "Stopping listeners on ports 8000 and 3000..."
Stop-PortListener -Port 8000
Stop-PortListener -Port 3000
Write-Host "Done."
