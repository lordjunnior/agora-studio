@echo off
setlocal
chcp 65001 >nul
rem Abre o painel completo da ÁGORA e prepara o editor visual.
cd /d "%~dp0."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Falta o Node.js neste computador. Instale o Node.js 20 ou mais novo.
  echo.
  pause
  exit /b 1
)

if not exist "editor\node_modules\vite\bin\vite.js" (
  echo Preparando o editor visual da ÁGORA...
  call npm ci --prefix editor
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias do editor.
    pause
    exit /b 1
  )
)

rem Biblioteca persistente de imagens, videos e audios.
start "AGORA Biblioteca" /min cmd /c "node motor\media-server.js"

rem O editor roda em segundo plano; o painel antigo continua disponivel.
start "AGORA Editor Visual" /min cmd /c "npm run editor"

node motor\painel.js --atalho
if errorlevel 1 pause
endlocal
