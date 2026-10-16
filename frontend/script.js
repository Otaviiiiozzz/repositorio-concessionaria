const API_BASE = "http://localhost:3000";
const API_URL = `${API_BASE}/veiculos`;

// Elementos DOM
const formulario = document.getElementById("formVeiculo");
const listaVeiculos = document.getElementById("listaVeiculos");
const mensagem = document.getElementById("mensagem");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");
const btnLimpar = document.getElementById("btnLimpar");
const btnAtualizar = document.getElementById("btnAtualizar");
const etiquetaForm = document.getElementById("etiquetaForm");
const tituloFormulario = document.getElementById("tituloFormulario");
const badgeModoBanco = document.getElementById("badgeModoBanco");

// Filtros
const campoBusca = document.getElementById("campoBusca");
const filtroFabricante = document.getElementById("filtroFabricante");
const filtroOrdenacao = document.getElementById("filtroOrdenacao");

// Campos do Formulário
const campos = {
    modelo: document.getElementById("modelo"),
    fabricante: document.getElementById("fabricante"),
    ano: document.getElementById("ano"),
    quilometragem: document.getElementById("quilometragem"),
    preco: document.getElementById("preco")
};

let idEdicao = null;
let todosVeiculos = [];

// Formatações
const dinheiro = valor => Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
});
const numero = valor => Number(valor || 0).toLocaleString("pt-BR");

function mostrarMensagem(texto, tipo = "info") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = "block";

    if (tipo === "sucesso") {
        setTimeout(() => {
            if (mensagem.textContent === texto) {
                mensagem.className = "mensagem";
                mensagem.textContent = "";
            }
        }, 5000);
    }
}

/**
 * Consulta a saúde da API e o modo do banco de dados (MySQL ou Memória)
 */
async function verificarStatusApi() {
    try {
        const resposta = await fetch(`${API_BASE}/`);
        const dados = await resposta.json();
        if (dados && dados.modoBanco) {
            if (dados.modoBanco === "mysql") {
                badgeModoBanco.textContent = "💾 Banco: MySQL Conectado";
                badgeModoBanco.className = "badge-modo mysql";
            } else {
                badgeModoBanco.textContent = "🚀 Modo: Armazenamento Local";
                badgeModoBanco.className = "badge-modo local";
            }
        }
    } catch {
        badgeModoBanco.textContent = "⚠️ Backend Desconectado";
        badgeModoBanco.className = "badge-modo offline";
    }
}

/**
 * Busca a lista de veículos com filtros opcionais
 */
async function buscarVeiculos() {
    listaVeiculos.innerHTML = '<tr><td colspan="7" class="vazio">Carregando catálogo de veículos...</td></tr>';
    verificarStatusApi();

    try {
        const params = new URLSearchParams();
        if (campoBusca.value.trim()) params.append("busca", campoBusca.value.trim());
        if (filtroFabricante.value) params.append("fabricante", filtroFabricante.value);
        if (filtroOrdenacao.value && filtroOrdenacao.value !== "id_desc") {
            params.append("ordenar", filtroOrdenacao.value);
        }

        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao consultar a API.");
        }

        todosVeiculos = dados;
        atualizarSelectFabricantes(todosVeiculos);
        renderizarVeiculos(todosVeiculos);
        atualizarResumo(todosVeiculos);
    } catch (erro) {
        listaVeiculos.innerHTML = `
            <tr>
                <td colspan="7" class="vazio erro-box">
                    <strong>Não foi possível conectar ao servidor.</strong><br>
                    Certifique-se de que o backend está rodando no terminal:<br>
                    <code>cd backend && npm start</code>
                </td>
            </tr>`;
        mostrarMensagem("Erro ao conectar à API. Verifique se o servidor está ativo na porta 3000.", "erro");
        console.error("Falha ao buscar veículos:", erro);
    }
}

/**
 * Atualiza o dropdown de fabricantes com base no que existe no estoque
 */
function atualizarSelectFabricantes(veiculos) {
    const fabricanteSelecionado = filtroFabricante.value;
    const fabricantesUnicos = [...new Set(veiculos.map(v => v.fabricante).filter(Boolean))].sort();

    filtroFabricante.innerHTML = '<option value="">Todos os fabricantes</option>';
    fabricantesUnicos.forEach(fab => {
        const option = document.createElement("option");
        option.value = fab;
        option.textContent = fab;
        if (fab === fabricanteSelecionado) option.selected = true;
        filtroFabricante.appendChild(option);
    });
}

/**
 * Renderiza os veículos na tabela
 */
function renderizarVeiculos(veiculos) {
    listaVeiculos.innerHTML = "";

    if (!veiculos || veiculos.length === 0) {
        listaVeiculos.innerHTML = `
            <tr>
                <td colspan="7" class="vazio">
                    Nenhum veículo encontrado para os filtros selecionados.<br>
                    <small>Cadastre um veículo no formulário acima ou limpe a busca.</small>
                </td>
            </tr>`;
        return;
    }

    veiculos.forEach(veiculo => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td><span class="id-tag">#${veiculo.id}</span></td>
            <td>
                <div class="veiculo-nome">${escapar(veiculo.modelo)}</div>
                <div class="veiculo-marca">${escapar(veiculo.fabricante)}</div>
            </td>
            <td><span class="ano-pill">${veiculo.ano}</span></td>
            <td>${numero(veiculo.quilometragem)} km</td>
            <td class="preco">${dinheiro(veiculo.preco)}</td>
            <td><span class="status-disponivel">● Em estoque</span></td>
            <td>
                <div class="botoes-tabela">
                    <button class="acao editar" data-acao="editar" data-id="${veiculo.id}" title="Editar informações">
                        ✏️ Editar
                    </button>
                    <button class="acao excluir" data-acao="excluir" data-id="${veiculo.id}" title="Excluir do catálogo">
                        🗑️ Excluir
                    </button>
                </div>
            </td>
        `;
        listaVeiculos.appendChild(linha);
    });
}

function escapar(valor) {
    return String(valor || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
}

/**
 * Atualiza os cards superiores com os cálculos consolidados
 */
function atualizarResumo(veiculos) {
    const total = veiculos.length;
    const somaKm = veiculos.reduce((acc, v) => acc + Number(v.quilometragem || 0), 0);
    const somaPreco = veiculos.reduce((acc, v) => acc + Number(v.preco || 0), 0);

    document.getElementById("totalVeiculos").textContent = numero(total);
    document.getElementById("mediaKm").textContent = `${numero(total ? Math.round(somaKm / total) : 0)} km`;
    document.getElementById("valorEstoque").textContent = dinheiro(somaPreco);
}

/**
 * Envio do formulário (POST / PUT)
 */
formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const veiculo = {
        modelo: campos.modelo.value.trim(),
        fabricante: campos.fabricante.value.trim(),
        ano: Number(campos.ano.value),
        quilometragem: Number(campos.quilometragem.value),
        preco: Number(campos.preco.value)
    };

    const isEdicao = idEdicao !== null;
    const metodo = isEdicao ? "PUT" : "POST";
    const url = isEdicao ? `${API_URL}/${idEdicao}` : API_URL;

    try {
        btnSalvar.disabled = true;
        btnSalvar.textContent = isEdicao ? "Atualizando..." : "Salvando...";

        const resposta = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(veiculo)
        });

        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível salvar o veículo.");
        }

        mostrarMensagem(dados.mensagem || "Operação realizada com sucesso!", "sucesso");
        limparFormulario();
        await buscarVeiculos();
    } catch (erro) {
        mostrarMensagem(erro.message || "Erro de comunicação com o servidor.", "erro");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = idEdicao !== null ? "Salvar alterações" : "＋ Cadastrar veículo";
    }
});

/**
 * Cliques de ação na tabela (Delegated Events)
 */
listaVeiculos.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "editar") editarVeiculo(id);
    if (acao === "excluir") excluirVeiculo(id);
});

function editarVeiculo(id) {
    const veiculo = todosVeiculos.find(v => Number(v.id) === id);
    if (!veiculo) {
        return mostrarMensagem("Veículo não localizado na lista atual.", "erro");
    }

    campos.modelo.value = veiculo.modelo;
    campos.fabricante.value = veiculo.fabricante;
    campos.ano.value = veiculo.ano;
    campos.quilometragem.value = veiculo.quilometragem;
    campos.preco.value = veiculo.preco;
    idEdicao = id;

    tituloFormulario.textContent = `Editar Veículo #${id}`;
    etiquetaForm.textContent = `EDITANDO #${id}`;
    etiquetaForm.className = "etiqueta editando";
    btnSalvar.textContent = "Salvar alterações";
    btnCancelar.classList.remove("escondido");

    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
    mostrarMensagem(`Editando ${veiculo.modelo} (#${id}). Altere os dados e clique em 'Salvar alterações'.`, "info");
}

async function excluirVeiculo(id) {
    const veiculo = todosVeiculos.find(v => Number(v.id) === id);
    const nome = veiculo ? `${veiculo.fabricante} ${veiculo.modelo}` : `veículo #${id}`;

    if (!confirm(`Tem certeza que deseja remover ${nome} do catálogo da concessionária?`)) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Falha ao excluir veículo.");
        }

        if (idEdicao === id) limparFormulario();
        mostrarMensagem(dados.mensagem || `Veículo #${id} excluído com sucesso!`, "sucesso");
        await buscarVeiculos();
    } catch (erro) {
        mostrarMensagem(erro.message || "Erro ao excluir veículo.", "erro");
    }
}

function limparFormulario() {
    formulario.reset();
    idEdicao = null;
    tituloFormulario.textContent = "Cadastrar novo veículo";
    etiquetaForm.textContent = "NOVO REGISTRO";
    etiquetaForm.className = "etiqueta";
    btnSalvar.textContent = "＋ Cadastrar veículo";
    btnCancelar.classList.add("escondido");
}

// Listeners de Filtro com Debounce
let timerBusca = null;
campoBusca.addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(buscarVeiculos, 300);
});

filtroFabricante.addEventListener("change", buscarVeiculos);
filtroOrdenacao.addEventListener("change", buscarVeiculos);

btnCancelar.addEventListener("click", () => {
    limparFormulario();
    mostrarMensagem("Edição cancelada.");
});

btnLimpar.addEventListener("click", () => {
    limparFormulario();
});

btnAtualizar.addEventListener("click", () => {
    buscarVeiculos();
    mostrarMensagem("Lista sincronizada com a API.", "info");
});

// Inicialização
buscarVeiculos();
