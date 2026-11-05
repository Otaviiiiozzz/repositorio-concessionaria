import { Router } from "express";
import usuariosController from "../controllers/usuariosController.js";
import { autenticarToken, autorizarPerfis } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas de usuários exigem autenticação
router.use(autenticarToken);

// Somente admin pode listar todos os usuários ou criar usuários com perfil definido
router.get("/", autorizarPerfis("admin"), usuariosController.listar);
router.post("/", autorizarPerfis("admin"), usuariosController.criar);

// Busca por ID (Admin ou o próprio usuário)
router.get("/:id", usuariosController.obterPorId);

// Ativação / Inativação de contas (Apenas admin)
router.patch("/:id/status", autorizarPerfis("admin"), usuariosController.alterarStatus);

export default router;
