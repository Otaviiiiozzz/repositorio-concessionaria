const API_BASE = "http://localhost:3000";
const API_URL = `${API_BASE}/veiculos`;
const API_AUTH = `${API_BASE}/auth`;
const API_PROPOSTAS = `${API_BASE}/propostas`;

// =====================================================================
// ESTADO GLOBAL DO CLIENTE
// =====================================================================
let usuarioAtual = null;
let tokenAtual = localStorage.getItem("autoprime_jwt_token") || null;
let idEdicao = null;
let todosVeiculos = [];
let todasPropostas = [];
let listaCategoriasDisponiveis = [];

// =====================================================================
// ELEMENTOS DOM
// =====================================================================
const formulario = document.getElementById("formVeiculo");
const listaVeiculos = document.getElementById("listaVeiculos");
const listaPropostas = document.getElementById("listaPropostas");
const mensagem = document.getElementById("mensagem");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");
const btnLimpar = document.getElementById("btnLimpar");
const btnAtualizar = document.getElementById("btnAtualizar");
const etiquetaForm = document.getElementById("etiquetaForm");
const tituloFormulario = document.getElementById("tituloFormulario");
const subtituloFormulario = document.getElementById("subtituloFormulario");
const badgeModoBanco = document.getElementById("badgeModoBanco");
const badgeTotalPropostas = document.getElementById("badgeTotalPropostas");

// Elementos de Autenticação
const btnAbrirLogin = document.getElementById("btnAbrirLogin");
const usuarioLogadoCard = document.getElementById("usuarioLogadoCard");
const badgePerfil = document.getElementById("badgePerfil");
const nomeUsuarioLogado = document.getElementById("nomeUsuarioLogado");
const btnLogout = document.getElementById("btnLogout");

// Modais
const modalAuth = document.getElementById("modalAuth");
const btnFecharModalAuth = document.getElementById("btnFecharModalAuth");
const abaLogin = document.getElementById("abaLogin");
const abaCadastro = document.getElementById("abaCadastro");
const formLogin = document.getElementById("formLogin");
const formCadastro = document.getElementById("formCadastro");
const mensagemLogin = document.getElementById("mensagemLogin");
const mensagemCad = document.getElementById("mensagemCad");

const modalProposta = document.getElementById("modalProposta");
const btnFecharModalProposta = document.getElementById("btnFecharModalProposta");
const formProposta = document.getElementById("formProposta");
const modalPropostaVeiculoNome = document.getElementById("modalPropostaVeiculoNome");
const propostaVeiculoId = document.getElementById("propostaVeiculoId");
const propostaValor = document.getElementById("propostaValor");
const propostaPagamento = document.getElementById("propostaPagamento");
const propostaObs = document.getElementById("propostaObs");
const mensagemProposta = document.getElementById("mensagemProposta");

// Filtros
const campoBusca = document.getElementById("campoBusca");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroFabricante = document.getElementById("filtroFabricante");
const filtroOrdenacao = document.getElementById("filtroOrdenacao");

// Campos do Formulário de Veículo
const campos = {
    modelo: document.getElementById("modelo"),
    fabricante: document.getElementById("fabricante"),
    categoria: document.getElementById("categoria"),
    ano: document.getElementById("ano"),
    quilometragem: document.getElementById("quilometragem"),
    preco: document.getElementById("preco")
};

// Formatações
const dinheiro = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function obterHeaders(comAuth = true) {
    const headers = { "Content-Type": "application/json" };
    if (comAuth && tokenAtual) {
        headers["Authorization"] = `Bearer ${tokenAtual}`;
    }
    return headers;
}

// =====================================================================
// AUTENTICAÇÃO E SESSÃO
// =====================================================================

function atualizarUiAutenticacao() {
    if (usuarioAtual && tokenAtual) {
        btnAbrirLogin.classList.add("escondido");
        usuarioLogadoCard.classList.remove("escondido");

        nomeUsuarioLogado.textContent = usuarioAtual.nome.split(" ")[0];
        badgePerfil.textContent = usuarioAtual.perfil.toUpperCase();
        badgePerfil.className = `badge-perfil ${usuarioAtual.perfil}`;

        if (usuarioAtual.perfil === "cliente") {
            subtituloFormulario.textContent = "ℹ️ Seu perfil é 'Cliente'. Para cadastrar veículos no estoque, acesse como Vendedor ou Admin.";
        } else {
            subtituloFormulario.textContent = "Preencha os dados do automóvel para registrar ou atualizar no catálogo da concessionária.";
        }
    } else {
        btnAbrirLogin.classList.remove("escondido");
        usuarioLogadoCard.classList.add("escondido");
        subtituloFormulario.textContent = "Preencha os dados do automóvel para registrar ou atualizar no catálogo (Requer perfil Vendedor ou Admin).";
    }
}

async function sincronizarSessaoUsuario() {
    if (!tokenAtual) {
        usuarioAtual = null;
        atualizarUiAutenticacao();
        return;
    }

    try {
        const resposta = await fetch(`${API_AUTH}/me`, {
            headers: { "Authorization": `Bearer ${tokenAtual}` }
        });
        const dados = await resposta.json();

        if (resposta.ok && dados.usuario) {
            usuarioAtual = {
                id: dados.usuario.id,
                nome: dados.usuario.nome,
                email: dados.usuario.email,
                perfil: dados.usuario.perfil.nome
            };
            localStorage.setItem("autoprime_usuario", JSON.stringify(usuarioAtual));
        } else {
            fazerLogout();
        }
    } catch {
        const salvo = localStorage.getItem("autoprime_usuario");
        if (salvo) usuarioAtual = JSON.parse(salvo);
    }
    atualizarUiAutenticacao();
}

function salvarSessao(token, usuario) {
    tokenAtual = token;
    usuarioAtual = usuario;
    localStorage.setItem("autoprime_jwt_token", token);
    localStorage.setItem("autoprime_usuario", JSON.stringify(usuario));
    atualizarUiAutenticacao();
    buscarVeiculos();
    buscarPropostas();
}

function fazerLogout() {
    tokenAtual = null;
    usuarioAtual = null;
    localStorage.removeItem("autoprime_jwt_token");
    localStorage.removeItem("autoprime_usuario");
    atualizarUiAutenticacao();
    buscarPropostas();
    mostrarMensagem("Você encerrou sua sessão no sistema.", "info");
}

// =====================================================================
// CARREGAR CATEGORIAS DO MYSQL
// =====================================================================

async function carregarCategorias() {
    try {
        const resposta = await fetch(`${API_BASE}/categorias`);
        if (!resposta.ok) return;
        const categorias = await resposta.json();
        listaCategoriasDisponiveis = categorias;

        if (campos.categoria) {
            campos.categoria.innerHTML = '<option value="">Selecione uma categoria...</option>' +
                categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
        }

        if (filtroCategoria) {
            filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>' +
                categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");
        }
    } catch (e) {
        console.warn("Erro ao buscar categorias:", e.message);
    }
}

// =====================================================================
// CONSULTAS À API (STATUS, RESUMO, VEÍCULOS)
// =====================================================================

async function verificarStatusApi() {
    try {
        const resposta = await fetch(`${API_BASE}/`);
        const dados = await resposta.json();
        if (dados && dados.modoBanco) {
            if (dados.modoBanco === "mysql") {
                badgeModoBanco.textContent = "💾 Banco: MySQL Workbench";
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

async function atualizarMetricas() {
    try {
        const resposta = await fetch(`${API_URL}/resumo`);
        if (!resposta.ok) return;
        const dados = await resposta.json();

        document.getElementById("totalVeiculos").textContent = dados.totalVeiculos;
        document.getElementById("valorEstoque").textContent = dinheiro(dados.valorTotalEstoque);
        document.getElementById("mediaKm").textContent = `${numero(dados.quilometragemMedia)} km`;
    } catch (e) {
        console.warn("Falha ao calcular métricas:", e.message);
    }
}

async function buscarVeiculos() {
    listaVeiculos.innerHTML = '<tr><td colspan="7" class="vazio">Carregando catálogo de veículos...</td></tr>';
    verificarStatusApi();

    try {
        const params = new URLSearchParams();
        if (campoBusca.value.trim()) params.append("busca", campoBusca.value.trim());
        if (filtroFabricante.value) params.append("fabricante", filtroFabricante.value);
        if (filtroCategoria && filtroCategoria.value) params.append("categoria_id", filtroCategoria.value);
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
        popularFabricantes(dados);
        renderizarTabela(dados);
        atualizarMetricas();
    } catch (erro) {
        listaVeiculos.innerHTML = `
            <tr>
                <td colspan="7" class="vazio erro-box">
                    <strong>Erro de conexão com o backend:</strong><br>
                    ${erro.message}<br>
                    <code>Certifique-se de que o servidor está rodando em http://localhost:3000</code>
                </td>
            </tr>`;
    }
}

function popularFabricantes(veiculos) {
    const valorAtual = filtroFabricante.value;
    const fabricantesUnicos = [...new Set(veiculos.map(v => v.fabricante).filter(Boolean))].sort();

    filtroFabricante.innerHTML = '<option value="">Todos os fabricantes</option>';
    fabricantesUnicos.forEach(fab => {
        const opt = document.createElement("option");
        opt.value = fab;
        opt.textContent = fab;
        if (fab === valorAtual) opt.selected = true;
        filtroFabricante.appendChild(opt);
    });
}

function renderizarTabela(veiculos) {
    if (!Array.isArray(veiculos) || veiculos.length === 0) {
        listaVeiculos.innerHTML = '<tr><td colspan="7" class="vazio">Nenhum veículo encontrado com os filtros selecionados.</td></tr>';
        return;
    }

    listaVeiculos.innerHTML = veiculos.map(v => {
        const status = v.status || "disponivel";
        const catBadge = v.categoria_nome ? `<span class="etiqueta-cat">${v.categoria_nome}</span>` : "";

        // Botões conforme perfil
        let botoesAcao = "";

        if (usuarioAtual && (usuarioAtual.perfil === "admin" || usuarioAtual.perfil === "vendedor")) {
            botoesAcao += `<button type="button" class="acao editar" data-id="${v.id}" data-acao="editar" title="Editar dados">✏️ Editar</button>`;
        }

        if (usuarioAtual && usuarioAtual.perfil === "admin") {
            botoesAcao += `<button type="button" class="acao excluir" data-id="${v.id}" data-acao="excluir" title="Excluir veículo (Admin)">🗑️ Excluir</button>`;
        }

        // Qualquer usuário (inclusive cliente e visitante) pode fazer proposta
        botoesAcao += `<button type="button" class="acao proposta" data-id="${v.id}" data-modelo="${v.modelo}" data-preco="${v.preco}" data-acao="proposta" title="Enviar proposta de compra">💬 Proposta</button>`;

        return `
            <tr>
                <td><strong>#${v.id}</strong></td>
                <td>
                    <strong>${v.modelo}</strong>${catBadge}<br>
                    <small style="color: var(--text-muted);">${v.fabricante}</small>
                </td>
                <td>${v.ano}</td>
                <td>${numero(v.quilometragem)} km</td>
                <td><strong style="color: #60a5fa;">${dinheiro(v.preco)}</strong></td>
                <td><span class="badge-status ${status}">${status}</span></td>
                <td><div class="acoes-tabela">${botoesAcao}</div></td>
            </tr>
        `;
    }).join("");
}

// =====================================================================
// PROPOSTAS E NEGOCIAÇÕES (TABELAS RELACIONADAS)
// =====================================================================

async function buscarPropostas() {
    if (!tokenAtual) {
        listaPropostas.innerHTML = '<tr><td colspan="8" class="vazio">Faça login para acompanhar suas propostas ou gerenciar o fluxo comercial.</td></tr>';
        badgeTotalPropostas.textContent = "0 PROPOSTAS";
        return;
    }

    try {
        const endpoint = (usuarioAtual && (usuarioAtual.perfil === "admin" || usuarioAtual.perfil === "vendedor"))
            ? API_PROPOSTAS
            : `${API_PROPOSTAS}/minhas`;

        const res = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${tokenAtual}` }
        });
        const dados = await res.json();

        if (!res.ok) {
            listaPropostas.innerHTML = `<tr><td colspan="8" class="vazio">${dados.mensagem || "Erro ao consultar propostas."}</td></tr>`;
            return;
        }

        todasPropostas = dados.propostas || [];
        badgeTotalPropostas.textContent = `${todasPropostas.length} PROPOSTAS`;

        if (todasPropostas.length === 0) {
            listaPropostas.innerHTML = '<tr><td colspan="8" class="vazio">Nenhuma proposta de negociação registrada no momento.</td></tr>';
            return;
        }

        listaPropostas.innerHTML = todasPropostas.map(p => {
            const status = p.status || "pendente";
            const dataFmt = p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "-";

            let acoes = "-";
            if (usuarioAtual && (usuarioAtual.perfil === "admin" || usuarioAtual.perfil === "vendedor") && status === "pendente") {
                acoes = `
                    <button type="button" class="acao editar" data-id="${p.id}" data-acao="aprovar-proposta" title="Aprovar Proposta">✅ Aprovar</button>
                    <button type="button" class="acao excluir" data-id="${p.id}" data-acao="recusar-proposta" title="Recusar Proposta">❌ Recusar</button>
                `;
            }

            return `
                <tr>
                    <td><strong>#${p.id}</strong></td>
                    <td>${p.veiculo_modelo || `Veículo #${p.veiculo_id}`}</td>
                    <td>${p.cliente_nome || "Cliente"}</td>
                    <td><strong style="color: #34d399;">${dinheiro(p.valor_proposta)}</strong></td>
                    <td>${(p.forma_pagamento || "a_vista").replace("_", " ").toUpperCase()}</td>
                    <td><span class="badge-status ${status}">${status}</span></td>
                    <td><small style="color: var(--text-muted);">${dataFmt}</small></td>
                    <td><div class="acoes-tabela">${acoes}</div></td>
                </tr>
            `;
        }).join("");

    } catch (e) {
        listaPropostas.innerHTML = `<tr><td colspan="8" class="vazio">Erro ao carregar propostas: ${e.message}</td></tr>`;
    }
}

// =====================================================================
// FORMULÁRIO DE VEÍCULOS (CRUD COMPLETO NO MYSQL)
// =====================================================================

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    if (!tokenAtual) {
        mostrarMensagem("Atenção: É necessário estar autenticado como Vendedor ou Administrador para cadastrar veículos.", "erro");
        abrirModalAuth("login");
        return;
    }

    if (usuarioAtual && usuarioAtual.perfil === "cliente") {
        mostrarMensagem("Permissão insuficiente: Usuários do perfil 'Cliente' não podem cadastrar veículos no estoque.", "erro");
        return;
    }

    const veiculo = {
        modelo: campos.modelo.value.trim(),
        fabricante: campos.fabricante.value.trim(),
        categoria_id: campos.categoria && campos.categoria.value ? Number(campos.categoria.value) : null,
        ano: Number(campos.ano.value),
        quilometragem: Number(campos.quilometragem.value),
        preco: Number(campos.preco.value)
    };

    const isEdicao = idEdicao !== null;
    const metodo = isEdicao ? "PUT" : "POST";
    const url = isEdicao ? `${API_URL}/${idEdicao}` : API_URL;

    try {
        btnSalvar.disabled = true;
        btnSalvar.textContent = isEdicao ? "Atualizando no MySQL..." : "Salvando no MySQL...";

        const resposta = await fetch(url, {
            method: metodo,
            headers: obterHeaders(true),
            body: JSON.stringify(veiculo)
        });

        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível salvar o veículo.");
        }

        mostrarMensagem(dados.mensagem || "Operação realizada com sucesso no MySQL Workbench!", "sucesso");
        limparFormulario();
        await buscarVeiculos();
    } catch (erro) {
        mostrarMensagem(erro.message || "Erro de comunicação com o servidor.", "erro");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = idEdicao !== null ? "Salvar alterações" : "＋ Cadastrar veículo";
    }
});

// Ações na tabela de veículos
listaVeiculos.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "editar") editarVeiculo(id);
    if (acao === "excluir") excluirVeiculo(id);
    if (acao === "proposta") {
        const modelo = botao.dataset.modelo || "";
        const preco = botao.dataset.preco || "";
        abrirModalProposta(id, modelo, preco);
    }
});

function editarVeiculo(id) {
    if (!tokenAtual) {
        mostrarMensagem("Faça login com perfil de Vendedor ou Administrador para editar.", "erro");
        abrirModalAuth("login");
        return;
    }

    const veiculo = todosVeiculos.find(v => Number(v.id) === id);
    if (!veiculo) return mostrarMensagem("Veículo não localizado na lista atual.", "erro");

    campos.modelo.value = veiculo.modelo;
    campos.fabricante.value = veiculo.fabricante;
    if (campos.categoria && veiculo.categoria_id) {
        campos.categoria.value = veiculo.categoria_id;
    }
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
    mostrarMensagem(`Editando ${veiculo.modelo} (#${id}). Altere os dados e salve.`, "info");
}

async function excluirVeiculo(id) {
    if (!tokenAtual) {
        mostrarMensagem("Apenas o perfil Administrador pode excluir veículos. Faça login.", "erro");
        abrirModalAuth("login");
        return;
    }

    if (usuarioAtual && usuarioAtual.perfil !== "admin") {
        return mostrarMensagem("Ação bloqueada: A exclusão de veículos é uma permissão exclusiva do Administrador.", "erro");
    }

    const veiculo = todosVeiculos.find(v => Number(v.id) === id);
    const nome = veiculo ? `${veiculo.fabricante} ${veiculo.modelo}` : `veículo #${id}`;

    if (!confirm(`Confirmar exclusão de ${nome} diretamente do MySQL?`)) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: obterHeaders(true)
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Falha ao excluir veículo.");
        }

        if (idEdicao === id) limparFormulario();
        mostrarMensagem(dados.mensagem || `Veículo #${id} excluído com sucesso do MySQL!`, "sucesso");
        await buscarVeiculos();
    } catch (erro) {
        mostrarMensagem(erro.message || "Erro ao excluir veículo.", "erro");
    }
}

function limparFormulario() {
    formulario.reset();
    idEdicao = null;
    if (campos.categoria) campos.categoria.value = "";
    tituloFormulario.textContent = "Cadastrar novo veículo";
    etiquetaForm.textContent = "NOVO REGISTRO";
    etiquetaForm.className = "etiqueta";
    btnSalvar.textContent = "＋ Cadastrar veículo";
    btnCancelar.classList.add("escondido");
}

// Ações na tabela de propostas (Aprovar / Recusar)
listaPropostas.addEventListener("click", async evento => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    const novoStatus = acao === "aprovar-proposta" ? "aprovada" : "recusada";

    try {
        const res = await fetch(`${API_PROPOSTAS}/${id}/status`, {
            method: "PATCH",
            headers: obterHeaders(true),
            body: JSON.stringify({ status: novoStatus })
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.mensagem || "Erro ao atualizar proposta.");

        mostrarMensagem(dados.mensagem || "Status atualizado!", "sucesso");
        await buscarPropostas();
    } catch (e) {
        mostrarMensagem(e.message, "erro");
    }
});

// =====================================================================
// MODAIS (LOGIN, CADASTRO, PROPOSTA)
// =====================================================================

function abrirModalAuth(aba = "login") {
    modalAuth.classList.remove("escondido");
    mensagemLogin.style.display = "none";
    mensagemCad.style.display = "none";

    if (aba === "login") {
        abaLogin.classList.add("ativa");
        abaCadastro.classList.remove("ativa");
        formLogin.classList.remove("escondido");
        formCadastro.classList.add("escondido");
        document.getElementById("loginEmail").focus();
    } else {
        abaCadastro.classList.add("ativa");
        abaLogin.classList.remove("ativa");
        formCadastro.classList.remove("escondido");
        formLogin.classList.add("escondido");
        document.getElementById("cadNome").focus();
    }
}

btnAbrirLogin.addEventListener("click", () => abrirModalAuth("login"));
btnFecharModalAuth.addEventListener("click", () => modalAuth.classList.add("escondido"));
btnLogout.addEventListener("click", fazerLogout);

abaLogin.addEventListener("click", () => abrirModalAuth("login"));
abaCadastro.addEventListener("click", () => abrirModalAuth("cadastro"));

// Atalhos rápidos para apresentação escolar
document.querySelectorAll(".btn-demo").forEach(btn => {
    btn.addEventListener("click", () => {
        const papel = btn.dataset.demo;
        if (papel === "admin") {
            document.getElementById("loginEmail").value = "admin@autoprime.com";
            document.getElementById("loginSenha").value = "admin123";
        } else if (papel === "vendedor") {
            document.getElementById("loginEmail").value = "vendedor@autoprime.com";
            document.getElementById("loginSenha").value = "vendedor123";
        } else if (papel === "cliente") {
            document.getElementById("loginEmail").value = "cliente@autoprime.com";
            document.getElementById("loginSenha").value = "cliente123";
        }
        formLogin.dispatchEvent(new Event("submit"));
    });
});

// Submit Login
formLogin.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;
    const btnSubmit = document.getElementById("btnSubmitLogin");

    mensagemLogin.style.display = "none";
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Autenticando...";

    try {
        const res = await fetch(`${API_AUTH}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const dados = await res.json();

        if (!res.ok) {
            throw new Error(dados.mensagem || "Credenciais inválidas.");
        }

        salvarSessao(dados.token, dados.usuario);
        modalAuth.classList.add("escondido");
        mostrarMensagem(`Bem-vindo(a), ${dados.usuario.nome}! Perfil ativo: ${dados.usuario.perfil.toUpperCase()}.`, "sucesso");
    } catch (err) {
        mensagemLogin.textContent = err.message;
        mensagemLogin.className = "mensagem-modal erro";
        mensagemLogin.style.display = "block";
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Entrar no Sistema";
    }
});

// Submit Cadastro
formCadastro.addEventListener("submit", async e => {
    e.preventDefault();
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const telefone = document.getElementById("cadTelefone").value.trim();
    const senha = document.getElementById("cadSenha").value;
    const btnSubmit = document.getElementById("btnSubmitCad");

    mensagemCad.style.display = "none";
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Criando conta...";

    try {
        const res = await fetch(`${API_AUTH}/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, telefone, senha })
        });
        const dados = await res.json();

        if (!res.ok) {
            throw new Error(dados.mensagem || "Erro ao registrar usuário.");
        }

        salvarSessao(dados.token, dados.usuario);
        modalAuth.classList.add("escondido");
        mostrarMensagem(`Conta criada com sucesso! Você está autenticado como ${dados.usuario.perfil}.`, "sucesso");
    } catch (err) {
        mensagemCad.textContent = err.message;
        mensagemCad.className = "mensagem-modal erro";
        mensagemCad.style.display = "block";
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Criar Minha Conta";
    }
});

// Modal de Proposta
function abrirModalProposta(veiculoId, modelo, preco) {
    if (!tokenAtual) {
        mostrarMensagem("Para fazer uma proposta, faça login ou crie sua conta gratuitamente.", "info");
        abrirModalAuth("login");
        return;
    }

    modalPropostaVeiculoNome.textContent = `${modelo} • Preço de tabela: ${dinheiro(preco)}`;
    propostaVeiculoId.value = veiculoId;
    propostaValor.value = preco ? Number(preco) * 0.95 : "";
    mensagemProposta.style.display = "none";
    modalProposta.classList.remove("escondido");
    propostaValor.focus();
}

btnFecharModalProposta.addEventListener("click", () => modalProposta.classList.add("escondido"));

formProposta.addEventListener("submit", async e => {
    e.preventDefault();
    const veiculo_id = Number(propostaVeiculoId.value);
    const valor_proposta = Number(propostaValor.value);
    const forma_pagamento = propostaPagamento.value;
    const observacoes = propostaObs.value.trim();
    const btnSubmit = document.getElementById("btnSubmitProposta");

    mensagemProposta.style.display = "none";
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Enviando ao MySQL...";

    try {
        const res = await fetch(API_PROPOSTAS, {
            method: "POST",
            headers: obterHeaders(true),
            body: JSON.stringify({ veiculo_id, valor_proposta, forma_pagamento, observacoes })
        });
        const dados = await res.json();

        if (!res.ok) {
            throw new Error(dados.mensagem || "Não foi possível enviar a proposta.");
        }

        modalProposta.classList.add("escondido");
        formProposta.reset();
        mostrarMensagem(dados.mensagem || "Proposta enviada com sucesso no MySQL!", "sucesso");
        await buscarPropostas();
    } catch (err) {
        mensagemProposta.textContent = err.message;
        mensagemProposta.className = "mensagem-modal erro";
        mensagemProposta.style.display = "block";
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Enviar Proposta";
    }
});

// Fechar modais ao clicar no fundo escuro
window.addEventListener("click", e => {
    if (e.target === modalAuth) modalAuth.classList.add("escondido");
    if (e.target === modalProposta) modalProposta.classList.add("escondido");
});

// Listeners de Filtro com Debounce
let timerBusca = null;
campoBusca.addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(buscarVeiculos, 300);
});

filtroFabricante.addEventListener("change", buscarVeiculos);
if (filtroCategoria) filtroCategoria.addEventListener("change", buscarVeiculos);
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
    buscarPropostas();
    mostrarMensagem("Dados sincronizados com o MySQL Workbench.", "info");
});

// Inicialização da Página
sincronizarSessaoUsuario();
carregarCategorias();
buscarVeiculos();
buscarPropostas();
