@echo off
rem Serves the guide folder on a local port so YouTube embeds work,
rem then opens the guide in the default browser.
cd /d "%~dp0"
netstat -ano | findstr /C:":8765 " >nul
if errorlevel 1 (
  start "How-To Guide Server" /min python -m http.server 8765
  timeout /t 1 /nobreak >nul
)
start "" http://localhost:8765/index.html
