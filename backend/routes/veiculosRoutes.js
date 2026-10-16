import express from "express";
import {
    listarVeiculos,
    buscarVeiculoPorId,
    obterResumoEstoque,
    cadastrarVeiculo,
    atualizarVeiculo,
    excluirVeiculo
} from "../controllers/veiculosController.js";

const router = express.Router();

// Rotas de Veículos da Concessionária
router.get("/", listarVeiculos);
router.get("/resumo", obterResumoEstoque);
router.get("/:id", buscarVeiculoPorId);
router.post("/", cadastrarVeiculo);
router.put("/:id", atualizarVeiculo);
router.delete("/:id", excluirVeiculo);

export default router;
