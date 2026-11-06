@echo off
rem Blissful Tour: backend (Django, 8000) va frontend (Vite, 3000)
rem Backend oynasi avval migratsiyalarni qo'llaydi, keyin serverni ishga tushiradi
cd /d "%~dp0backend"
start "Blissful Tour - backend" cmd /k "venv\Scripts\python.exe manage.py migrate && venv\Scripts\python.exe manage.py runserver 8000"
cd /d "%~dp0frontend"
start "Blissful Tour - frontend" cmd /k "npm run dev"
