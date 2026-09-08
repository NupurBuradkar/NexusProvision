Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    Starting NexusProvision Platform...   " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Launch Backend in a dedicated window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Starting FastAPI Backend...' -ForegroundColor Green; python -m uvicorn app.main:app --reload --port 8000"

# Launch Frontend in a dedicated window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Starting Vite Frontend...' -ForegroundColor Cyan; npm run dev"

# Wait 3 seconds for servers to initialize, then launch the browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "SUCCESS: NexusProvision services are launching!" -ForegroundColor Green
Write-Host "  -> Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  -> Backend:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  -> API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host ""
