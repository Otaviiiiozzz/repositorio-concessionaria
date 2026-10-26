@echo off
chcp 65001 > nul
title AutoPrime - Iniciar Servidor MySQL
echo =============================================================
echo 🗄️  AutoPrime - Inicializador do Servidor MySQL
echo =============================================================
echo.

set INICIADO=0

rem 1. Tenta iniciar binario do MariaDB instalado localmente
if exist "C:\Program Files\MariaDB 13.0\bin\mysqld.exe" (
    echo [1/3] Iniciando motor MySQL local (C:\Program Files\MariaDB 13.0)...
    start /b "" "C:\Program Files\MariaDB 13.0\bin\mysqld.exe" --console
    set INICIADO=1
)

rem 2. Tenta iniciar servicos do Windows conhecidos
echo [2/3] Verificando servicos do Windows (MySQL, MariaDB, MySQL80)...
net start MySQL >nul 2>&1
net start MariaDB >nul 2>&1
net start MySQL80 >nul 2>&1

echo [3/3] Aguardando inicializacao do servidor...
timeout /t 2 >nul

echo.
echo =============================================================
echo 🔍 Testando conexao com o banco...
echo =============================================================
node -e "
import('./backend/database/conexao.js').then(async m => {
    const res = await m.testarConexao();
    if (res.modo === 'mysql') {
        console.log('\n🎉 O SERVIDOR MYSQL ESTA PRONTO E CONECTADO!');
        console.log('   Abra o MySQL Workbench e veja o banco: ' + res.config.database + '\n');
    } else {
        console.log('\n⚠️  Nao foi possivel detectar o MySQL ativo.');
    }
    process.exit(0);
}).catch(() => process.exit(1));
"

echo =============================================================
pause
