import mysql from "mysql2/promise";
import "dotenv/config";

async function migrar() {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "concessionaria"
    });

    console.log("Conectado ao MySQL concessionaria. Verificando estrutura...");

    const [cols] = await c.query("SHOW COLUMNS FROM veiculos");
    const nomes = cols.map(col => col.Field);

    if (!nomes.includes("status")) {
        console.log("Adicionando coluna 'status' em veiculos...");
        await c.query("ALTER TABLE veiculos ADD COLUMN status ENUM('disponivel', 'reservado', 'vendido') NOT NULL DEFAULT 'disponivel' AFTER preco;");
    }

    if (!nomes.includes("categoria_id")) {
        console.log("Adicionando coluna 'categoria_id' em veiculos...");
        await c.query("ALTER TABLE veiculos ADD COLUMN categoria_id INT NULL AFTER status;");
        await c.query("ALTER TABLE veiculos ADD CONSTRAINT fk_veiculos_categorias FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;");
    }

    if (!nomes.includes("cadastrado_por")) {
        console.log("Adicionando coluna 'cadastrado_por' em veiculos...");
        await c.query("ALTER TABLE veiculos ADD COLUMN cadastrado_por INT NULL AFTER categoria_id;");
        await c.query("ALTER TABLE veiculos ADD CONSTRAINT fk_veiculos_usuarios FOREIGN KEY (cadastrado_por) REFERENCES usuarios(id) ON DELETE SET NULL;");
    }

    // Atualiza categoria_id dos 8 veículos iniciais caso estejam nulos
    await c.query("UPDATE veiculos SET categoria_id = 1 WHERE id IN (1, 2, 4) AND categoria_id IS NULL;");
    await c.query("UPDATE veiculos SET categoria_id = 2 WHERE id IN (5, 6, 7, 8) AND categoria_id IS NULL;");
    await c.query("UPDATE veiculos SET categoria_id = 3 WHERE id IN (3) AND categoria_id IS NULL;");

    console.log("✅ Migração concluída com sucesso!");
    const [colsFinais] = await c.query("DESCRIBE veiculos");
    console.table(colsFinais);

    await c.end();
}

migrar().catch(err => {
    console.error("Erro na migração:", err);
    process.exit(1);
});
