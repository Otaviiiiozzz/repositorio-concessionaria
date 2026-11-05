import { Router } from "express";
import authController from "../controllers/authController.js";
import { autenticarToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Rotas públicas de autenticação
router.post("/registrar", authController.registrar);
router.post("/login", authController.login);
router.get("/perfis", authController.listarPerfis);

// Rota protegida por JWT (retorna o usuário logado a partir do token)
router.get("/me", autenticarToken, authController.me);

export default router;
