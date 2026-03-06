@echo off
echo Starting Fire Extinguisher Management System...

start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start "Frontend App" cmd /k "cd frontend_new && npm run dev"

echo Servers are starting...
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:3000
pause
