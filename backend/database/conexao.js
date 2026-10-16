import mysql from "mysql2/promise";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARQUIVO_DADOS_LOCAIS = path.join(__dirname, "dados_locais.json");

// Veículos iniciais para demonstração e modo resiliente
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

// Inicializa ou carrega os dados locais
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

// Pool do MySQL
const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "concessionaria",
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 2000
});

/**
 * Adaptador de consultas para modo memória / arquivo local
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
 * Objeto pool transparente: usa MySQL se ativo, ou memória/arquivo como fallback
 */
const pool = {
    async query(sql, params = []) {
        if (modoAtivo === "mysql") {
            try {
                return await mysqlPool.query(sql, params);
            } catch (erro) {
                // Se o MySQL caiu durante o uso, faz fallback automático
                if (erro.code === "ECONNREFUSED" || erro.code === "PROTOCOL_CONNECTION_LOST") {
                    console.warn("⚠️ Conexão MySQL perdida. Chaveando para modo de armazenamento local.");
                    modoAtivo = "memoria";
                    return executarQueryMemoria(sql, params);
                }
                throw erro;
            }
        }
        return executarQueryMemoria(sql, params);
    },

    async getConnection() {
        if (modoAtivo === "mysql") {
            return await mysqlPool.getConnection();
        }
        return {
            query: (sql, params) => executarQueryMemoria(sql, params),
            release: () => {}
        };
    }
};

/**
 * Testa a conexão com o MySQL. Se não estiver ativo, ativa o modo resiliente
 * em memória/local sem derrubar o servidor Express.
 */
async function testarConexao() {
    try {
        const conexao = await mysqlPool.getConnection();
        try {
            await conexao.query("SELECT 1");
            modoAtivo = "mysql";
            console.log("✅ [BANCO DE DADOS] Conexão MySQL estabelecida com sucesso! (Banco: " + (process.env.DB_NAME || "concessionaria") + ")");
            return { modo: "mysql", sucesso: true };
        } finally {
            conexao.release();
        }
    } catch (erro) {
        modoAtivo = "memoria";
        console.log("\n-------------------------------------------------------------");
        console.log("ℹ️  [MODO RESILIENTE ATIVADO]");
        console.log(`   MySQL não detectado na porta ${process.env.DB_PORT || 3306} (${erro.code || erro.message}).`);
        console.log("   O backend continuará 100% OPERACIONAL usando armazenamento local!");
        console.log("   Os dados são salvos em: database/dados_locais.json");
        console.log("   Todas as rotas (GET, POST, PUT, DELETE) e o Thunder Client");
        console.log("   funcionarão perfeitamente agora mesmo no VSCode.");
        console.log("   (Quando quiser usar MySQL, basta iniciar o serviço e reiniciar).");
        console.log("-------------------------------------------------------------\n");
        return { modo: "memoria", sucesso: false, erro: erro.message };
    }
}

function obterModoAtivo() {
    return modoAtivo;
}

export { pool, testarConexao, obterModoAtivo, dadosMemoria };
