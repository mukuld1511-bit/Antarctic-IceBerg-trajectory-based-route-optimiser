# ==============================================================================
# Antarctic Sea-Ice & Iceberg DSS — Master Multi-Service Launcher
# ==============================================================================

Clear-Host
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  ANTARCTIC SEA-ICE & NAVIGATION DECISION SUPPORT SYSTEM (DSS)" -ForegroundColor White
Write-Host "  MoES / National Centre for Polar and Ocean Research (NCPOR)" -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Select startup mode:" -ForegroundColor Yellow
Write-Host "  [1] Complete DSS App (Web UI + Server + Live AIS Stream) [Default]" -ForegroundColor White
Write-Host "  [2] Complete DSS App + Python FastAPI Backend (Port 8000)" -ForegroundColor White
Write-Host "  [3] Complete DSS App + n8n Automated Pipeline (Port 5678)" -ForegroundColor White
Write-Host "  [4] Run Instant Satellite Iceberg Sync" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4) [Default: 1]"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

switch ($choice) {
    "2" {
        Write-Host "`n[1/2] Starting Python FastAPI AI Microservice on port 8000..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "uvicorn backend.app.main:app --port 8000 --reload"
        Start-Sleep -Seconds 2
        Write-Host "[2/2] Starting Antarctic DSS Web Platform on port 3000..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
        npm run dev
    }
    "3" {
        Write-Host "`n[1/2] Starting n8n Workflow Automation Engine on port 5678..." -ForegroundColor Magenta
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx n8n"
        Start-Sleep -Seconds 3
        Write-Host "[2/2] Starting Antarctic DSS Web Platform on port 3000..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
        Start-Process "http://localhost:5678"
        npm run dev
    }
    "4" {
        Write-Host "`nRunning Satellite Iceberg Synchronization..." -ForegroundColor Yellow
        node scripts/sync_icebergs.js
        Pause
    }
    Default {
        Write-Host "`nStarting Antarctic DSS Platform on port 3000..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
        npm run dev
    }
}
