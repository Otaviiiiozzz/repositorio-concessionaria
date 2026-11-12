import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const arquivo = path.join(__dirname, "dados_locais.json");

const estado = {
    perfis: [
        { id: 1, nome: "admin", descricao: "Administrador com acesso total ao sistema e gestão de usuários" },
        { id: 2, nome: "vendedor", descricao: "Vendedor com permissão de gerenciar catálogo e responder propostas" },
        { id: 3, nome: "cliente", descricao: "Cliente que navega pelo catálogo e realiza propostas de negociação" }
    ],
    usuarios: [
        { id: 1, nome: "Administrador AutoPrime", email: "admin@autoprime.com", senha: "$2b$10$o6OImj9JXu3Tk3RDfafD9.77LJgP0Pk5eZSt1Gsm982nVQhryKCaG", perfil_id: 1, telefone: "(51) 99999-0001", ativo: 1, criado_em: "2026-01-01T10:00:00.000Z" },
        { id: 2, nome: "Carlos Vendas", email: "vendedor@autoprime.com", senha: "$2b$10$pGlH9lFg5PhxiDxhUxRgzOiEeln4WH6QyWQNyF/q3yKlky0C85aNK", perfil_id: 2, telefone: "(51) 98888-0002", ativo: 1, criado_em: "2026-01-02T10:00:00.000Z" },
        { id: 3, nome: "Mariana Cliente", email: "cliente@autoprime.com", senha: "$2b$10$j8eFVHkqtODwGTJJBvtu8edgO2fsgizrA7xvsFlrYiDsla6LZ.io2", perfil_id: 3, telefone: "(51) 97777-0003", ativo: 1, criado_em: "2026-01-03T10:00:00.000Z" }
    ],
    categorias: [
        { id: 1, nome: "Sedan", descricao: "Carros de três volumes confortáveis com ótimo espaço interno" },
        { id: 2, nome: "SUV", descricao: "Veículos utilitários esportivos com posição de dirigir elevada" },
        { id: 3, nome: "Hatch", descricao: "Modelos compactos com excelente agilidade e economia urbana" },
        { id: 4, nome: "Picape", descricao: "Veículos utilitários robustos para transporte e carga" },
        { id: 5, nome: "Esportivo", descricao: "Veículos de alta performance com design aerodinâmico" }
    ],
    veiculos: [
        { id: 1, modelo: "Corolla XEi 2.0", fabricante: "Toyota", ano: 2024, quilometragem: 12000, preco: 158900.00, status: "disponivel", categoria_id: 1, cadastrado_por: 1 },
        { id: 2, modelo: "Civic Touring", fabricante: "Honda", ano: 2023, quilometragem: 25000, preco: 172500.00, status: "disponivel", categoria_id: 1, cadastrado_por: 1 },
        { id: 3, modelo: "HB20 Comfort", fabricante: "Hyundai", ano: 2022, quilometragem: 45000, preco: 82900.00, status: "disponivel", categoria_id: 3, cadastrado_por: 2 },
        { id: 4, modelo: "Onix Plus LTZ", fabricante: "Chevrolet", ano: 2023, quilometragem: 18000, preco: 97500.00, status: "disponivel", categoria_id: 1, cadastrado_por: 2 },
        { id: 5, modelo: "Compass Limited", fabricante: "Jeep", ano: 2024, quilometragem: 8000, preco: 198700.00, status: "disponivel", categoria_id: 2, cadastrado_por: 1 },
        { id: 6, modelo: "T-Cross Highline", fabricante: "Volkswagen", ano: 2023, quilometragem: 32000, preco: 139900.00, status: "disponivel", categoria_id: 2, cadastrado_por: 2 },
        { id: 7, modelo: "Tracker Premier", fabricante: "Chevrolet", ano: 2022, quilometragem: 41000, preco: 128000.00, status: "disponivel", categoria_id: 2, cadastrado_por: 2 },
        { id: 8, modelo: "Kicks Advance", fabricante: "Nissan", ano: 2023, quilometragem: 22000, preco: 112900.00, status: "disponivel", categoria_id: 2, cadastrado_por: 1 }
    ],
    propostas: [
        { id: 1, veiculo_id: 1, cliente_id: 3, vendedor_id: 2, valor_proposta: 155000.00, status: "pendente", forma_pagamento: "financiamento", observacoes: "Entrada de R$ 50.000 + 36x.", criado_em: "2026-01-05T14:30:00.000Z" },
        { id: 2, veiculo_id: 3, cliente_id: 3, vendedor_id: 2, valor_proposta: 80000.00, status: "aprovada", forma_pagamento: "a_vista", observacoes: "Pagamento via TED.", criado_em: "2026-01-06T11:15:00.000Z" }
    ]
};

async function resetar() {
    // 1. Tenta resetar no MySQL Workbench
    try {
        const c = await mysql.createConnection({
            host: process.env.DB_HOST || "127.0.0.1",
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "admin",
            database: process.env.DB_NAME || "concessionaria"
        });

        await c.query("SET FOREIGN_KEY_CHECKS = 0;");
        await c.query("TRUNCATE TABLE propostas;");
        await c.query("TRUNCATE TABLE veiculos;");
        await c.query("TRUNCATE TABLE usuarios;");
        await c.query("TRUNCATE TABLE categorias;");
        await c.query("TRUNCATE TABLE perfis;");
        await c.query("SET FOREIGN_KEY_CHECKS = 1;");

        for (const p of estado.perfis) {
            await c.query("INSERT INTO perfis (id, nome, descricao) VALUES (?, ?, ?)", [p.id, p.nome, p.descricao]);
        }
        for (const cat of estado.categorias) {
            await c.query("INSERT INTO categorias (id, nome, descricao) VALUES (?, ?, ?)", [cat.id, cat.nome, cat.descricao]);
        }
        for (const u of estado.usuarios) {
            await c.query("INSERT INTO usuarios (id, nome, email, senha, perfil_id, telefone, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)", [u.id, u.nome, u.email, u.senha, u.perfil_id, u.telefone, u.ativo]);
        }
        for (const v of estado.veiculos) {
            await c.query("INSERT INTO veiculos (id, modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [v.id, v.modelo, v.fabricante, v.ano, v.quilometragem, v.preco, v.status, v.categoria_id, v.cadastrado_por]);
        }
        for (const prop of estado.propostas) {
            await c.query("INSERT INTO propostas (id, veiculo_id, cliente_id, vendedor_id, valor_proposta, status, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [prop.id, prop.veiculo_id, prop.cliente_id, prop.vendedor_id, prop.valor_proposta, prop.status, prop.forma_pagamento, prop.observacoes]);
        }

        await c.end();
        console.log("✅ BANCO DE DADOS MYSQL WORKBENCH RESTAURADO COM SUCESSO!");
    } catch (e) {
        console.warn("⚠️ MySQL não conectado durante reset:", e.message);
    }

    // 2. Salva também no arquivo local
    fs.writeFileSync(arquivo, JSON.stringify(estado, null, 2), "utf-8");
    console.log("📋 8 Veículos, 3 Usuários, 3 Perfis, 5 Categorias e 2 Propostas restaurados.");
}

resetar();
