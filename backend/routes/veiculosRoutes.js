import express from "express";
import {
    listarVeiculos,
    buscarVeiculoPorId,
    obterResumoEstoque,
    listarCategorias,
    cadastrarVeiculo,
    atualizarVeiculo,
    excluirVeiculo
} from "../controllers/veiculosController.js";
import { autenticarToken, autorizarPerfis } from "../middlewares/authMiddleware.js";

const router = express.Router();

// =====================================================================
// Rotas Públicas (Catálogo e Detalhes abertos ao público/visitante)
// =====================================================================
router.get("/categorias", listarCategorias);
router.get("/resumo", obterResumoEstoque);
router.get("/", listarVeiculos);
router.get("/:id", buscarVeiculoPorId);

// =====================================================================
// Rotas Protegidas por Autenticação JWT e Controle de Permissões (RBAC)
// =====================================================================
// Cadastrar e Editar: Permitido para Vendedores e Administradores
router.post("/", autenticarToken, autorizarPerfis("admin", "vendedor"), cadastrarVeiculo);
router.put("/:id", autenticarToken, autorizarPerfis("admin", "vendedor"), atualizarVeiculo);

// Exclusão de Veículos: Restrita exclusivamente a Administradores
router.delete("/:id", autenticarToken, autorizarPerfis("admin"), excluirVeiculo);

export default router;
