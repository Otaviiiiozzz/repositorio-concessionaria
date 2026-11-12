/**
 * AutoPrime Motors - Diagnóstico de Conexão com o Banco de Dados
 * Testa a conectividade com o MySQL Workbench e reporta o status atual.
 */

import { testarConexao } from "./conexao.js";

async function main() {
    console.log("=============================================================");
    console.log("🔍 AutoPrime Motors - Diagnóstico de Conexão MySQL");
    console.log("=============================================================\n");

    try {
        const resultado = await testarConexao();

        if (resultado.modo === "mysql") {
            console.log("🎉 SUCESSO: O MySQL está ATIVO e CONECTADO!");
            console.log(`   Host:     ${resultado.config.host}:${resultado.config.port}`);
            console.log(`   Banco:    ${resultado.config.database}`);
            console.log(`   Usuário:  ${resultado.config.user}`);
            console.log("   Tabelas:  perfis, usuarios, categorias, veiculos, propostas\n");
            console.log("💡 Qualquer alteração feita via Front-end ou Thunder Client");
            console.log("   será refletida imediatamente no MySQL Workbench!\n");
            console.log("   Para visualizar no Workbench execute:");
            console.log("   SELECT * FROM concessionaria.veiculos;\n");
        } else {
            console.log("ℹ️  AVISO: MySQL não foi detectado.");
            console.log("   O sistema está operando no Modo Resiliente Local (JSON).");
            console.log("   Arquivo de dados: backend/database/dados_locais.json\n");
            console.log("💡 Para conectar ao MySQL Workbench:");
            console.log("   1. Certifique-se de que o serviço MySQL/MariaDB está em execução.");
            console.log("   2. Verifique as credenciais no arquivo backend/.env.");
            console.log("   3. Execute este diagnóstico novamente.\n");
        }
        process.exit(0);
    } catch (erro) {
        console.error("❌ Falha ao diagnosticar conexão:", erro.message);
        process.exit(1);
    }
}

main();
