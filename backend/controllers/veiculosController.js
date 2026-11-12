import { pool, obterModoAtivo } from "../database/conexao.js";

/**
 * Validação rigorosa dos dados de um veículo
 */
function validarVeiculo(dados) {
    const { modelo, fabricante, ano, quilometragem, preco } = dados;

    if (!modelo || typeof modelo !== "string" || !modelo.trim()) {
        return "Informe o modelo do veículo.";
    }
    if (!fabricante || typeof fabricante !== "string" || !fabricante.trim()) {
        return "Informe o fabricante do veículo.";
    }
    if (ano === "" || ano == null || isNaN(Number(ano))) {
        return "Informe o ano de fabricação do veículo.";
    }
    const anoNum = Number(ano);
    const anoAtual = new Date().getFullYear();
    if (!Number.isInteger(anoNum) || anoNum < 1900 || anoNum > anoAtual + 1) {
        return `O ano deve ser um valor inteiro entre 1900 e ${anoAtual + 1}.`;
    }
    if (quilometragem === "" || quilometragem == null || isNaN(Number(quilometragem))) {
        return "Informe a quilometragem do veículo.";
    }
    const kmNum = Number(quilometragem);
    if (!Number.isFinite(kmNum) || kmNum < 0) {
        return "A quilometragem deve ser um número maior ou igual a zero.";
    }
    if (preco === "" || preco == null || isNaN(Number(preco))) {
        return "Informe o preço do veículo.";
    }
    const precoNum = Number(preco);
    if (!Number.isFinite(precoNum) || precoNum <= 0) {
        return "O preço deve ser um valor positivo maior que zero.";
    }
    return null;
}

/**
 * GET /veiculos
 * Suporta filtros via query string: ?busca=corolla&fabricante=Toyota&preco_max=160000&ordenar=preco_asc&categoria_id=1
 */
async function listarVeiculos(req, res) {
    try {
        const { busca, fabricante, preco_max, ordenar, categoria_id } = req.query;

        // Consulta veículos no MySQL com JOIN na tabela categorias
        const [todosVeiculos] = await pool.query(`
            SELECT v.*, c.nome AS categoria_nome
            FROM veiculos v
            LEFT JOIN categorias c ON v.categoria_id = c.id
            ORDER BY v.id DESC
        `);

        let resultado = [...todosVeiculos];

        if (busca && busca.trim()) {
            const termo = busca.trim().toLowerCase();
            resultado = resultado.filter(v =>
                (v.modelo && v.modelo.toLowerCase().includes(termo)) ||
                (v.fabricante && v.fabricante.toLowerCase().includes(termo))
            );
        }

        if (fabricante && fabricante.trim()) {
            const fab = fabricante.trim().toLowerCase();
            resultado = resultado.filter(v =>
                v.fabricante && v.fabricante.toLowerCase() === fab
            );
        }

        if (categoria_id && !isNaN(Number(categoria_id))) {
            const catId = Number(categoria_id);
            resultado = resultado.filter(v => Number(v.categoria_id) === catId);
        }

        if (preco_max && !isNaN(Number(preco_max))) {
            const pMax = Number(preco_max);
            resultado = resultado.filter(v => Number(v.preco) <= pMax);
        }

        // Ordenação
        if (ordenar === "preco_asc") {
            resultado.sort((a, b) => Number(a.preco) - Number(b.preco));
        } else if (ordenar === "preco_desc") {
            resultado.sort((a, b) => Number(b.preco) - Number(a.preco));
        } else if (ordenar === "ano_desc") {
            resultado.sort((a, b) => Number(b.ano) - Number(a.ano));
        } else if (ordenar === "km_asc") {
            resultado.sort((a, b) => Number(a.quilometragem) - Number(b.quilometragem));
        }

        res.status(200).json(resultado);
    } catch (erro) {
        console.error("Erro ao listar veículos:", erro);
        res.status(500).json({ mensagem: "Erro ao listar veículos", erro: erro.message });
    }
}

/**
 * GET /veiculos/:id
 * Busca um veículo específico pelo seu identificador único no MySQL
 */
async function buscarVeiculoPorId(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID do veículo inválido. Deve ser um número inteiro positivo." });
    }

    try {
        const [veiculos] = await pool.query(`
            SELECT v.*, c.nome AS categoria_nome, u.nome AS cadastrado_por_nome
            FROM veiculos v
            LEFT JOIN categorias c ON v.categoria_id = c.id
            LEFT JOIN usuarios u ON v.cadastrado_por = u.id
            WHERE v.id = ?
        `, [id]);

        if (veiculos.length === 0) {
            return res.status(404).json({ mensagem: `Veículo com ID #${id} não encontrado no estoque.` });
        }
        res.status(200).json(veiculos[0]);
    } catch (erro) {
        console.error("Erro ao buscar veículo por ID:", erro);
        res.status(500).json({ mensagem: "Erro ao buscar veículo", erro: erro.message });
    }
}

/**
 * GET /veiculos/resumo
 * Retorna dados agregados do estoque (quantidade, valor total, média km, marcas)
 */
async function obterResumoEstoque(req, res) {
    try {
        const [veiculos] = await pool.query("SELECT * FROM veiculos ORDER BY id DESC");
        const total = veiculos.length;
        const valorTotal = veiculos.reduce((sum, v) => sum + Number(v.preco || 0), 0);
        const somaKm = veiculos.reduce((sum, v) => sum + Number(v.quilometragem || 0), 0);
        const mediaKm = total > 0 ? Math.round(somaKm / total) : 0;

        const fabricantes = {};
        veiculos.forEach(v => {
            const fab = v.fabricante || "Outro";
            fabricantes[fab] = (fabricantes[fab] || 0) + 1;
        });

        res.status(200).json({
            totalVeiculos: total,
            valorTotalEstoque: valorTotal,
            quilometragemMedia: mediaKm,
            distribuicaoFabricantes: fabricantes,
            modoArmazenamento: obterModoAtivo()
        });
    } catch (erro) {
        console.error("Erro ao gerar resumo do estoque:", erro);
        res.status(500).json({ mensagem: "Erro ao calcular resumo do estoque", erro: erro.message });
    }
}

/**
 * GET /veiculos/categorias (ou /categorias)
 * Lista todas as categorias registradas no MySQL
 */
async function listarCategorias(req, res) {
    try {
        const [categorias] = await pool.query("SELECT id, nome, descricao FROM categorias ORDER BY id ASC");
        res.status(200).json(categorias);
    } catch (erro) {
        console.error("Erro ao listar categorias:", erro);
        res.status(500).json({ mensagem: "Erro ao listar categorias", erro: erro.message });
    }
}

/**
 * POST /veiculos
 * Cadastra um novo veículo no estoque da concessionária diretamente no MySQL
 */
async function cadastrarVeiculo(req, res) {
    const erroValidacao = validarVeiculo(req.body);
    if (erroValidacao) {
        return res.status(400).json({ mensagem: erroValidacao });
    }

    const { modelo, fabricante, ano, quilometragem, preco, categoria_id } = req.body;
    const cadastradoPor = req.usuario ? req.usuario.id : null;
    try {
        const [resultado] = await pool.query(
            "INSERT INTO veiculos (modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por) VALUES (?, ?, ?, ?, ?, 'disponivel', ?, ?)",
            [modelo.trim(), fabricante.trim(), Number(ano), Number(quilometragem), Number(preco), categoria_id ? Number(categoria_id) : null, cadastradoPor]
        );

        const novoVeiculo = {
            id: resultado.insertId,
            modelo: modelo.trim(),
            fabricante: fabricante.trim(),
            ano: Number(ano),
            quilometragem: Number(quilometragem),
            preco: Number(preco),
            status: "disponivel",
            categoria_id: categoria_id ? Number(categoria_id) : null,
            cadastrado_por: cadastradoPor
        };

        res.status(201).json({
            mensagem: "Veículo cadastrado com sucesso no estoque!",
            id: resultado.insertId,
            veiculo: novoVeiculo
        });
    } catch (erro) {
        console.error("Erro ao cadastrar veículo:", erro);
        res.status(500).json({ mensagem: "Erro ao cadastrar veículo", erro: erro.message });
    }
}

/**
 * PUT /veiculos/:id
 * Atualiza todos os dados de um veículo existente diretamente no MySQL
 */
async function atualizarVeiculo(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID do veículo inválido. Deve ser um número inteiro positivo." });
    }

    const erroValidacao = validarVeiculo(req.body);
    if (erroValidacao) {
        return res.status(400).json({ mensagem: erroValidacao });
    }

    const { modelo, fabricante, ano, quilometragem, preco, categoria_id } = req.body;
    try {
        // Verifica se o veículo existe
        const [existentes] = await pool.query("SELECT id FROM veiculos WHERE id = ?", [id]);
        if (existentes.length === 0) {
            return res.status(404).json({ mensagem: `Veículo com ID #${id} não encontrado para atualização.` });
        }

        await pool.query(
            "UPDATE veiculos SET modelo = ?, fabricante = ?, ano = ?, quilometragem = ?, preco = ?, categoria_id = COALESCE(?, categoria_id) WHERE id = ?",
            [modelo.trim(), fabricante.trim(), Number(ano), Number(quilometragem), Number(preco), categoria_id ? Number(categoria_id) : null, id]
        );

        const veiculoAtualizado = {
            id,
            modelo: modelo.trim(),
            fabricante: fabricante.trim(),
            ano: Number(ano),
            quilometragem: Number(quilometragem),
            preco: Number(preco),
            categoria_id: categoria_id ? Number(categoria_id) : existentes[0].categoria_id
        };

        res.status(200).json({
            mensagem: "Veículo atualizado com sucesso!",
            veiculo: veiculoAtualizado
        });
    } catch (erro) {
        console.error("Erro ao atualizar veículo:", erro);
        res.status(500).json({ mensagem: "Erro ao atualizar veículo", erro: erro.message });
    }
}

/**
 * DELETE /veiculos/:id
 * Remove um veículo do estoque pelo seu ID diretamente no MySQL
 */
async function excluirVeiculo(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ mensagem: "ID do veículo inválido. Deve ser um número inteiro positivo." });
    }

    try {
        const [resultado] = await pool.query("DELETE FROM veiculos WHERE id = ?", [id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensagem: `Veículo com ID #${id} não encontrado para exclusão.` });
        }

        res.status(200).json({
            mensagem: `Veículo #${id} excluído com sucesso do estoque!`,
            id
        });
    } catch (erro) {
        console.error("Erro ao excluir veículo:", erro);
        res.status(500).json({ mensagem: "Erro ao excluir veículo", erro: erro.message });
    }
}

export {
    listarVeiculos,
    buscarVeiculoPorId,
    obterResumoEstoque,
    listarCategorias,
    cadastrarVeiculo,
    atualizarVeiculo,
    excluirVeiculo
};
