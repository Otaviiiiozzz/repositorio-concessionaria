import express from "express";
import "dotenv/config";
import veiculosRoutes from "./routes/veiculosRoutes.js";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import { testarConexao, obterModoAtivo, obterConfigConectada } from "./database/conexao.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(corsMiddleware);
app.use(express.json());

// Rota base / documentação rápida da API
app.get("/", (req, res) => {
    const config = obterConfigConectada();
    res.status(200).json({
        sistema: "AutoPrime - Gestão de Concessionária",
        versao: "2.5.0",
        modoBanco: obterModoAtivo(),
        detalhesBanco: obterModoAtivo() === "mysql" ? {
            status: "Conectado ao MySQL Workbench",
            host: `${config.host}:${config.port}`,
            banco: config.database,
            tabela: "veiculos",
            instrucaoWorkbench: "SELECT * FROM concessionaria.veiculos;"
        } : {
            status: "Armazenamento Local (Resiliente)",
            arquivo: "backend/database/dados_locais.json"
        },
        documentacao: {
            "GET    /veiculos":             "Lista todos os veículos (suporta ?busca= &fabricante= &preco_max= &ordenar=)",
            "GET    /veiculos/resumo":      "Estatísticas consolidadas do estoque (total, valor, km média)",
            "GET    /veiculos/:id":         "Busca dados detalhados de um veículo por ID",
            "POST   /veiculos":             "Cadastra um novo veículo no estoque",
            "PUT    /veiculos/:id":         "Atualiza dados cadastrais de um veículo",
            "DELETE /veiculos/:id":         "Remove um veículo do estoque"
        }
    });
});

// Rotas da entidade Veículos
app.use("/veiculos", veiculosRoutes);

// Tratamento para rotas inexistentes (404)
app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada",
        mensagem: `A rota ${req.method} ${req.url} não existe nesta API.`,
        rotasValidas: ["/veiculos", "/veiculos/resumo", "/veiculos/:id"]
    });
});

// Middleware global de captura de erros (500)
app.use((erro, req, res, next) => {
    console.error("⚠️ Erro interno capturado:", erro);
    res.status(500).json({
        erro: "Erro interno do servidor",
        mensagem: erro.message || "Ocorreu um erro inesperado."
    });
});

async function iniciarServidor() {
    try {
        const statusBanco = await testarConexao();

        app.listen(PORT, () => {
            console.log("=============================================================");
            console.log(`🚗 AutoPrime Concessionária - Servidor Ativo!`);
            console.log(`📡 URL Base:        http://localhost:${PORT}`);
            if (statusBanco.modo === "mysql") {
                console.log(`💾 Banco Ativo:     MYSQL WORKBENCH (CONECTADO) ✅`);
                console.log(`   -> Tudo o que você alterar grava no MySQL Workbench!`);
                console.log(`   -> Comando Workbench: SELECT * FROM concessionaria.veiculos;`);
            } else {
                console.log(`💾 Banco Ativo:     Modo Local Resiliente (JSON)`);
            }
            console.log("-------------------------------------------------------------");
            console.log("⚡ Rotas prontas para Thunder Client & VSCode:");
            console.log(`   GET    http://localhost:${PORT}/veiculos`);
            console.log(`   GET    http://localhost:${PORT}/veiculos/resumo`);
            console.log(`   GET    http://localhost:${PORT}/veiculos/1`);
            console.log(`   POST   http://localhost:${PORT}/veiculos`);
            console.log(`   PUT    http://localhost:${PORT}/veiculos/1`);
            console.log(`   DELETE http://localhost:${PORT}/veiculos/1`);
            console.log("=============================================================\n");
        });
    } catch (erro) {
        console.error("❌ Falha crítica ao inicializar o servidor:", erro);
        process.exit(1);
    }
}

iniciarServidor();
