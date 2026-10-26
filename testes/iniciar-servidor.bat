@echo off
chcp 65001 > nul
title AutoPrime Concessionária - Servidor Backend
echo =======================================================
echo 🚗 AutoPrime Concessionária - Iniciando Servidor...
echo =======================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0backend"
node server.js
pause
