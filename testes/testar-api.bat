@echo off
chcp 65001 > nul
title AutoPrime - Testes Automatizados E2E
echo =======================================================
echo 🚗 AutoPrime - Executando Suíte de Testes Automatizados...
echo =======================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0.."
node tests/test-api.js
pause
