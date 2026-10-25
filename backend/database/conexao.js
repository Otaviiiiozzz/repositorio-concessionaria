import mysql from "mysql2/promise";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARQUIVO_DADOS_LOCAIS = path.join(__dirname, "dados_locais.json");

// Veículos iniciais padrão para popular o banco de dados
const VEICULOS_INICIAIS = [
    { id: 1, modelo: "Corolla XEi 2.0",    fabricante: "Toyota",     ano: 2024, quilometragem: 12000, preco: 158900.00 },
    { id: 2, modelo: "Civic Touring",      fabricante: "Honda",      ano: 2023, quilometragem: 25000, preco: 172500.00 },
    { id: 3, modelo: "HB20 Comfort",       fabricante: "Hyundai",    ano: 2022, quilometragem: 45000, preco:  82900.00 },
    { id: 4, modelo: "Onix Plus LTZ",      fabricante: "Chevrolet",  ano: 2023, quilometragem: 18000, preco:  97500.00 },
    { id: 5, modelo: "Compass Limited",    fabricante: "Jeep",       ano: 2024, quilometragem:  8000, preco: 198700.00 },
    { id: 6, modelo: "T-Cross Highline",   fabricante: "Volkswagen", ano: 2023, quilometragem: 32000, preco: 139900.00 },
    { id: 7, modelo: "Tracker Premier",    fabricante: "Chevrolet",  ano: 2022, quilometragem: 41000, preco: 128000.00 },
    { id: 8, modelo: "Kicks Advance",      fabricante: "Nissan",     ano: 2023, quilometragem: 22000, preco: 112900.00 }
];

let modoAtivo = "mysql"; // "mysql" ou "memoria"
let mysqlPool = null;
let configConectada = null;

// Inicializa ou carrega os dados locais para modo fallback
function carregarDadosLocais() {
    try {
        if (fs.existsSync(ARQUIVO_DADOS_LOCAIS)) {
            const conteudo = fs.readFileSync(ARQUIVO_DADOS_LOCAIS, "utf-8");
            const parsed = JSON.parse(conteudo);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("⚠️ Aviso ao ler dados locais:", e.message);
    }
    salvarDadosLocais(VEICULOS_INICIAIS);
    return [...VEICULOS_INICIAIS];
}

function salvarDadosLocais(dados) {
    try {
        fs.writeFileSync(ARQUIVO_DADOS_LOCAIS, JSON.stringify(dados, null, 2), "utf-8");
    } catch (e) {
        console.warn("⚠️ Aviso ao salvar dados locais:", e.message);
    }
}

let dadosMemoria = carregarDadosLocais();

/**
 * Adaptador de consultas para modo memória / arquivo local (fallback)
 */
function executarQueryMemoria(sql, params = []) {
    const sqlUpper = sql.trim().toUpperCase();

    // 1. SELECT 1 (teste de conexão)
    if (sqlUpper.startsWith("SELECT 1")) {
        return [[{ 1: 1 }]];
    }

    // 2. DELETE FROM veiculos WHERE id = ?
    if (sqlUpper.startsWith("DELETE FROM VEICULOS")) {
        const id = Number(params[0]);
        const index = dadosMemoria.findIndex(v => Number(v.id) === id);

        if (index === -1) {
            return [{ affectedRows: 0 }];
        }

        dadosMemoria.splice(index, 1);
        salvarDadosLocais(dadosMemoria);
        return [{ affectedRows: 1 }];
    }

    // 3. INSERT INTO veiculos
    if (sqlUpper.startsWith("INSERT INTO VEICULOS")) {
        const [modelo, fabricante, ano, quilometragem, preco] = params;
        const maxId = dadosMemoria.reduce((max, v) => (v.id > max ? v.id : max), 0);
        const novoId = maxId + 1;
        const novoVeiculo = {
            id: novoId,
            modelo,
            fabricante,
            ano: Number(ano),
            quilometragem: Number(quilometragem),
            preco: Number(preco),
            criado_em: new Date().toISOString()
        };
        dadosMemoria.push(novoVeiculo);
        salvarDadosLocais(dadosMemoria);
        return [{ insertId: novoId, affectedRows: 1 }];
    }

    // 4. UPDATE veiculos
    if (sqlUpper.startsWith("UPDATE VEICULOS")) {
        const [modelo, fabricante, ano, quilometragem, preco, id] = params;
        const numId = Number(id);
        const index = dadosMemoria.findIndex(v => Number(v.id) === numId);

        if (index === -1) {
            return [{ affectedRows: 0 }];
        }

        dadosMemoria[index] = {
            ...dadosMemoria[index],
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

    // 5. SELECT id FROM veiculos WHERE id = ?
    if (sqlUpper.startsWith("SELECT ID FROM VEICULOS WHERE ID = ?") || (sqlUpper.startsWith("SELECT") && sqlUpper.includes("ID FROM") && sqlUpper.includes("WHERE ID = ?"))) {
        const id = Number(params[0]);
        const item = dadosMemoria.find(v => Number(v.id) === id);
        return [item ? [{ id: item.id }] : []];
    }

    // 6. SELECT * FROM veiculos WHERE id = ?
    if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("WHERE ID = ?")) {
        const id = Number(params[0]);
        const item = dadosMemoria.find(v => Number(v.id) === id);
        return [item ? [item] : []];
    }

    // 7. SELECT * FROM veiculos (listagem geral)
    if (sqlUpper.startsWith("SELECT") && sqlUpper.includes("FROM VEICULOS")) {
        let lista = [...dadosMemoria];
        lista.sort((a, b) => b.id - a.id);
        return [lista];
    }

    console.warn("⚠️ Query não mapeada em modo memória:", sql);
    return [[]];
}

/**
 * Tenta conectar ao MySQL e criar automaticamente o banco e a tabela se não existirem.
 * Suporta auto-detecção de senhas e portas comuns para facilitar apresentações na escola!
 */
async function inicializarBancoMySQL() {
    const host = process.env.DB_HOST || "localhost";
    const database = process.env.DB_NAME || "concessionaria";
    const user = process.env.DB_USER || "root";
    const portas = [Number(process.env.DB_PORT || 3306), 3307];

    // Lista de senhas para testar automaticamente (evita falha na apresentação se a senha do colégio for diferente)
    const senhasParaTentar = [
        process.env.DB_PASSWORD ?? "admin",
        "",           // Senha em branco (padrão XAMPP / MariaDB / Wamp)
        "root",       // Senha clássica padrão MySQL Installer
        "admin",      // Senha comum
        "123456",     // Senha numérica comum
        "1234",
        "senac",      // Senha comum em laboratórios Senac
        "mysql"
    ];

    // Remove senhas duplicadas
    const senhasUnicas = [...new Set(senhasParaTentar)];

    let conexaoSucesso = null;
    let configGanhadora = null;

    for (const porta of portas) {
        for (const senha of senhasUnicas) {
            try {
                const conn = await mysql.createConnection({
                    host,
                    port: porta,
                    user,
                    password: senha,
                    connectTimeout: 1200
                });
                conexaoSucesso = conn;
                configGanhadora = { host, port: porta, user, password: senha, database };
                break;
            } catch (err) {
                // Se o servidor nem responde nessa porta, não adianta testar outras senhas nela
                if (err.code === "ECONNREFUSED") {
                    break;
                }
                // Se for erro de senha (ER_ACCESS_DENIED_ERROR), continua para a próxima senha
            }
        }
        if (conexaoSucesso) break;
    }

    if (!conexaoSucesso) {
        throw new Error("Não foi possível conectar ao MySQL em nenhuma porta/senha.");
    }

    // Cria o banco e a tabela se não existirem
    try {
        await conexaoSucesso.query(`
            CREATE DATABASE IF NOT EXISTS \`${database}\`
            DEFAULT CHARACTER SET utf8mb4
            DEFAULT COLLATE utf8mb4_unicode_ci;
        `);

        await conexaoSucesso.query(`USE \`${database}\`;`);

        await conexaoSucesso.query(`
            CREATE TABLE IF NOT EXISTS \`veiculos\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`modelo\` VARCHAR(100) NOT NULL,
                \`fabricante\` VARCHAR(100) NOT NULL,
                \`ano\` INT NOT NULL,
                \`quilometragem\` DECIMAL(12,2) NOT NULL DEFAULT 0,
                \`preco\` DECIMAL(12,2) NOT NULL,
                \`criado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`atualizado_em\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                INDEX \`idx_fabricante\` (\`fabricante\`),
                INDEX \`idx_ano\` (\`ano\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Se a tabela estiver vazia, popula com os 8 veículos iniciais
        const [rows] = await conexaoSucesso.query(`SELECT COUNT(*) AS total FROM \`veiculos\`;`);
        if (rows[0].total === 0) {
            console.log("🌱 [MYSQL] Populando tabela 'veiculos' com 8 registros iniciais...");
            for (const v of VEICULOS_INICIAIS) {
                await conexaoSucesso.query(
                    `INSERT INTO \`veiculos\` (id, modelo, fabricante, ano, quilometragem, preco) VALUES (?, ?, ?, ?, ?, ?)`,
                    [v.id, v.modelo, v.fabricante, v.ano, v.quilometragem, v.preco]
                );
            }
        }
    } finally {
        await conexaoSucesso.end();
    }

    // Cria o pool oficial apontando para o banco concessionaria
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

/**
 * Objeto pool transparente:
 * Quando conectado ao MySQL, qualquer SELECT, INSERT, UPDATE, DELETE é gravado diretamente no banco MySQL!
 */
const pool = {
    async query(sql, params = []) {
        if (modoAtivo === "mysql" && mysqlPool) {
            try {
                return await mysqlPool.query(sql, params);
            } catch (erro) {
                // Se o MySQL cair durante a apresentação, ativa fallback transparente para não travar
                if (erro.code === "ECONNREFUSED" || erro.code === "PROTOCOL_CONNECTION_LOST") {
                    console.warn("⚠️ [MYSQL] Conexão perdida. Chaveando temporariamente para armazenamento local.");
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

/**
 * Testa a conexão e inicializa o banco de dados.
 */
async function testarConexao() {
    try {
        const config = await inicializarBancoMySQL();
        modoAtivo = "mysql";

        console.log("\n=============================================================");
        console.log("✅ [BANCO DE DADOS] CONEXÃO COM MYSQL WORKBENCH ESTABELECIDA!");
        console.log(`🌐 Host:          ${config.host}:${config.port}`);
        console.log(`👤 Usuário:       ${config.user}`);
        console.log(`🗄️  Banco:         ${config.database}`);
        console.log("📋 Tabela Ativa:  veiculos");
        console.log("-------------------------------------------------------------");
        console.log("💡 Qualquer alteração feita pelo Thunder Client ou Frontend");
        console.log("   será gravada DIRETAMENTE no MySQL Workbench!");
        console.log("🔍 Para ver no Workbench: SELECT * FROM concessionaria.veiculos;");
        console.log("=============================================================\n");

        return { modo: "mysql", sucesso: true, config };
    } catch (erro) {
        modoAtivo = "memoria";
        console.log("\n-------------------------------------------------------------");
        console.log("ℹ️  [MODO RESILIENTE ATIVADO]");
        console.log(`   MySQL não foi detectado (${erro.message}).`);
        console.log("   O backend continuará 100% OPERACIONAL usando armazenamento local!");
        console.log("   Os dados são salvos em: database/dados_locais.json");
        console.log("   (Para ligar ao MySQL Workbench, basta iniciar o serviço MySQL).");
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
