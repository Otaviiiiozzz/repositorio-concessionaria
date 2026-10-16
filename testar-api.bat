@echo off
chcp 65001 > nul
title AutoPrime - Testes Automatizados da API
echo =======================================================
echo 🧪 AutoPrime Concessionária - Executando Testes...
echo =======================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
node tests/test-api.js
pause
