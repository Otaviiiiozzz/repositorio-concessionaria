import bcrypt from "bcryptjs";
import { pool } from "../database/conexao.js";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usuariosController = {
    /**
     * GET /usuarios
     * Lista todos os usuários (apenas Administrador)
     */
    async listar(req, res, next) {
        try {
            const [usuarios] = await pool.query(
                `SELECT u.id, u.nome, u.email, u.telefone, u.ativo, u.criado_em,
                        p.id AS perfil_id, p.nome AS perfil_nome
                 FROM usuarios u
                 INNER JOIN perfis p ON u.perfil_id = p.id
                 ORDER BY u.id ASC`
            );

            return res.status(200).json({
                total: usuarios.length,
                usuarios: usuarios.map(u => ({
                    id: u.id,
                    nome: u.nome,
                    email: u.email,
                    telefone: u.telefone,
                    ativo: u.ativo === 1,
                    criado_em: u.criado_em,
                    perfil: {
                        id: u.perfil_id,
                        nome: u.perfil_nome
                    }
                }))
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * GET /usuarios/:id
     * Busca um usuário por ID (Admin ou o próprio usuário)
     */
    async obterPorId(req, res, next) {
        try {
            const id = Number(req.params.id);

            // Permite se for admin ou se o usuário autenticado for o dono do ID
            if (req.usuario.perfil !== "admin" && req.usuario.id !== id) {
                return res.status(403).json({
                    erro: "Acesso negado",
                    mensagem: "Você não tem permissão para visualizar dados de outro usuário."
                });
            }

            const [rows] = await pool.query(
                `SELECT u.id, u.nome, u.email, u.telefone, u.ativo, u.criado_em,
                        p.nome AS perfil_nome, p.descricao AS perfil_descricao
                 FROM usuarios u
                 INNER JOIN perfis p ON u.perfil_id = p.id
                 WHERE u.id = ?`,
                [id]
            );

            const usuario = rows && rows[0];

            if (!usuario) {
                return res.status(404).json({
                    erro: "Usuário não encontrado",
                    mensagem: `Não foi encontrado nenhum usuário com ID ${id}.`
                });
            }

            return res.status(200).json({
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    telefone: usuario.telefone,
                    ativo: usuario.ativo === 1,
                    criado_em: usuario.criado_em,
                    perfil: {
                        nome: usuario.perfil_nome,
                        descricao: usuario.perfil_descricao
                    }
                }
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * POST /usuarios
     * Criação de novos usuários pelo Administrador (com definição de perfil)
     */
    async criar(req, res, next) {
        try {
            const { nome, email, senha, perfil_id, telefone } = req.body;

            if (!nome || typeof nome !== "string" || nome.trim().length < 3) {
                return res.status(400).json({ erro: "Dados inválidos", mensagem: "O campo 'nome' é obrigatório." });
            }

            if (!email || !REGEX_EMAIL.test(email.trim())) {
                return res.status(400).json({ erro: "Dados inválidos", mensagem: "Informe um e-mail válido." });
            }

            if (!senha || senha.length < 6) {
                return res.status(400).json({ erro: "Dados inválidos", mensagem: "A senha deve ter no mínimo 6 caracteres." });
            }

            const perfil = Number(perfil_id) || 3;
            if (![1, 2, 3].includes(perfil)) {
                return res.status(400).json({ erro: "Perfil inválido", mensagem: "O perfil deve ser 1 (admin), 2 (vendedor) ou 3 (cliente)." });
            }

            const emailNormalizado = email.trim().toLowerCase();

            const [existente] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [emailNormalizado]);
            if (existente && existente.length > 0) {
                return res.status(409).json({ erro: "E-mail duplicado", mensagem: "Já existe um usuário com este e-mail." });
            }

            const senhaHash = await bcrypt.hash(senha, 10);

            const [resultado] = await pool.query(
                `INSERT INTO usuarios (nome, email, senha, perfil_id, telefone) VALUES (?, ?, ?, ?, ?)`,
                [nome.trim(), emailNormalizado, senhaHash, perfil, telefone || null]
            );

            return res.status(201).json({
                mensagem: "Usuário criado com sucesso pelo Administrador!",
                usuario: {
                    id: resultado.insertId,
                    nome: nome.trim(),
                    email: emailNormalizado,
                    perfil_id: perfil,
                    telefone: telefone || null
                }
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * PATCH /usuarios/:id/status
     * Ativa ou desativa um usuário (apenas Administrador)
     */
    async alterarStatus(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { ativo } = req.body;

            if (ativo === undefined || (ativo !== 0 && ativo !== 1 && ativo !== true && ativo !== false)) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "Informe o campo 'ativo' como 1 (ativo) ou 0 (inativo)."
                });
            }

            // Impede desativar a própria conta de admin
            if (req.usuario.id === id) {
                return res.status(400).json({
                    erro: "Operação não permitida",
                    mensagem: "Você não pode desativar o seu próprio usuário administrador."
                });
            }

            const valorAtivo = (ativo === 1 || ativo === true) ? 1 : 0;

            const [resultado] = await pool.query(
                "UPDATE usuarios SET ativo = ? WHERE id = ?",
                [valorAtivo, id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Usuário não encontrado",
                    mensagem: `Não foi encontrado nenhum usuário com ID ${id}.`
                });
            }

            return res.status(200).json({
                mensagem: `Usuário ${valorAtivo === 1 ? "ativado" : "desativado"} com sucesso!`,
                usuario_id: id,
                ativo: valorAtivo === 1
            });
        } catch (erro) {
            next(erro);
        }
    }
};

export default usuariosController;
