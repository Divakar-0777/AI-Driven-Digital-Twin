@echo off
echo Starting AI Digital Twin services...

start "Backend Server" cmd /k "cd backend && npm run dev"
start "Frontend Client" cmd /k "cd frontend && npm run dev"
start "AI Service" cmd /k "cd ai-service && call .venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000"

echo All services started!
