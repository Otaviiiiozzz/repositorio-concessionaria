import express from "express";
import "dotenv/config";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuariosRoutes.js";
import veiculosRoutes from "./routes/veiculosRoutes.js";
import propostasRoutes from "./routes/propostasRoutes.js";
import { listarCategorias } from "./controllers/veiculosController.js";
import { testarConexao, obterModoAtivo, obterConfigConectada } from "./database/conexao.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(corsMiddleware);
app.use(express.json());

// Rota base / documentação interativa da API
app.get("/", (req, res) => {
    const config = obterConfigConectada();
    res.status(200).json({
        sistema: "AutoPrime Motors - Gestão de Concessionária",
        versao: "4.0.0 (Entrega Final: Solução Completa de Gestão de Concessionária)",
        status: "Online",
        modoBanco: obterModoAtivo(),
        detalhesBanco: obterModoAtivo() === "mysql" ? {
            status: "Conectado ao MySQL Workbench",
            host: `${config.host}:${config.port}`,
            banco: config.database,
            tabelas: ["perfis", "usuarios", "categorias", "veiculos", "propostas"]
        } : {
            status: "Armazenamento Local Resiliente (JSON)",
            arquivo: "backend/database/dados_locais.json"
        },
        perfisCadastrados: [
            { id: 1, nome: "admin", descricao: "Acesso total, gestão de usuários e exclusão de estoque" },
            { id: 2, nome: "vendedor", descricao: "Gestão do catálogo de veículos e aprovação de propostas" },
            { id: 3, nome: "cliente", descricao: "Consulta ao catálogo e envio de propostas de compra" }
        ],
        usuariosTesteProntos: [
            { perfil: "admin", email: "admin@autoprime.com", senhaPadrao: "admin123" },
            { perfil: "vendedor", email: "vendedor@autoprime.com", senhaPadrao: "vendedor123" },
            { perfil: "cliente", email: "cliente@autoprime.com", senhaPadrao: "cliente123" }
        ],
        rotas: {
            autenticacao: {
                "POST /auth/registrar": "Cadastro de novo usuário (senha protegida com bcrypt)",
                "POST /auth/login":     "Login de usuário (retorna JWT assinado com perfil)",
                "GET  /auth/me":        "Dados do usuário logado (Requer Bearer Token)",
                "GET  /auth/perfis":    "Lista perfis de acesso"
            },
            usuarios: {
                "GET   /usuarios":            "Lista usuários (Requer perfil 'admin')",
                "POST  /usuarios":            "Cria usuário com perfil específico (Requer 'admin')",
                "GET   /usuarios/:id":        "Dados de um usuário (Admin ou próprio usuário)",
                "PATCH /usuarios/:id/status": "Ativa ou inativa usuário (Requer 'admin')"
            },
            veiculos: {
                "GET    /veiculos":        "Lista veículos com filtros (?busca= &fabricante= &preco_max= &ordenar=)",
                "GET    /veiculos/resumo": "Métricas consolidadas do estoque (total, valor, km média)",
                "GET    /veiculos/:id":    "Detalhes de um veículo específico",
                "POST   /veiculos":        "Cadastra veículo no estoque (Requer 'admin' ou 'vendedor')",
                "PUT    /veiculos/:id":    "Atualiza dados cadastrais (Requer 'admin' ou 'vendedor')",
                "DELETE /veiculos/:id":    "Remove veículo do estoque (Requer 'admin')"
            },
            propostas: {
                "POST  /propostas":           "Envia proposta de compra para veículo (Requer autenticação)",
                "GET   /propostas/minhas":    "Lista propostas enviadas pelo cliente logado",
                "GET   /propostas":           "Lista todas as propostas (Requer 'admin' ou 'vendedor')",
                "PATCH /propostas/:id/status": "Atualiza status da proposta (Requer 'admin' ou 'vendedor')"
            }
        }
    });
});

// Rotas dos módulos
app.get("/categorias", listarCategorias);
app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/veiculos", veiculosRoutes);
app.use("/propostas", propostasRoutes);

// Tratamento para rotas inexistentes (404)
app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada",
        mensagem: `A rota ${req.method} ${req.url} não existe nesta API.`,
        documentacao: "/"
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
            console.log(`🚗 AutoPrime Motors - Sistema Concessionária Ativo!`);
            console.log(`📡 URL Base:        http://localhost:${PORT}`);
            if (statusBanco.modo === "mysql") {
                console.log(`💾 Banco Ativo:     MYSQL WORKBENCH (CONECTADO) ✅`);
                console.log(`   -> Tabelas:      perfis, usuarios, categorias, veiculos, propostas`);
            } else {
                console.log(`💾 Banco Ativo:     Modo Local Resiliente (JSON)`);
                console.log(`   -> Arquivo:      database/dados_locais.json`);
            }
            console.log("-------------------------------------------------------------");
            console.log("🔑 Autenticação & JWT habilitados:");
            console.log("   Admin:    admin@autoprime.com    / admin123");
            console.log("   Vendedor: vendedor@autoprime.com / vendedor123");
            console.log("   Cliente:  cliente@autoprime.com  / cliente123");
            console.log("=============================================================\n");
        });
    } catch (erro) {
        console.error("❌ Falha crítica ao inicializar o servidor:", erro);
        process.exit(1);
    }
}

iniciarServidor();
