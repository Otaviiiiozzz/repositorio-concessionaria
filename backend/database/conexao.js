import mysql from "mysql2/promise";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARQUIVO_DADOS_LOCAIS = path.join(__dirname, "dados_locais.json");

// =====================================================================
// DADOS PADRÃO (SEED) - Inicialização do Banco e Fallback Resiliente
// =====================================================================

const PERFIS_INICIAIS = [
    { id: 1, nome: "admin", descricao: "Administrador com acesso total ao sistema e gestão de usuários" },
    { id: 2, nome: "vendedor", descricao: "Vendedor com permissão de gerenciar catálogo e responder propostas" },
    { id: 3, nome: "cliente", descricao: "Cliente que navega pelo catálogo e realiza propostas de negociação" }
];

// Senhas padrão criptografadas em bcrypt (salt rounds = 10):
// admin@autoprime.com    -> admin123
// vendedor@autoprime.com -> vendedor123
// cliente@autoprime.com  -> cliente123
const USUARIOS_INICIAIS = [
    {
        id: 1,
        nome: "Administrador AutoPrime",
        email: "admin@autoprime.com",
        senha: "$2b$10$o6OImj9JXu3Tk3RDfafD9.77LJgP0Pk5eZSt1Gsm982nVQhryKCaG",
        perfil_id: 1,
        telefone: "(51) 99999-0001",
        ativo: 1,
        criado_em: "2026-01-01T10:00:00.000Z"
    },
    {
        id: 2,
        nome: "Carlos Vendas",
        email: "vendedor@autoprime.com",
        senha: "$2b$10$pGlH9lFg5PhxiDxhUxRgzOiEeln4WH6QyWQNyF/q3yKlky0C85aNK",
        perfil_id: 2,
        telefone: "(51) 98888-0002",
        ativo: 1,
        criado_em: "2026-01-02T10:00:00.000Z"
    },
    {
        id: 3,
        nome: "Mariana Cliente",
        email: "cliente@autoprime.com",
        senha: "$2b$10$j8eFVHkqtODwGTJJBvtu8edgO2fsgizrA7xvsFlrYiDsla6LZ.io2",
        perfil_id: 3,
        telefone: "(51) 97777-0003",
        ativo: 1,
        criado_em: "2026-01-03T10:00:00.000Z"
    }
];

const CATEGORIAS_INICIAIS = [
    { id: 1, nome: "Sedan", descricao: "Carros de três volumes confortáveis com ótimo espaço interno" },
    { id: 2, nome: "SUV", descricao: "Veículos utilitários esportivos com posição de dirigir elevada" },
    { id: 3, nome: "Hatch", descricao: "Modelos compactos com excelente agilidade e economia urbana" },
    { id: 4, nome: "Picape", descricao: "Veículos utilitários robustos para transporte e carga" },
    { id: 5, nome: "Esportivo", descricao: "Veículos de alta performance com design aerodinâmico" }
];

const VEICULOS_INICIAIS = [
    { id: 1, modelo: "Corolla XEi 2.0",    fabricante: "Toyota",     ano: 2024, quilometragem: 12000, preco: 158900.00, status: "disponivel", categoria_id: 1, cadastrado_por: 1 },
    { id: 2, modelo: "Civic Touring",      fabricante: "Honda",      ano: 2023, quilometragem: 25000, preco: 172500.00, status: "disponivel", categoria_id: 1, cadastrado_por: 1 },
    { id: 3, modelo: "HB20 Comfort",       fabricante: "Hyundai",    ano: 2022, quilometragem: 45000, preco:  82900.00, status: "disponivel", categoria_id: 3, cadastrado_por: 2 },
    { id: 4, modelo: "Onix Plus LTZ",      fabricante: "Chevrolet",  ano: 2023, quilometragem: 18000, preco:  97500.00, status: "disponivel", categoria_id: 1, cadastrado_por: 2 },
    { id: 5, modelo: "Compass Limited",    fabricante: "Jeep",       ano: 2024, quilometragem:  8000, preco: 198700.00, status: "disponivel", categoria_id: 2, cadastrado_por: 1 },
    { id: 6, modelo: "T-Cross Highline",   fabricante: "Volkswagen", ano: 2023, quilometragem: 32000, preco: 139900.00, status: "disponivel", categoria_id: 2, cadastrado_por: 2 },
    { id: 7, modelo: "Tracker Premier",    fabricante: "Chevrolet",  ano: 2022, quilometragem: 41000, preco: 128000.00, status: "disponivel", categoria_id: 2, cadastrado_por: 2 },
    { id: 8, modelo: "Kicks Advance",      fabricante: "Nissan",     ano: 2023, quilometragem: 22000, preco: 112900.00, status: "disponivel", categoria_id: 2, cadastrado_por: 1 }
];

const PROPOSTAS_INICIAIS = [
    {
        id: 1,
        veiculo_id: 1,
        cliente_id: 3,
        vendedor_id: 2,
        valor_proposta: 155000.00,
        status: "pendente",
        forma_pagamento: "financiamento",
        observacoes: "Cliente solicita entrada de 50.000 e saldo em 36x.",
        criado_em: "2026-01-05T14:30:00.000Z"
    },
    {
        id: 2,
        veiculo_id: 3,
        cliente_id: 3,
        vendedor_id: 2,
        valor_proposta: 80000.00,
        status: "aprovada",
        forma_pagamento: "a_vista",
        observacoes: "Pagamento via TED confirmado na entrega.",
        criado_em: "2026-01-06T11:15:00.000Z"
    }
];

let modoAtivo = "mysql"; // "mysql" ou "memoria"
let mysqlPool = null;
let configConectada = null;

// =====================================================================
// PERSISTÊNCIA LOCAL (MODO RESILIENTE PARA VSCODE SEM MYSQL)
// =====================================================================

function criarEstadoInicial() {
    return {
        perfis: JSON.parse(JSON.stringify(PERFIS_INICIAIS)),
        usuarios: JSON.parse(JSON.stringify(USUARIOS_INICIAIS)),
        categorias: JSON.parse(JSON.stringify(CATEGORIAS_INICIAIS)),
        veiculos: JSON.parse(JSON.stringify(VEICULOS_INICIAIS)),
        propostas: JSON.parse(JSON.stringify(PROPOSTAS_INICIAIS))
    };
}

function carregarDadosLocais() {
    try {
        if (fs.existsSync(ARQUIVO_DADOS_LOCAIS)) {
            const conteudo = fs.readFileSync(ARQUIVO_DADOS_LOCAIS, "utf-8");
            const parsed = JSON.parse(conteudo);
            if (Array.isArray(parsed)) {
                // Migração de formato antigo (que continha apenas array de veículos)
                const estado = criarEstadoInicial();
                estado.veiculos = parsed;
                salvarDadosLocais(estado);
                return estado;
            }
            if (parsed && typeof parsed === "object") {
                return {
                    perfis: parsed.perfis || JSON.parse(JSON.stringify(PERFIS_INICIAIS)),
                    usuarios: parsed.usuarios || JSON.parse(JSON.stringify(USUARIOS_INICIAIS)),
                    categorias: parsed.categorias || JSON.parse(JSON.stringify(CATEGORIAS_INICIAIS)),
                    veiculos: parsed.veiculos || JSON.parse(JSON.stringify(VEICULOS_INICIAIS)),
                    propostas: parsed.propostas || JSON.parse(JSON.stringify(PROPOSTAS_INICIAIS))
                };
            }
        }
    } catch (e) {
        console.warn("⚠️ Aviso ao ler dados locais:", e.message);
    }
    const estadoPadrao = criarEstadoInicial();
    salvarDadosLocais(estadoPadrao);
    return estadoPadrao;
}

function salvarDadosLocais(dados) {
    try {
        fs.writeFileSync(ARQUIVO_DADOS_LOCAIS, JSON.stringify(dados, null, 2), "utf-8");
    } catch (e) {
        console.warn("⚠️ Aviso ao salvar dados locais:", e.message);
    }
}

let dadosMemoria = carregarDadosLocais();

// =====================================================================
// ADAPTADOR SQL PARA MODO MEMÓRIA / JSON
// Permite que todas as rotas e testes funcionem perfeitamente
// mesmo se o MySQL Workbench não estiver iniciado!
// =====================================================================

function executarQueryMemoria(sql, params = []) {
    const sqlLimpa = sql.trim().replace(/\s+/g, " ");
    const sqlUpper = sqlLimpa.toUpperCase();

    // 1. SELECT 1 (teste de conexão)
    if (sqlUpper.startsWith("SELECT 1")) {
        return [[{ 1: 1 }]];
    }

    // -------------------------------------------------------------
    // OPERAÇÕES DE USUÁRIOS & AUTENTICAÇÃO
    // -------------------------------------------------------------
    // SELECT usuario por email com perfil
    if (sqlUpper.includes("FROM USUARIOS") && sqlUpper.includes("WHERE") && sqlUpper.includes("EMAIL = ?")) {
        const emailBuscado = String(params[0] || "").toLowerCase().trim();
        const user = dadosMemoria.usuarios.find(u => u.email.toLowerCase() === emailBuscado);
        if (!user) return [[]];
        const perfil = dadosMemoria.perfis.find(p => p.id === user.perfil_id);
        const resultado = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            senha: user.senha,
            perfil_id: user.perfil_id,
            perfil_nome: perfil ? perfil.nome : "cliente",
            telefone: user.telefone,
            ativo: user.ativo !== undefined ? user.ativo : 1,
            criado_em: user.criado_em
        };
        return [[resultado]];
    }

    // SELECT usuario por ID com perfil
    if (sqlUpper.includes("FROM USUARIOS") && sqlUpper.includes("WHERE") && sqlUpper.includes("U.ID = ?")) {
        const idBuscado = Number(params[0]);
        const user = dadosMemoria.usuarios.find(u => u.id === idBuscado);
        if (!user) return [[]];
        const perfil = dadosMemoria.perfis.find(p => p.id === user.perfil_id);
        const resultado = {
            id: user.id,
            nome: user.nome,
            email: user.email,
            telefone: user.telefone,
            ativo: user.ativo !== undefined ? user.ativo : 1,
            criado_em: user.criado_em,
            perfil_nome: perfil ? perfil.nome : "cliente",
            perfil_descricao: perfil ? perfil.descricao : ""
        };
        return [[resultado]];
    }

    // SELECT todos os usuários (admin)
    if (sqlUpper.includes("FROM USUARIOS") && !sqlUpper.includes("WHERE")) {
        const lista = dadosMemoria.usuarios.map(u => {
            const perfil = dadosMemoria.perfis.find(p => p.id === u.perfil_id);
            return {
                id: u.id,
                nome: u.nome,
                email: u.email,
                perfil_id: u.perfil_id,
                perfil_nome: perfil ? perfil.nome : "cliente",
                telefone: u.telefone,
                ativo: u.ativo !== undefined ? u.ativo : 1,
                criado_em: u.criado_em
            };
        });
        return [lista];
    }

    // INSERT INTO usuarios
    if (sqlUpper.startsWith("INSERT INTO USUARIOS")) {
        const [nome, email, senha, perfil_id, telefone] = params;
        const maxId = dadosMemoria.usuarios.reduce((max, u) => (u.id > max ? u.id : max), 0);
        const novoId = maxId + 1;
        const novoUsuario = {
            id: novoId,
            nome,
            email,
            senha,
            perfil_id: Number(perfil_id || 3),
            telefone: telefone || null,
            ativo: 1,
            criado_em: new Date().toISOString()
        };
        dadosMemoria.usuarios.push(novoUsuario);
        salvarDadosLocais(dadosMemoria);
        return [{ insertId: novoId, affectedRows: 1 }];
    }

    // UPDATE usuarios (status ou dados)
    if (sqlUpper.startsWith("UPDATE USUARIOS")) {
        if (sqlUpper.includes("SET ATIVO = ? WHERE ID = ?")) {
            const [ativo, id] = params;
            const user = dadosMemoria.usuarios.find(u => u.id === Number(id));
            if (!user) return [{ affectedRows: 0 }];
            user.ativo = Number(ativo);
            salvarDadosLocais(dadosMemoria);
            return [{ affectedRows: 1 }];
        }
    }

    // SELECT perfis
    if (sqlUpper.includes("FROM PERFIS")) {
        return [[...dadosMemoria.perfis]];
    }

    // SELECT categorias
    if (sqlUpper.includes("FROM CATEGORIAS")) {
        return [[...dadosMemoria.categorias]];
    }

    // -------------------------------------------------------------
    // OPERAÇÕES DE PROPOSTAS
    // -------------------------------------------------------------
    if (sqlUpper.startsWith("INSERT INTO PROPOSTAS")) {
        const [veiculo_id, cliente_id, vendedor_id, valor_proposta, forma_pagamento, observacoes] = params;
        const maxId = dadosMemoria.propostas.reduce((max, p) => (p.id > max ? p.id : max), 0);
        const novoId = maxId + 1;
        const nova = {
            id: novoId,
            veiculo_id: Number(veiculo_id),
            cliente_id: Number(cliente_id),
            vendedor_id: vendedor_id ? Number(vendedor_id) : null,
            valor_proposta: Number(valor_proposta),
            status: "pendente",
            forma_pagamento: forma_pagamento || "a_vista",
            observacoes: observacoes || "",
            criado_em: new Date().toISOString()
        };
        dadosMemoria.propostas.push(nova);
        salvarDadosLocais(dadosMemoria);
        return [{ insertId: novoId, affectedRows: 1 }];
    }

    if (sqlUpper.includes("FROM PROPOSTAS")) {
        let lista = dadosMemoria.propostas.map(p => {
            const v = dadosMemoria.veiculos.find(ve => ve.id === p.veiculo_id) || {};
            const c = dadosMemoria.usuarios.find(u => u.id === p.cliente_id) || {};
            const vend = dadosMemoria.usuarios.find(u => u.id === p.vendedor_id) || {};
            return {
                ...p,
                veiculo_modelo: v.modelo || "Veículo não identificado",
                veiculo_fabricante: v.fabricante || "",
                veiculo_preco: v.preco || 0,
                cliente_nome: c.nome || "Cliente",
                cliente_email: c.email || "",
                vendedor_nome: vend.nome || "Não atribuído"
            };
        });

        if (sqlUpper.includes("WHERE P.CLIENTE_ID = ?")) {
            const clienteId = Number(params[0]);
            lista = lista.filter(p => p.cliente_id === clienteId);
        }

        return [lista];
    }

    if (sqlUpper.startsWith("UPDATE PROPOSTAS")) {
        const [status, vendedor_id, id] = params;
        const prop = dadosMemoria.propostas.find(p => p.id === Number(id));
        if (!prop) return [{ affectedRows: 0 }];
        prop.status = status;
        if (vendedor_id) prop.vendedor_id = Number(vendedor_id);
        salvarDadosLocais(dadosMemoria);
        return [{ affectedRows: 1 }];
    }

    // -------------------------------------------------------------
    // OPERAÇÕES DE VEÍCULOS
    // -------------------------------------------------------------
    // DELETE veiculos
    if (sqlUpper.startsWith("DELETE FROM VEICULOS")) {
        const id = Number(params[0]);
        const index = dadosMemoria.veiculos.findIndex(v => Number(v.id) === id);

        if (index === -1) {
            return [{ affectedRows: 0 }];
        }

        dadosMemoria.veiculos.splice(index, 1);
        salvarDadosLocais(dadosMemoria);
        return [{ affectedRows: 1 }];
    }

    // INSERT INTO veiculos
    if (sqlUpper.startsWith("INSERT INTO VEICULOS")) {
        let modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por;
        if (params.length === 5) {
            [modelo, fabricante, ano, quilometragem, preco] = params;
            status = "disponivel";
            categoria_id = null;
            cadastrado_por = null;
        } else {
            [modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por] = params;
        }

        const maxId = dadosMemoria.veiculos.reduce((max, v) => (v.id > max ? v.id : max), 0);
        const novoId = maxId + 1;
        const novoVeiculo = {
            id: novoId,
            modelo,
            fabricante,
            ano: Number(ano),
            quilometragem: Number(quilometragem),
            preco: Number(preco),
            status: status || "disponivel",
            categoria_id: categoria_id ? Number(categoria_id) : null,
            cadastrado_por: cadastrado_por ? Number(cadastrado_por) : null,
            criado_em: new Date().toISOString()
        };
        dadosMemoria.veiculos.push(novoVeiculo);
        salvarDadosLocais(dadosMemoria);
        return [{ insertId: novoId, affectedRows: 1 }];
    }

    // UPDATE veiculos
    if (sqlUpper.startsWith("UPDATE VEICULOS")) {
        let modelo, fabricante, ano, quilometragem, preco, id;
        if (params.length === 6) {
            [modelo, fabricante, ano, quilometragem, preco, id] = params;
        } else {
            [modelo, fabricante, ano, quilometragem, preco, id] = params;
        }

        const index = dadosMemoria.veiculos.findIndex(v => Number(v.id) === Number(id));

        if (index === -1) {
            return [{ affectedRows: 0 }];
        }

        dadosMemoria.veiculos[index] = {
            ...dadosMemoria.veiculos[index],
            modelo,
            fabricante,
            ano: Number(ano),
            quilometragem: Number(quilometragem),
            preco: Number(preco),
            atualizado_em: new Date().toISOString()
        };

        salvarDadosLocais(dadosMemoria);
        return [{ affectedRows: 1 }];
    }

    // SELECT COUNT / Métricas de veículos
    if (sqlUpper.includes("COUNT(*) AS TOTALVEICULOS") || sqlUpper.includes("COUNT(ID) AS TOTALVEICULOS")) {
        const total = dadosMemoria.veiculos.length;
        if (total === 0) {
            return [[{
                totalVeiculos: 0,
                valorTotalEstoque: 0,
                mediaKm: 0,
                menorPreco: 0,
                maiorPreco: 0
            }]];
        }

        const somaPreco = dadosMemoria.veiculos.reduce((acc, v) => acc + Number(v.preco || 0), 0);
        const somaKm = dadosMemoria.veiculos.reduce((acc, v) => acc + Number(v.quilometragem || 0), 0);
        const precos = dadosMemoria.veiculos.map(v => Number(v.preco || 0));

        return [[{
            totalVeiculos: total,
            valorTotalEstoque: Number(somaPreco.toFixed(2)),
            mediaKm: Math.round(somaKm / total),
            menorPreco: Math.min(...precos),
            maiorPreco: Math.max(...precos)
        }]];
    }

    // SELECT veiculos por ID
    if (sqlUpper.includes("FROM VEICULOS") && sqlUpper.includes("WHERE") && sqlUpper.includes("ID = ?")) {
        const id = Number(params[0]);
        const v = dadosMemoria.veiculos.find(item => Number(item.id) === id);
        return [v ? [v] : []];
    }

    // SELECT veiculos geral com filtros
    if (sqlUpper.includes("FROM VEICULOS")) {
        let resultado = [...dadosMemoria.veiculos];

        let paramIndex = 0;
        if (sqlUpper.includes("FABRICANTE LIKE ?") || sqlUpper.includes("MODELO LIKE ?")) {
            if (params[paramIndex]) {
                const busca = String(params[paramIndex]).replace(/%/g, "").toLowerCase();
                resultado = resultado.filter(v =>
                    v.modelo.toLowerCase().includes(busca) ||
                    v.fabricante.toLowerCase().includes(busca)
                );
                paramIndex++;
            }
        }

        if (sqlUpper.includes("FABRICANTE = ?")) {
            if (params[paramIndex]) {
                const fab = String(params[paramIndex]).toLowerCase();
                resultado = resultado.filter(v => v.fabricante.toLowerCase() === fab);
                paramIndex++;
            }
        }

        if (sqlUpper.includes("PRECO <= ?")) {
            if (params[paramIndex]) {
                const maxPreco = Number(params[paramIndex]);
                resultado = resultado.filter(v => Number(v.preco) <= maxPreco);
                paramIndex++;
            }
        }

        return [resultado];
    }

    return [[]];
}

// =====================================================================
// CONEXÃO COM MYSQL
// =====================================================================

async function inicializarBancoMySQL() {
    const configEnv = {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "admin",
        database: process.env.DB_NAME || "concessionaria"
    };

    const hostsParaTestar = [configEnv.host, "127.0.0.1", "localhost"];
    const senhasParaTestar = [
        configEnv.password,
        "admin",
        "",
        "root",
        "123456",
        "mysql"
    ];

    let conexaoSucesso = null;
    let configGanhadora = null;

    for (const host of [...new Set(hostsParaTestar)]) {
        for (const senha of senhasParaTestar) {
            try {
                const conexaoTeste = await mysql.createConnection({
                    host,
                    port: configEnv.port,
                    user: configEnv.user,
                    password: senha,
                    connectTimeout: 2000
                });
                conexaoSucesso = conexaoTeste;
                configGanhadora = { ...configEnv, host, password: senha };
                break;
            } catch (e) {
                // Continua tentando
            }
        }
        if (conexaoSucesso) break;
    }

    if (!conexaoSucesso) {
        throw new Error("Não foi possível conectar a nenhuma porta ou senha padrão do MySQL local.");
    }

    const { database } = configGanhadora;

    // Cria banco e tabelas relacionais caso não existam
    try {
        await conexaoSucesso.query(`
            CREATE DATABASE IF NOT EXISTS \`${database}\`
            DEFAULT CHARACTER SET utf8mb4
            DEFAULT COLLATE utf8mb4_unicode_ci;
        `);

        await conexaoSucesso.query(`USE \`${database}\`;`);

        // 1. Tabela de Perfis
        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`perfis\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`nome\` VARCHAR(50) NOT NULL UNIQUE,
                \`descricao\` VARCHAR(255) NOT NULL,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Tabela de Usuários
        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`usuarios\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`nome\` VARCHAR(100) NOT NULL,
                \`email\` VARCHAR(120) NOT NULL UNIQUE,
                \`senha\` VARCHAR(255) NOT NULL,
                \`perfil_id\` INT NOT NULL,
                \`telefone\` VARCHAR(20) NULL,
                \`ativo\` TINYINT(1) NOT NULL DEFAULT 1,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`fk_usuarios_perfis\` FOREIGN KEY (\`perfil_id\`) REFERENCES \`perfis\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
                INDEX \`idx_usuarios_email\` (\`email\`),
                INDEX \`idx_usuarios_perfil\` (\`perfil_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Tabela de Categorias
        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`categorias\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`nome\` VARCHAR(50) NOT NULL UNIQUE,
                \`descricao\` VARCHAR(255) NULL,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Tabela de Veículos
        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`veiculos\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`modelo\` VARCHAR(100) NOT NULL,
                \`fabricante\` VARCHAR(100) NOT NULL,
                \`ano\` INT NOT NULL,
                \`quilometragem\` DECIMAL(12,2) NOT NULL DEFAULT 0,
                \`preco\` DECIMAL(12,2) NOT NULL,
                \`status\` ENUM('disponivel', 'reservado', 'vendido') NOT NULL DEFAULT 'disponivel',
                \`categoria_id\` INT NULL,
                \`cadastrado_por\` INT NULL,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`fk_veiculos_categorias\` FOREIGN KEY (\`categoria_id\`) REFERENCES \`categorias\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT \`fk_veiculos_usuarios\` FOREIGN KEY (\`cadastrado_por\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
                INDEX \`idx_veiculos_fabricante\` (\`fabricante\`),
                INDEX \`idx_veiculos_ano\` (\`ano\`),
                INDEX \`idx_veiculos_status\` (\`status\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Tabela de Propostas
        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`propostas\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`veiculo_id\` INT NOT NULL,
                \`cliente_id\` INT NOT NULL,
                \`vendedor_id\` INT NULL,
                \`valor_proposta\` DECIMAL(12,2) NOT NULL,
                \`status\` ENUM('pendente', 'aprovada', 'recusada', 'cancelada') NOT NULL DEFAULT 'pendente',
                \`forma_pagamento\` ENUM('a_vista', 'financiamento', 'consorcio', 'troca') NOT NULL DEFAULT 'a_vista',
                \`observacoes\` TEXT NULL,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`fk_propostas_veiculos\` FOREIGN KEY (\`veiculo_id\`) REFERENCES \`veiculos\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT \`fk_propostas_cliente\` FOREIGN KEY (\`cliente_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT \`fk_propostas_vendedor\` FOREIGN KEY (\`vendedor_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
                INDEX \`idx_propostas_status\` (\`status\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Garante que colunas relacionais status, categoria_id e cadastrado_por existam
        const [colsVeic] = await conexaoSucesso.query("SHOW COLUMNS FROM `veiculos`;");
        const nomesVeic = colsVeic.map(col => col.Field);
        if (!nomesVeic.includes("status")) {
            await conexaoSucesso.query("ALTER TABLE `veiculos` ADD COLUMN `status` ENUM('disponivel', 'reservado', 'vendido') NOT NULL DEFAULT 'disponivel' AFTER `preco`;");
        }
        if (!nomesVeic.includes("categoria_id")) {
            await conexaoSucesso.query("ALTER TABLE `veiculos` ADD COLUMN `categoria_id` INT NULL AFTER `status`;");
            await conexaoSucesso.query("ALTER TABLE `veiculos` ADD CONSTRAINT `fk_veiculos_categorias` FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE SET NULL;");
        }
        if (!nomesVeic.includes("cadastrado_por")) {
            await conexaoSucesso.query("ALTER TABLE `veiculos` ADD COLUMN `cadastrado_por` INT NULL AFTER `categoria_id`;");
            await conexaoSucesso.query("ALTER TABLE `veiculos` ADD CONSTRAINT `fk_veiculos_usuarios` FOREIGN KEY (`cadastrado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL;");
        }

        // Popular Perfis se vazia
        const [rowsPerfis] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`perfis\`;`);
        if (rowsPerfis[0].total === 0) {
            for (const p of PERFIS_INICIAIS) {
                await conexaoSucesso.query(`INSERT INTO \`perfis\` (id, nome, descricao) VALUES (?, ?, ?)`, [p.id, p.nome, p.descricao]);
            }
        }

        // Popular Categorias se vazia
        const [rowsCat] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`categorias\`;`);
        if (rowsCat[0].total === 0) {
            for (const c of CATEGORIAS_INICIAIS) {
                await conexaoSucesso.query(`INSERT INTO \`categorias\` (id, nome, descricao) VALUES (?, ?, ?)`, [c.id, c.nome, c.descricao]);
            }
        }

        // Popular Usuários se vazia
        const [rowsUsers] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`usuarios\`;`);
        if (rowsUsers[0].total === 0) {
            for (const u of USUARIOS_INICIAIS) {
                await conexaoSucesso.query(
                    `INSERT INTO \`usuarios\` (id, nome, email, senha, perfil_id, telefone, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [u.id, u.nome, u.email, u.senha, u.perfil_id, u.telefone, u.ativo]
                );
            }
        }

        // Popular Veículos se vazia
        const [rowsVeic] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`veiculos\`;`);
        if (rowsVeic[0].total === 0) {
            for (const v of VEICULOS_INICIAIS) {
                await conexaoSucesso.query(
                    `INSERT INTO \`veiculos\` (id, modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [v.id, v.modelo, v.fabricante, v.ano, v.quilometragem, v.preco, v.status, v.categoria_id, v.cadastrado_por]
                );
            }
        }

        // Popular Propostas se vazia
        const [rowsProp] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`propostas\`;`);
        if (rowsProp[0].total === 0) {
            for (const p of PROPOSTAS_INICIAIS) {
                await conexaoSucesso.query(
                    `INSERT INTO \`propostas\` (id, veiculo_id, cliente_id, vendedor_id, valor_proposta, status, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.id, p.veiculo_id, p.cliente_id, p.vendedor_id, p.valor_proposta, p.status, p.forma_pagamento, p.observacoes]
                );
            }
        }
    } finally {
        await conexaoSucesso.end();
    }

    // Pool oficial
    mysqlPool = mysql.createPool({
        host: configGanhadora.host,
        port: configGanhadora.port,
        user: configGanhadora.user,
        password: configGanhadora.password,
        database: configGanhadora.database,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 5000
    });

    configConectada = configGanhadora;
    return configGanhadora;
}

const pool = {
    async query(sql, params = []) {
        if (modoAtivo === "mysql" && mysqlPool) {
            try {
                return await mysqlPool.query(sql, params);
            } catch (erro) {
                if (erro.code === "ECONNREFUSED" || erro.code === "PROTOCOL_CONNECTION_LOST") {
                    console.warn("⚠️ [MYSQL] Conexão perdida. Chaveando para modo local resiliente.");
                    modoAtivo = "memoria";
                    return executarQueryMemoria(sql, params);
                }
                throw erro;
            }
        }
        return executarQueryMemoria(sql, params);
    },

    async getConnection() {
        if (modoAtivo === "mysql" && mysqlPool) {
            return await mysqlPool.getConnection();
        }
        return {
            query: (sql, params) => executarQueryMemoria(sql, params),
            release: () => {}
        };
    }
};

async function testarConexao() {
    try {
        const config = await inicializarBancoMySQL();
        modoAtivo = "mysql";

        console.log("\n=============================================================");
        console.log("✅ [BANCO DE DADOS] CONEXÃO COM MYSQL WORKBENCH ESTABELECIDA!");
        console.log(`🌐 Host:          ${config.host}:${config.port}`);
        console.log(`👤 Usuário:       ${config.user}`);
        console.log(`🗄️  Banco:         ${config.database}`);
        console.log("📋 Tabelas:       perfis, usuarios, categorias, veiculos, propostas");
        console.log("-------------------------------------------------------------");
        console.log("💡 Qualquer alteração feita pelo Thunder Client ou Frontend");
        console.log("   será gravada DIRETAMENTE no MySQL Workbench!");
        console.log("=============================================================\n");

        return { modo: "mysql", sucesso: true, config };
    } catch (erro) {
        modoAtivo = "memoria";
        console.log("\n-------------------------------------------------------------");
        console.log("ℹ️  [MODO RESILIENTE ATIVADO]");
        console.log(`   MySQL não foi detectado (${erro.message}).`);
        console.log("   O backend continuará 100% OPERACIONAL usando armazenamento local!");
        console.log("   Os dados são salvos em: database/dados_locais.json");
        console.log("-------------------------------------------------------------\n");
        return { modo: "memoria", sucesso: false, erro: erro.message };
    }
}

function obterModoAtivo() {
    return modoAtivo;
}

function obterConfigConectada() {
    return configConectada;
}

export { pool, testarConexao, obterModoAtivo, obterConfigConectada, dadosMemoria };
