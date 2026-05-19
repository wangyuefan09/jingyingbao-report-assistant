@echo off
chcp 65001 >nul
echo 正在启动经营宝助手...
start "" "%~dp0dist\经营宝助手.exe"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
