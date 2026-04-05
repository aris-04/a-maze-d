<<<<<<< HEAD
@echo off
title Maze Game Launcher
echo =========================================
echo    Starting the Maze Game Servers...
echo =========================================

:: 1. Start the Python Backend in a new window
echo Waking up FastAPI Backend...
start "Maze Backend" cmd /k "cd maze-backend && .\venv\Scripts\activate && uvicorn main:app --reload"

:: 2. Start the React Frontend in a new window
echo Waking up React Frontend...
start "Maze Frontend" cmd /k "cd maze-frontend && npm run dev"

echo.
echo Servers are launching! 
echo Once the Vite terminal says "ready", open your browser to:
echo http://localhost:5173/
echo.
=======
@echo off
title Maze Game Launcher
echo =========================================
echo    Starting the Maze Game Servers...
echo =========================================

:: 1. Start the Python Backend in a new window
echo Waking up FastAPI Backend...
start "Maze Backend" cmd /k "cd maze-backend && .\venv\Scripts\activate && uvicorn main:app --reload"

:: 2. Start the React Frontend in a new window
echo Waking up React Frontend...
start "Maze Frontend" cmd /k "cd maze-frontend && npm run dev"

echo.
echo Servers are launching! 
echo Once the Vite terminal says "ready", open your browser to:
echo http://localhost:5173/
echo.
>>>>>>> e99d963ce1c5a60605ded7e80b42fabac861d2cc
pause