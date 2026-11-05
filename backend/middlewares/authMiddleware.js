import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || "autoprime_super_secret_jwt_key_2026_seguro";

/**
 * Middleware de Autenticação com JWT
 * Verifica a presença e integridade do token enviado no header Authorization: Bearer <token>
 */
export function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extrai "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            erro: "Acesso não autorizado",
            mensagem: "Token de autenticação não fornecido no cabeçalho Authorization. Faça login para continuar."
        });
    }

    jwt.verify(token, JWT_SECRET, (erro, usuarioDecodificado) => {
        if (erro) {
            return res.status(403).json({
                erro: "Acesso proibido",
                mensagem: "Token de autenticação inválido ou expirado. Por favor, realize o login novamente."
            });
        }

        // Anexa os dados do usuário autenticado à requisição
        req.usuario = usuarioDecodificado;
        next();
    });
}

/**
 * Middleware de Autorização Baseado em Perfis / Funções (RBAC)
 * Permite a execução apenas se o perfil do usuário autenticado estiver na lista autorizada
 * @param  {...string} perfisPermitidos - Lista de perfis aceitos (ex: 'admin', 'vendedor', 'cliente')
 */
export function autorizarPerfis(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.perfil) {
            return res.status(401).json({
                erro: "Não autenticado",
                mensagem: "Usuário não autenticado no sistema."
            });
        }

        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({
                erro: "Permissão insuficiente",
                mensagem: `Ação restrita aos perfis: [${perfisPermitidos.join(", ")}]. Seu perfil atual é '${req.usuario.perfil}'.`
            });
        }

        next();
    };
}
