@echo off
chcp 65001 > nul
title AutoPrime - Diagnóstico de Conexão MySQL
echo =============================================================
echo 🔍 AutoPrime - Teste de Conexão com o MySQL Workbench
echo =============================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
node "%~dp0backend\database\testar-conexao.js"
echo =============================================================
pause
