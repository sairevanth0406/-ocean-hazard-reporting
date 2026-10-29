# Pravaah Background Workers Launcher
Write-Host "Starting Pravaah Background Workers..." -ForegroundColor Cyan

# 1. Weather Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; `$env:PYTHONUTF8='1'; cd '$PSScriptRoot'; .\venv\Scripts\activate; python -u -m app.workers.manage weather"
Write-Host "Started Weather Worker (window opened)" -ForegroundColor Green

# 2. Peer Notification Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; `$env:PYTHONUTF8='1'; cd '$PSScriptRoot'; .\venv\Scripts\activate; python -u -m app.workers.manage peer"
Write-Host "Started Peer Notification Worker (window opened)" -ForegroundColor Green

# 3. NLP Worker
$aiDir = Join-Path (Split-Path $PSScriptRoot -Parent) "ai"
if (Test-Path $aiDir) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; `$env:PYTHONUTF8='1'; cd '$aiDir'; .\venv\Scripts\activate; python -u worker.py"
    Write-Host "Started NLP Worker (window opened)" -ForegroundColor Green
}

Write-Host "`nAll verification workers are running in separate windows!" -ForegroundColor Yellow
