# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Start AI Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; .\.venv\Scripts\activate; python -m uvicorn app.main:app --reload --port 8000"

Write-Host "All 3 services (Backend, Frontend, AI Service) have been launched in separate terminal windows." -ForegroundColor Green
