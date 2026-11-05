import { Router } from "express";
import propostasController from "../controllers/propostasController.js";
import { autenticarToken, autorizarPerfis } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas as rotas de proposta requerem autenticação
router.use(autenticarToken);

// Cliente: envia proposta e visualiza suas próprias propostas
router.post("/", propostasController.criar);
router.get("/minhas", propostasController.listarMinhas);

// Vendedor e Administrador: gerenciam todas as propostas
router.get("/", autorizarPerfis("admin", "vendedor"), propostasController.listarTodas);
router.patch("/:id/status", autorizarPerfis("admin", "vendedor"), propostasController.atualizarStatus);

export default router;
