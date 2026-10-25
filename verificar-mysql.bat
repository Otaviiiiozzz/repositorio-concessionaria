@echo off
chcp 65001 > nul
title AutoPrime - Diagnóstico de Conexão MySQL
echo =============================================================
echo 🔍 AutoPrime - Teste de Conexão com o MySQL Workbench
echo =============================================================
echo.

node -e "
import('./backend/database/conexao.js').then(async m => {
    try {
        const res = await m.testarConexao();
        if (res.modo === 'mysql') {
            console.log('🎉 SUCESSO: O MySQL está ATIVO e CONECTADO!');
            console.log('   Banco de Dados: ' + res.config.database);
            console.log('   Host:           ' + res.config.host + ':' + res.config.port);
            console.log('   Usuário:        ' + res.config.user);
            console.log('\n💡 Tudo o que você alterar no Thunder Client ou Frontend');
            console.log('   vai aparecer IMEDIATAMENTE no MySQL Workbench!');
            console.log('   Comando no Workbench: SELECT * FROM concessionaria.veiculos;\n');
        } else {
            console.log('⚠️  AVISO: MySQL não foi detectado.');
            console.log('   O backend vai rodar em Modo Local Resiliente (JSON).');
            console.log('\n💡 Para conectar ao MySQL Workbench:');
            console.log('   1. Abra o MySQL Workbench ou XAMPP e inicie o MySQL.');
            console.log('   2. Verifique se a senha no arquivo backend/.env está correta.');
            console.log('   3. Execute este teste novamente.\n');
        }
    } catch (e) {
        console.error('Erro ao testar:', e.message);
    }
    process.exit(0);
}).catch(err => {
    console.error('Falha ao carregar módulo:', err.message);
    process.exit(1);
});
"

echo =============================================================
pause
