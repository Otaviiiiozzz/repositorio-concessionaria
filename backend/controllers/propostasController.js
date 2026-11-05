import { pool } from "../database/conexao.js";

const FORMAS_PAGAMENTO_VALIDAS = ["a_vista", "financiamento", "consorcio", "troca"];
const STATUS_VALIDOS = ["pendente", "aprovada", "recusada", "cancelada"];

const propostasController = {
    /**
     * POST /propostas
     * Envia uma nova proposta de compra para um veículo
     */
    async criar(req, res, next) {
        try {
            const { veiculo_id, valor_proposta, forma_pagamento, observacoes } = req.body;
            const clienteId = req.usuario.id;

            // 1. Validação do ID do veículo
            if (!veiculo_id || isNaN(Number(veiculo_id))) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "O campo 'veiculo_id' é obrigatório e deve ser um número válido."
                });
            }

            // 2. Validação do valor da proposta
            const valor = Number(valor_proposta);
            if (!valor_proposta || isNaN(valor) || valor <= 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "O campo 'valor_proposta' deve ser um número positivo."
                });
            }

            // 3. Validação da forma de pagamento
            const forma = forma_pagamento || "a_vista";
            if (!FORMAS_PAGAMENTO_VALIDAS.includes(forma)) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: `Forma de pagamento inválida. Opções permitidas: ${FORMAS_PAGAMENTO_VALIDAS.join(", ")}.`
                });
            }

            // 4. Verifica se o veículo existe
            const [veiculos] = await pool.query("SELECT id, modelo, preco, status FROM veiculos WHERE id = ?", [Number(veiculo_id)]);
            if (!veiculos || veiculos.length === 0) {
                return res.status(404).json({
                    erro: "Veículo não encontrado",
                    mensagem: `O veículo de ID ${veiculo_id} não existe no catálogo.`
                });
            }

            const veiculo = veiculos[0];

            // 5. Insere a proposta no banco de dados
            const [resultado] = await pool.query(
                `INSERT INTO propostas (veiculo_id, cliente_id, vendedor_id, valor_proposta, forma_pagamento, observacoes)
                 VALUES (?, ?, NULL, ?, ?, ?)`,
                [veiculo.id, clienteId, valor, forma, observacoes || null]
            );

            return res.status(201).json({
                mensagem: "Proposta enviada com sucesso! Nossos vendedores irão analisar sua solicitação.",
                proposta: {
                    id: resultado.insertId,
                    veiculo_id: veiculo.id,
                    veiculo_modelo: veiculo.modelo,
                    cliente_id: clienteId,
                    cliente_nome: req.usuario.nome,
                    valor_proposta: valor,
                    forma_pagamento: forma,
                    status: "pendente",
                    observacoes: observacoes || ""
                }
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * GET /propostas
     * Lista todas as propostas (Acesso: Admin e Vendedor)
     */
    async listarTodas(req, res, next) {
        try {
            const [propostas] = await pool.query(
                `SELECT p.id, p.veiculo_id, p.cliente_id, p.vendedor_id, p.valor_proposta,
                        p.status, p.forma_pagamento, p.observacoes, p.criado_em,
                        v.modelo AS veiculo_modelo, v.fabricante AS veiculo_fabricante, v.preco AS veiculo_preco,
                        u.nome AS cliente_nome, u.email AS cliente_email,
                        vend.nome AS vendedor_nome
                 FROM propostas p
                 INNER JOIN veiculos v ON p.veiculo_id = v.id
                 INNER JOIN usuarios u ON p.cliente_id = u.id
                 LEFT JOIN usuarios vend ON p.vendedor_id = vend.id
                 ORDER BY p.id DESC`
            );

            return res.status(200).json({
                total: propostas.length,
                propostas
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * GET /propostas/minhas
     * Lista as propostas do cliente atualmente autenticado
     */
    async listarMinhas(req, res, next) {
        try {
            const clienteId = req.usuario.id;

            const [propostas] = await pool.query(
                `SELECT p.id, p.veiculo_id, p.valor_proposta, p.status, p.forma_pagamento,
                        p.observacoes, p.criado_em,
                        v.modelo AS veiculo_modelo, v.fabricante AS veiculo_fabricante, v.preco AS veiculo_preco
                 FROM propostas p
                 INNER JOIN veiculos v ON p.veiculo_id = v.id
                 WHERE p.cliente_id = ?
                 ORDER BY p.id DESC`,
                [clienteId]
            );

            return res.status(200).json({
                total: propostas.length,
                propostas
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * PATCH /propostas/:id/status
     * Atualiza o status de uma proposta (Acesso: Admin e Vendedor)
     */
    async atualizarStatus(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { status } = req.body;
            const vendedorId = req.usuario.id;

            if (!status || !STATUS_VALIDOS.includes(status)) {
                return res.status(400).json({
                    erro: "Status inválido",
                    mensagem: `O status deve ser um dos seguintes: ${STATUS_VALIDOS.join(", ")}.`
                });
            }

            const [resultado] = await pool.query(
                `UPDATE propostas SET status = ?, vendedor_id = ? WHERE id = ?`,
                [status, vendedorId, id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Proposta não encontrada",
                    mensagem: `Não foi encontrada proposta com ID ${id}.`
                });
            }

            return res.status(200).json({
                mensagem: `Status da proposta #${id} atualizado para '${status}' com sucesso!`,
                proposta_id: id,
                novo_status: status,
                atualizado_por: req.usuario.nome
            });
        } catch (erro) {
            next(erro);
        }
    }
};

export default propostasController;
