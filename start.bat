@echo off
echo ================================================
echo   EduBridge - Parent-Student Engagement Platform
echo ================================================
echo.

echo [1/3] Installing Node.js dependencies...
cd /d "%~dp0"
call npm install

echo.
echo [2/3] Starting Python Analytics Service...
start "EduBridge Analytics" cmd /c "cd analytics && pip install -r requirements.txt >nul 2>&1 && python app.py"

echo.
echo [3/3] Starting Node.js Server...
echo.
node server/server.js
