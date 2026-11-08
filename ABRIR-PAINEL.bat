@echo off
chcp 65001 >nul
rem Abre o painel da ÁGORA no navegador: dois cliques neste arquivo.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Falta o Node.js neste computador. Abra a conversa com a IA e diga: instalar
  echo.
  pause
  exit /b 1
)
node motor\painel.js --atalho
if errorlevel 1 pause
timeout /t 10 >nul
