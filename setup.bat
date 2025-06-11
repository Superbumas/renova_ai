@echo off
echo Setting up RenovaAI...

echo.
echo Copying environment file...
if not exist .env (
    copy env.example .env
    echo Please edit .env file with your API keys before running the application
) else (
    echo .env file already exists
)

echo.
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo Setup complete!
echo.
echo To run the application:
echo 1. Edit .env file with your API keys
echo 2. Run: docker-compose up (for Docker)
echo    OR
echo    Run backend: cd backend && python app.py
echo    Run frontend: cd frontend && npm start
pause 