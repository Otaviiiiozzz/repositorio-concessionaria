/**
 * AutoPrime Concessionária - Suíte de Testes Automatizados da API
 * Executa testes end-to-end nas rotas da API e valida os códigos de status e respostas.
 *
 * Como rodar:
 *   1. Em um terminal, inicie o backend: cd backend && npm start
 *   2. Em outro terminal: node tests/test-api.js
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";

let totalTestes = 0;
let aprovados = 0;
let falhas = 0;

function registrarResultado(titulo, passou, detalhe = "") {
    totalTestes++;
    if (passou) {
        aprovados++;
        console.log(`  \x1b[32m✔ [PASSOU]\x1b[0m ${titulo}`);
    } else {
        falhas++;
        console.log(`  \x1b[31m✖ [FALHOU]\x1b[0m ${titulo}`);
        if (detalhe) console.log(`    \x1b[33m${detalhe}\x1b[0m`);
    }
}

async function executarTestes() {
    console.log("\n=======================================================");
    console.log(`🚗 Iniciando Suíte de Testes da API AutoPrime`);
    console.log(`🎯 Alvo: ${BASE_URL}`);
    console.log("=======================================================\n");

    try {
        // 1. Teste Healthcheck
        console.log("🔹 1. Testando rota raiz (Documentação / Healthcheck)...");
        const resRaiz = await fetch(`${BASE_URL}/`);
        const dadosRaiz = await resRaiz.json();
        registrarResultado(
            "GET / responde com status 200",
            resRaiz.status === 200,
            `Status recebido: ${resRaiz.status}`
        );
        registrarResultado(
            "GET / retorna objeto com rotas",
            dadosRaiz && !!dadosRaiz.documentacao
        );

        // 2. Teste GET /veiculos
        console.log("\n🔹 2. Testando listagem geral (GET /veiculos)...");
        const resListar = await fetch(`${BASE_URL}/veiculos`);
        const veiculos = await resListar.json();
        registrarResultado(
            "GET /veiculos responde com status 200",
            resListar.status === 200,
            `Status: ${resListar.status}`
        );
        registrarResultado(
            "GET /veiculos retorna array de veículos",
            Array.isArray(veiculos) && veiculos.length > 0,
            `Itens retornados: ${Array.isArray(veiculos) ? veiculos.length : "não é array"}`
        );

        // 3. Teste GET /veiculos/resumo
        console.log("\n🔹 3. Testando resumo estatístico (GET /veiculos/resumo)...");
        const resResumo = await fetch(`${BASE_URL}/veiculos/resumo`);
        const resumo = await resResumo.json();
        registrarResultado(
            "GET /veiculos/resumo responde com 200",
            resResumo.status === 200
        );
        registrarResultado(
            "GET /veiculos/resumo contém totalVeiculos e valorTotalEstoque",
            typeof resumo.totalVeiculos === "number" && typeof resumo.valorTotalEstoque === "number",
            `Dados: ${JSON.stringify(resumo)}`
        );

        // 4. Teste GET /veiculos/:id
        console.log("\n🔹 4. Testando busca por ID (GET /veiculos/:id)...");
        const primeiroId = veiculos[0]?.id || 1;
        const resId = await fetch(`${BASE_URL}/veiculos/${primeiroId}`);
        const veiculoId = await resId.json();
        registrarResultado(
            `GET /veiculos/${primeiroId} responde com status 200`,
            resId.status === 200
        );
        registrarResultado(
            `Veículo retornado possui modelo e fabricante`,
            veiculoId && !!veiculoId.modelo && !!veiculoId.fabricante
        );

        // 5. Teste POST /veiculos
        console.log("\n🔹 5. Testando cadastro de novo veículo (POST /veiculos)...");
        const novoCarro = {
            modelo: "Polo Track 1.0",
            fabricante: "Volkswagen",
            ano: 2024,
            quilometragem: 5000,
            preco: 87900.00
        };

        const resPost = await fetch(`${BASE_URL}/veiculos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoCarro)
        });
        const dadosPost = await resPost.json();
        registrarResultado(
            "POST /veiculos responde com status 201 (Created)",
            resPost.status === 201,
            `Status: ${resPost.status}`
        );
        registrarResultado(
            "POST /veiculos retorna ID do novo registro",
            dadosPost && !!dadosPost.id
        );

        const idCriado = dadosPost?.id;

        // 6. Teste PUT /veiculos/:id
        if (idCriado) {
            console.log(`\n🔹 6. Testando atualização de veículo (PUT /veiculos/${idCriado})...`);
            const dadosAtualizados = {
                modelo: "Polo Track 1.0 Edição Especial",
                fabricante: "Volkswagen",
                ano: 2024,
                quilometragem: 6500,
                preco: 89900.00
            };

            const resPut = await fetch(`${BASE_URL}/veiculos/${idCriado}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosAtualizados)
            });
            const dadosPut = await resPut.json();
            registrarResultado(
                `PUT /veiculos/${idCriado} responde com status 200`,
                resPut.status === 200,
                `Status: ${resPut.status}`
            );
            registrarResultado(
                "PUT atualizou o modelo com sucesso",
                dadosPut?.veiculo?.modelo === dadosAtualizados.modelo
            );

            // 7. Teste DELETE /veiculos/:id
            console.log(`\n🔹 7. Testando exclusão de veículo (DELETE /veiculos/${idCriado})...`);
            const resDelete = await fetch(`${BASE_URL}/veiculos/${idCriado}`, {
                method: "DELETE"
            });
            registrarResultado(
                `DELETE /veiculos/${idCriado} responde com status 200`,
                resDelete.status === 200,
                `Status: ${resDelete.status}`
            );

            // 8. Confirmar que veículo foi excluído (404)
            console.log(`\n🔹 8. Verificando que o veículo foi realmente removido...`);
            const resGetExcluido = await fetch(`${BASE_URL}/veiculos/${idCriado}`);
            registrarResultado(
                `GET /veiculos/${idCriado} após DELETE responde com 404 (Not Found)`,
                resGetExcluido.status === 404,
                `Status: ${resGetExcluido.status}`
            );
        }

        // 9. Teste de Validação de Erro 400
        console.log("\n🔹 9. Testando validação de dados inválidos (POST com erro)...");
        const carroInvalido = {
            modelo: "",
            fabricante: "Marca Fantasma",
            ano: -50,
            quilometragem: -100,
            preco: 0
        };
        const resInvalido = await fetch(`${BASE_URL}/veiculos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(carroInvalido)
        });
        registrarResultado(
            "POST /veiculos com dados inválidos responde com 400 (Bad Request)",
            resInvalido.status === 400,
            `Status: ${resInvalido.status}`
        );

        // Resumo final
        console.log("\n=======================================================");
        console.log(`📊 Resultado dos Testes:`);
        console.log(`   Total de Testes: ${totalTestes}`);
        console.log(`   Aprovados:       \x1b[32m${aprovados}\x1b[0m`);
        console.log(`   Falhas:          \x1b[31m${falhas}\x1b[0m`);
        console.log("=======================================================\n");

        if (falhas === 0) {
            console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n");
        } else {
            console.log("⚠️ Alguns testes falharam. Verifique os logs acima.\n");
        }

    } catch (erro) {
        console.error("\n❌ Erro durante a execução dos testes:", erro.message);
        console.error("👉 Verifique se o servidor backend está rodando em " + BASE_URL);
    }
}

executarTestes();
