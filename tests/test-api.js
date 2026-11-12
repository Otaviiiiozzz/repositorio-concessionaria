/**
 * AutoPrime Concessionária - Suíte Completa de Testes Automatizados E2E
 * Entrega: CRUD Completo, Front-end & Banco de Dados Relacional MySQL
 *
 * Testa:
 * 1. Healthcheck & Documentação da API
 * 2. Catálogo público de veículos
 * 3. Cadastro de usuário com validação e hash de senha
 * 4. Tratamento de e-mail duplicado (409) e validações (400)
 * 5. Login de usuários (Admin, Vendedor, Cliente) com validação de senha bcrypt
 * 6. Rejeição de credenciais incorretas (401)
 * 7. Proteção de rotas com JWT (401 se ausente, 403 se inválido)
 * 8. Controle de acesso por perfil (RBAC):
 *    - Cliente bloqueado de cadastrar/excluir (403)
 *    - Vendedor com permissão de cadastrar e editar (201/200)
 *    - Vendedor bloqueado de excluir (403)
 *    - Admin com permissão total para exclusão (200)
 * 9. Gestão de usuários (restrita ao Administrador)
 * 10. Fluxo de propostas relacionando Usuários e Veículos
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
    console.log("🚗 AutoPrime - Suíte de Testes da API (CRUD, Auth & MySQL)");
    console.log(`🎯 Alvo: ${BASE_URL}`);
    console.log("=======================================================\n");

    try {
        // -------------------------------------------------------------
        // 1. Healthcheck e Rota Raiz
        // -------------------------------------------------------------
        console.log("🔹 1. Rota raiz e documentação pública...");
        const resRaiz = await fetch(`${BASE_URL}/`);
        const dadosRaiz = await resRaiz.json();
        registrarResultado("GET / responde com status 200", resRaiz.status === 200);
        registrarResultado("GET / lista rotas da API", !!dadosRaiz.rotas);

        // -------------------------------------------------------------
        // 2. Catálogo Público de Veículos
        // -------------------------------------------------------------
        console.log("\n🔹 2. Catálogo público de veículos...");
        const resListar = await fetch(`${BASE_URL}/veiculos`);
        const veiculos = await resListar.json();
        registrarResultado("GET /veiculos é público (200)", resListar.status === 200);
        registrarResultado("GET /veiculos retorna lista de automóveis", Array.isArray(veiculos) && veiculos.length > 0);

        const resResumo = await fetch(`${BASE_URL}/veiculos/resumo`);
        const resumo = await resResumo.json();
        registrarResultado("GET /veiculos/resumo retorna métricas consolidadas", typeof resumo.totalVeiculos === "number");

        // -------------------------------------------------------------
        // 3. Cadastro de Novos Usuários (Hash de Senha & Validações)
        // -------------------------------------------------------------
        console.log("\n🔹 3. Cadastro de Usuários (POST /auth/registrar)...");
        const timestamp = Date.now();
        const novoUsuarioPayload = {
            nome: "Novo Cliente Teste",
            email: `cliente_${timestamp}@teste.com`,
            senha: "senhaSegura123",
            telefone: "(51) 98765-4321"
        };

        const resReg = await fetch(`${BASE_URL}/auth/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoUsuarioPayload)
        });
        const dadosReg = await resReg.json();
        registrarResultado("POST /auth/registrar cadastra usuário com sucesso (201)", resReg.status === 201);
        registrarResultado("POST /auth/registrar retorna token JWT e dados sem expor senha", !!dadosReg.token && !dadosReg.usuario?.senha);

        // Teste de e-mail duplicado (409 Conflict)
        const resDup = await fetch(`${BASE_URL}/auth/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoUsuarioPayload)
        });
        registrarResultado("POST /auth/registrar rejeita e-mail duplicado com status 409", resDup.status === 409);

        // Teste de validação: senha muito curta (400 Bad Request)
        const resInvalido = await fetch(`${BASE_URL}/auth/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: "Erro", email: "err@teste.com", senha: "123" })
        });
        registrarResultado("POST /auth/registrar rejeita senha com menos de 6 caracteres (400)", resInvalido.status === 400);

        // -------------------------------------------------------------
        // 4. Autenticação & Login (POST /auth/login)
        // -------------------------------------------------------------
        console.log("\n🔹 4. Autenticação e Login com bcrypt e JWT...");

        // Login Admin
        const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@autoprime.com", senha: "admin123" })
        });
        const dadosLoginAdmin = await resLoginAdmin.json();
        const tokenAdmin = dadosLoginAdmin.token;
        registrarResultado("Login de Administrador aprovado com sucesso (200)", resLoginAdmin.status === 200 && dadosLoginAdmin.usuario?.perfil === "admin");
        registrarResultado("Login retorna token JWT válido assinado", typeof tokenAdmin === "string" && tokenAdmin.split(".").length === 3);

        // Login Vendedor
        const resLoginVend = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "vendedor@autoprime.com", senha: "vendedor123" })
        });
        const dadosLoginVend = await resLoginVend.json();
        const tokenVendedor = dadosLoginVend.token;
        registrarResultado("Login de Vendedor aprovado com perfil 'vendedor' (200)", resLoginVend.status === 200 && dadosLoginVend.usuario?.perfil === "vendedor");

        // Login Cliente
        const resLoginCli = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "cliente@autoprime.com", senha: "cliente123" })
        });
        const dadosLoginCli = await resLoginCli.json();
        const tokenCliente = dadosLoginCli.token;
        registrarResultado("Login de Cliente aprovado com perfil 'cliente' (200)", resLoginCli.status === 200 && dadosLoginCli.usuario?.perfil === "cliente");

        // Login com senha incorreta
        const resLoginErr = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@autoprime.com", senha: "senhaErrada123" })
        });
        registrarResultado("Login com senha incorreta rejeitado com 401 Unauthorized", resLoginErr.status === 401);

        // -------------------------------------------------------------
        // 5. Verificação do Middleware de Autenticação JWT (/auth/me)
        // -------------------------------------------------------------
        console.log("\n🔹 5. Validação de Middleware de Autenticação...");

        // Sem token
        const resSemToken = await fetch(`${BASE_URL}/auth/me`);
        registrarResultado("GET /auth/me sem token rejeita com status 401", resSemToken.status === 401);

        // Token inválido / adulterado
        const resTokenInvalido = await fetch(`${BASE_URL}/auth/me`, {
            headers: { "Authorization": "Bearer token_falso_invalido_123" }
        });
        registrarResultado("GET /auth/me com token inválido rejeita com status 403", resTokenInvalido.status === 403);

        // Token válido de Admin
        const resTokenValido = await fetch(`${BASE_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${tokenAdmin}` }
        });
        const dadosMe = await resTokenValido.json();
        registrarResultado("GET /auth/me com token válido retorna dados do usuário logado (200)", resTokenValido.status === 200 && dadosMe.usuario?.email === "admin@autoprime.com");

        // -------------------------------------------------------------
        // 6. Controle de Acesso Baseado em Perfis (RBAC em Veículos)
        // -------------------------------------------------------------
        console.log("\n🔹 6. Controle de Acesso por Perfil (RBAC)...");

        const novoCarro = {
            modelo: "Polo Track 1.0 Flex",
            fabricante: "Volkswagen",
            ano: 2024,
            quilometragem: 8000,
            preco: 87900.00
        };

        // 6.1 Tentativa de Cliente cadastrar veículo (deve bloquear com 403)
        const resCadCliente = await fetch(`${BASE_URL}/veiculos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenCliente}`
            },
            body: JSON.stringify(novoCarro)
        });
        registrarResultado("Cliente é BLOQUEADO ao tentar cadastrar veículo (403 Forbidden)", resCadCliente.status === 403);

        // 6.2 Vendedor cadastrando veículo (deve permitir: 201)
        const resCadVendedor = await fetch(`${BASE_URL}/veiculos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenVendedor}`
            },
            body: JSON.stringify(novoCarro)
        });
        const dadosCarroCriado = await resCadVendedor.json();
        const idCarroCriado = dadosCarroCriado?.id || dadosCarroCriado?.veiculo?.id;
        registrarResultado("Vendedor CADASTRA veículo com sucesso (201 Created)", resCadVendedor.status === 201 && !!idCarroCriado);

        // 6.3 Vendedor atualizando veículo (deve permitir: 200)
        const resEditVendedor = await fetch(`${BASE_URL}/veiculos/${idCarroCriado}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenVendedor}`
            },
            body: JSON.stringify({
                ...novoCarro,
                preco: 85900.00
            })
        });
        registrarResultado("Vendedor EDITA dados do veículo com sucesso (200 OK)", resEditVendedor.status === 200);

        // 6.4 Tentativa de Vendedor excluir veículo (deve bloquear com 403, apenas Admin pode)
        const resDelVendedor = await fetch(`${BASE_URL}/veiculos/${idCarroCriado}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${tokenVendedor}` }
        });
        registrarResultado("Vendedor é BLOQUEADO ao tentar excluir veículo (403 Forbidden)", resDelVendedor.status === 403);

        // 6.5 Administrador excluindo veículo (deve permitir: 200)
        const resDelAdmin = await fetch(`${BASE_URL}/veiculos/${idCarroCriado}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${tokenAdmin}` }
        });
        registrarResultado("Administrador EXCLUI veículo com sucesso (200 OK)", resDelAdmin.status === 200);

        // Confirma remoção
        const resConfirmaDel = await fetch(`${BASE_URL}/veiculos/${idCarroCriado}`);
        registrarResultado("Veículo excluído não existe mais no estoque (404 Not Found)", resConfirmaDel.status === 404);

        // -------------------------------------------------------------
        // 7. Módulo de Usuários (Restrito a Administradores)
        // -------------------------------------------------------------
        console.log("\n🔹 7. Gerenciamento de Usuários (RBAC Admin)...");

        // Cliente tentando listar usuários -> 403
        const resUserCli = await fetch(`${BASE_URL}/usuarios`, {
            headers: { "Authorization": `Bearer ${tokenCliente}` }
        });
        registrarResultado("Cliente é impedido de listar outros usuários (403 Forbidden)", resUserCli.status === 403);

        // Admin listando usuários -> 200
        const resUserAdmin = await fetch(`${BASE_URL}/usuarios`, {
            headers: { "Authorization": `Bearer ${tokenAdmin}` }
        });
        const listaUsers = await resUserAdmin.json();
        registrarResultado("Administrador lista todos os usuários cadastrados (200 OK)", resUserAdmin.status === 200 && Array.isArray(listaUsers.usuarios));

        // -------------------------------------------------------------
        // 8. Fluxo Relacional de Propostas de Compra (Usuários x Veículos)
        // -------------------------------------------------------------
        console.log("\n🔹 8. Negociação & Propostas (Tabelas Relacionadas)...");

        // Cliente cria proposta para o veículo 1
        const resProposta = await fetch(`${BASE_URL}/propostas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tokenCliente}`
            },
            body: JSON.stringify({
                veiculo_id: 1,
                valor_proposta: 152000.00,
                forma_pagamento: "financiamento",
                observacoes: "Teste de envio de proposta pelo cliente via API."
            })
        });
        const dadosProposta = await resProposta.json();
        const idProposta = dadosProposta?.proposta?.id;
        registrarResultado("Cliente envia proposta de compra associada a um veículo (201 Created)", resProposta.status === 201 && !!idProposta);

        // Cliente consulta suas propostas
        const resMinhasProp = await fetch(`${BASE_URL}/propostas/minhas`, {
            headers: { "Authorization": `Bearer ${tokenCliente}` }
        });
        const minhasProp = await resMinhasProp.json();
        registrarResultado("Cliente consulta apenas o seu histórico de propostas (200 OK)", resMinhasProp.status === 200 && Array.isArray(minhasProp.propostas));

        // Vendedor consulta todas as propostas da concessionária
        const resTodasProp = await fetch(`${BASE_URL}/propostas`, {
            headers: { "Authorization": `Bearer ${tokenVendedor}` }
        });
        registrarResultado("Vendedor acessa lista geral de propostas da concessionária (200 OK)", resTodasProp.status === 200);

        // Vendedor atualiza status da proposta para 'aprovada'
        if (idProposta) {
            const resAprovaProp = await fetch(`${BASE_URL}/propostas/${idProposta}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tokenVendedor}`
                },
                body: JSON.stringify({ status: "aprovada" })
            });
            registrarResultado("Vendedor atualiza status da proposta para 'aprovada' (200 OK)", resAprovaProp.status === 200);
        }

        // -------------------------------------------------------------
        // Resumo Final dos Testes
        // -------------------------------------------------------------
        console.log("\n=======================================================");
        console.log(`📊 Relatório da Execução de Testes:`);
        console.log(`   Total de Casos Testados: ${totalTestes}`);
        console.log(`   Aprovados com Sucesso:   \x1b[32m${aprovados}\x1b[0m`);
        console.log(`   Falhas Encontradas:      \x1b[31m${falhas}\x1b[0m`);
        console.log("=======================================================\n");

        if (falhas === 0) {
            console.log("🎉 100% DOS TESTES FORAM APROVADOS COM SUCESSO!\n");
            process.exit(0);
        } else {
            console.log("⚠️ Alguns testes falharam. Verifique os relatórios acima.\n");
            process.exit(1);
        }

    } catch (erro) {
        console.error("\n❌ Erro durante a execução dos testes:", erro.message);
        console.error("👉 Certifique-se de que o backend está ativo em " + BASE_URL);
        process.exit(1);
    }
}

executarTestes();
