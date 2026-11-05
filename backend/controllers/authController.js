import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { pool } from "../database/conexao.js";

const JWT_SECRET = process.env.JWT_SECRET || "autoprime_super_secret_jwt_key_2026_seguro";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller responsável pela Autenticação e Registro de Usuários
 */
const authController = {
    /**
     * POST /auth/registrar
     * Cadastro público de novos usuários (padrão: perfil 'cliente')
     */
    async registrar(req, res, next) {
        try {
            const { nome, email, senha, telefone, perfil_id } = req.body;

            // 1. Validações de entrada
            if (!nome || typeof nome !== "string" || nome.trim().length < 3) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "O campo 'nome' é obrigatório e deve conter ao menos 3 caracteres."
                });
            }

            if (!email || !REGEX_EMAIL.test(email.trim())) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "Informe um endereço de e-mail válido."
                });
            }

            if (!senha || typeof senha !== "string" || senha.length < 6) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    mensagem: "A 'senha' é obrigatória e deve ter no mínimo 6 caracteres."
                });
            }

            const emailNormalizado = email.trim().toLowerCase();

            // 2. Verifica se o e-mail já existe
            const [existente] = await pool.query(
                "SELECT id FROM usuarios WHERE email = ?",
                [emailNormalizado]
            );

            if (existente && existente.length > 0) {
                return res.status(409).json({
                    erro: "E-mail já cadastrado",
                    mensagem: "Já existe uma conta associada a este endereço de e-mail."
                });
            }

            // 3. Criptografa a senha com hash bcrypt (salt rounds = 10)
            const saltRounds = 10;
            const senhaHash = await bcrypt.hash(senha, saltRounds);

            // 4. Perfil: Usuário comum registra como cliente (id = 3).
            // Caso seja criado via endpoint por admin, pode passar perfil_id.
            let perfilFinal = 3;
            if (perfil_id && Number(perfil_id) >= 1 && Number(perfil_id) <= 3) {
                // Se quem estiver chamando for um admin autenticado, permite escolher perfil
                if (req.usuario && req.usuario.perfil === "admin") {
                    perfilFinal = Number(perfil_id);
                }
            }

            // 5. Insere no banco de dados
            const [resultado] = await pool.query(
                `INSERT INTO usuarios (nome, email, senha, perfil_id, telefone) VALUES (?, ?, ?, ?, ?)`,
                [nome.trim(), emailNormalizado, senhaHash, perfilFinal, telefone ? telefone.trim() : null]
            );

            const novoUsuarioId = resultado.insertId;

            // 6. Busca dados com perfil associado para gerar o token
            const [usuarioCadastradoRows] = await pool.query(
                `SELECT u.id, u.nome, u.email, u.telefone, u.ativo, p.nome AS perfil_nome
                 FROM usuarios u
                 INNER JOIN perfis p ON u.perfil_id = p.id
                 WHERE u.email = ?`,
                [emailNormalizado]
            );

            const usuario = usuarioCadastradoRows[0] || {
                id: novoUsuarioId,
                nome: nome.trim(),
                email: emailNormalizado,
                perfil_nome: perfilFinal === 1 ? "admin" : (perfilFinal === 2 ? "vendedor" : "cliente"),
                telefone: telefone || null
            };

            // 7. Gera token JWT
            const token = jwt.sign(
                {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil_nome
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil_nome,
                    telefone: usuario.telefone
                }
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * POST /auth/login
     * Autenticação com e-mail e senha, validação de hash e geração de JWT
     */
    async login(req, res, next) {
        try {
            const { email, senha } = req.body;

            // 1. Validação de campos obrigatórios
            if (!email || !senha) {
                return res.status(400).json({
                    erro: "Dados incompletos",
                    mensagem: "Informe 'email' e 'senha' para realizar login."
                });
            }

            const emailNormalizado = email.trim().toLowerCase();

            // 2. Busca o usuário pelo e-mail no banco
            const [rows] = await pool.query(
                `SELECT u.id, u.nome, u.email, u.senha, u.ativo, p.nome AS perfil_nome
                 FROM usuarios u
                 INNER JOIN perfis p ON u.perfil_id = p.id
                 WHERE u.email = ?`,
                [emailNormalizado]
            );

            const usuario = rows && rows[0];

            // 3. Segurança: se não encontrou o usuário, retorna 401 sem detalhar se o e-mail existe
            if (!usuario) {
                return res.status(401).json({
                    erro: "Credenciais inválidas",
                    mensagem: "E-mail ou senha incorretos."
                });
            }

            // 4. Verifica se a conta está ativa
            if (usuario.ativo === 0) {
                return res.status(403).json({
                    erro: "Conta desativada",
                    mensagem: "Seu acesso foi desativado pela administração."
                });
            }

            // 5. Validação da senha criptografada via bcrypt
            const senhaValida = await bcrypt.compare(senha, usuario.senha);

            if (!senhaValida) {
                return res.status(401).json({
                    erro: "Credenciais inválidas",
                    mensagem: "E-mail ou senha incorretos."
                });
            }

            // 6. Geração do token JWT com payload do perfil
            const token = jwt.sign(
                {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil_nome
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.status(200).json({
                mensagem: "Login realizado com sucesso!",
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil_nome
                }
            });
        } catch (erro) {
            next(erro);
        }
    },

    /**
     * GET /auth/me
     * Retorna os dados do usuário autenticado a partir do token
     */
    async me(req, res, next) {
        try {
            const usuarioId = req.usuario.id;

            const [rows] = await pool.query(
                `SELECT u.id, u.nome, u.email, u.telefone, u.ativo, u.criado_em,
                        p.nome AS perfil_nome, p.descricao AS perfil_descricao
                 FROM usuarios u
                 INNER JOIN perfis p ON u.perfil_id = p.id
                 WHERE u.id = ?`,
                [usuarioId]
            );

            const usuario = rows && rows[0];

            if (!usuario) {
                return res.status(404).json({
                    erro: "Usuário não encontrado",
                    mensagem: "Não foi possível localizar o usuário no banco de dados."
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
     * GET /auth/perfis
     * Lista os perfis de acesso cadastrados
     */
    async listarPerfis(req, res, next) {
        try {
            const [perfis] = await pool.query("SELECT id, nome, descricao FROM perfis ORDER BY id ASC");
            return res.status(200).json({ perfis });
        } catch (erro) {
            next(erro);
        }
    }
};

export default authController;
