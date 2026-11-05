@echo off
chcp 65001 > nul
title AutoPrime - Restaurar Banco & Dados Originais
echo =======================================================
echo 🔄 Restaurando dados originais do AutoPrime...
echo =======================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
node "%~dp0..\backend\database\resetar.js"
echo.
pause
