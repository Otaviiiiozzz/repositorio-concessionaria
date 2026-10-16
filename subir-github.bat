@echo off
chcp 65001 > nul
title AutoPrime - Subir para o GitHub
echo =======================================================
echo 🚀 Enviando o projeto para o GitHub (repositorio-concessionaria)...
echo =======================================================
git push -u origin main
echo.
echo Se o envio foi concluído, seu GitHub já está atualizado!
echo.
pause
