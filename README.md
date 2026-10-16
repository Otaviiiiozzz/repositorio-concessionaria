# 🚗 AutoPrime Motors - Sistema de Gestão de Concessionária

Sistema completo e profissional para gerenciamento de estoque de uma concessionária de veículos, composto por:
- **API RESTful** construída em **Node.js + Express**
- **Banco de Dados Híbrido/Resiliente**: Suporta **MySQL** nativo e possui **Fallback Local Automático (JSON)** para funcionar imediatamente no VSCode mesmo sem MySQL ativo.
- **Frontend Moderno**: Interface responsiva e elegante em tema dark automotivo, com busca em tempo real, filtros por marca, ordenação e cálculo automático de métricas do estoque.
- **Integração Total com VSCode**: Depuração nativa com tecla `F5`, tarefas pré-configuradas e recomendações de extensões.
- **Suíte Pronta para o Thunder Client**: Coleção completa com requisições para `GET`, `GET por ID`, `POST`, `PUT`, `DELETE`, filtros e testes de erro.

---

## 📁 Estrutura do Projeto

```
concessionaria/
├── .vscode/                                # Configurações para VSCode
│   ├── launch.json                         # Execução e Debug com F5
│   ├── tasks.json                          # Tarefas rápidas (start, test)
│   ├── extensions.json                     # Extensões recomendadas (Thunder Client, Live Server)
│   └── settings.json                       # Configurações do editor
├── backend/                                # API RESTful
│   ├── controllers/
│   │   └── veiculosController.js           # Lógica das regras de negócio e validações
│   ├── database/
│   │   ├── conexao.js                      # Conexão resiliente (MySQL + Local Fallback)
│   │   └── dados_locais.json               # Persistência em modo local
│   ├── middlewares/
│   │   └── corsMiddleware.js               # Configuração de CORS e headers permitidos
│   ├── routes/
│   │   └── veiculosRoutes.js               # Mapeamento de rotas (/veiculos)
│   ├── .env                                # Configurações de ambiente
│   ├── .env.example                        # Modelo de variáveis
│   ├── package.json                        # Scripts e dependências
│   └── server.js                           # Ponto de entrada do servidor
├── frontend/                               # Interface do Usuário
│   ├── index.html                          # Estrutura do painel de controle
│   ├── script.js                           # Consumo da API, filtros e DOM
│   └── style.css                           # Design System Dark Premium
├── sql/
│   └── concessionaria.sql                  # Script DDL e DML para MySQL
├── tests/
│   └── test-api.js                         # Suíte de 15 testes automatizados E2E
├── thunder-client/                         # Coleção e ambiente para importação
│   ├── thunder-collection_autoprime.json
│   └── thunder-environment_autoprime.json
├── thunder-tests/                          # Pasta nativa para sincronização no VSCode
│   ├── thunder-collection_autoprime.json
│   └── thunder-environment_autoprime.json
└── README.md                               # Documentação completa
```

---

## 🚀 Como Abrir e Rodar no VSCode

### 1. Abrir no VSCode
Abra o VSCode e abra a pasta:
```
C:\Users\otavi\.gemini\antigravity\scratch\concessionaria
```

### 2. Iniciar o Backend
Você tem **3 formas simples** de iniciar o servidor:

* **Opção A (Mais fácil - Tecla F5):**
  Pressione a tecla `F5` no teclado ou vá no menu lateral **Executar e Depurar (Run & Debug)** e selecione `🚗 Iniciar Backend (AutoPrime API)`. O servidor iniciará com recarregamento automático (`--watch`).

* **Opção B (Pelo Terminal Integrado do VSCode):**
  Abra um terminal (`Ctrl + '`) e execute:
  ```bash
  cd backend
  npm start
  # ou para modo de desenvolvimento com auto-reload:
  npm run dev
  ```

* **Opção C (Pelo menu de Tarefas do VSCode):**
  Pressione `Ctrl + Shift + P` -> `Tasks: Run Task` -> Escolha `🚗 Iniciar Backend (npm start)`.

> 💡 **Nota sobre o Banco de Dados:**
> Se o seu MySQL estiver rodando com o script `sql/concessionaria.sql` importado, a API se conectará automaticamente a ele.
> Caso você **não tenha o MySQL instalado ou ativo no momento**, a API entra automaticamente em **Modo Local Resiliente**, permitindo que você teste **100% de todas as funcionalidades e o Thunder Client** imediatamente sem nenhum erro de conexão!

---

## ⚡ Como Usar com o Thunder Client no VSCode

A extensão **Thunder Client** permite testar e manipular todas as rotas da API diretamente dentro do VSCode.

### Passo 1: Instalar a Extensão
Se ainda não a tiver, instale a extensão `Thunder Client` da loja do VSCode (ou aceite a recomendação exibida ao abrir a pasta).

### Passo 2: Importar a Coleção
1. Clique no ícone do **Thunder Client** (o raio ⚡ no menu lateral esquerdo do VSCode).
2. Vá na aba **Collections** (Coleções).
3. Clique no botão de menu (três pontos `...` ou ícone de hambúrguer) e selecione **Import**.
4. Selecione o arquivo:
   ```
   thunder-client/thunder-collection_autoprime.json
   ```
5. *(Opcional)* Na aba **Env**, você também pode importar o ambiente:
   ```
   thunder-client/thunder-environment_autoprime.json
   ```

---

## 📋 Endpoints Disponíveis no Thunder Client

A coleção já vem pronta com 9 requisições organizadas e com os corpos (JSON) pré-preenchidos:

### 1. `GET /veiculos` — Listar todos os veículos
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos`
- **Descrição:** Retorna todo o estoque cadastrado em ordem decrescente de ID.

### 2. `GET /veiculos/:id` — Buscar veículo por ID
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/1`
- **Descrição:** Retorna os detalhes do veículo especificado. Caso não exista, retorna status `404`.

### 3. `GET /veiculos` (Filtros por Query Params)
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos?fabricante=Toyota&busca=Corolla`
- **Parâmetros suportados:**
  - `busca`: Busca textual por modelo ou fabricante
  - `fabricante`: Filtra por marca exata (ex: `Toyota`, `Honda`)
  - `preco_max`: Filtra veículos até o valor informado
  - `ordenar`: Opções: `preco_asc`, `preco_desc`, `ano_desc`, `km_asc`

### 4. `GET /veiculos/resumo` — Dashboard e Estatísticas
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/resumo`
- **Descrição:** Retorna métricas consolidadas: quantidade de veículos, valor total do estoque, média de quilometragem e contagem por fabricante.

### 5. `POST /veiculos` — Cadastrar novo veículo
- **Método:** `POST`
- **URL:** `http://localhost:3000/veiculos`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
      "modelo": "Hilux SRX Plus 4x4",
      "fabricante": "Toyota",
      "ano": 2024,
      "quilometragem": 15000,
      "preco": 334900.00
  }
  ```
- **Resposta esperada:** Status `201 Created` com o ID gerado e os dados do veículo.

### 6. `PUT /veiculos/:id` — Atualizar veículo existente
- **Método:** `PUT`
- **URL:** `http://localhost:3000/veiculos/1`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
      "modelo": "Corolla Altis Premium Híbrido",
      "fabricante": "Toyota",
      "ano": 2024,
      "quilometragem": 8500,
      "preco": 182900.00
  }
  ```
- **Resposta esperada:** Status `200 OK` com a confirmação e o objeto atualizado.

### 7. `DELETE /veiculos/:id` — Excluir veículo por ID
- **Método:** `DELETE`
- **URL:** `http://localhost:3000/veiculos/8`
- **Descrição:** Remove o veículo informado do estoque.
- **Resposta esperada:** Status `200 OK` com a mensagem de sucesso.

### 8. `GET /veiculos/9999` — Teste de 404 (Não Encontrado)
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/9999`
- **Resposta esperada:** Status `404 Not Found`.

### 9. `POST /veiculos` — Teste de 400 (Validação de Dados)
- **Método:** `POST`
- **Body inválido (campos vazios ou valores negativos):**
  ```json
  {
      "modelo": "",
      "fabricante": "",
      "ano": 1800,
      "quilometragem": -50,
      "preco": 0
  }
  ```
- **Resposta esperada:** Status `400 Bad Request` com a mensagem explicativa do erro.

---

## 🌐 Como Usar o Frontend

1. No VSCode, clique com o botão direito no arquivo [`frontend/index.html`](file:///C:/Users/otavi/.gemini/antigravity/scratch/concessionaria/frontend/index.html).
2. Selecione **Open with Live Server** (ou abra o arquivo diretamente no seu navegador de preferência, como Chrome ou Edge).
3. A interface carregará os veículos da API, exibindo:
   - Indicador de status da conexão no topo (MySQL ou Modo Local)
   - Contadores em tempo real (Total de Veículos, Km Médio, Valor Total)
   - Barra de busca instantânea e filtros por marca e ordenação
   - Botões de **Editar** (preenche o formulário para alteração via PUT) e **Excluir** (confirmação e remoção via DELETE).

---

## 🧪 Suíte de Testes Automatizados

O projeto inclui um script que testa todas as 15 regras de negócio e rotas da API:

```bash
cd backend
npm test
# ou a partir da raiz:
node tests/test-api.js
```

Resultado:
```
=======================================================
🚗 Iniciando Suíte de Testes da API AutoPrime
🎯 Alvo: http://localhost:3000
=======================================================
  ✔ [PASSOU] GET / responde com status 200
  ✔ [PASSOU] GET / retorna objeto com rotas
  ✔ [PASSOU] GET /veiculos responde com status 200
  ✔ [PASSOU] GET /veiculos retorna array de veículos
  ✔ [PASSOU] GET /veiculos/resumo responde com 200
  ✔ [PASSOU] GET /veiculos/resumo contém totalVeiculos e valorTotalEstoque
  ✔ [PASSOU] GET /veiculos/:id responde com status 200
  ✔ [PASSOU] Veículo retornado possui modelo e fabricante
  ✔ [PASSOU] POST /veiculos responde com status 201 (Created)
  ✔ [PASSOU] POST /veiculos retorna ID do novo registro
  ✔ [PASSOU] PUT /veiculos/:id responde com status 200
  ✔ [PASSOU] PUT atualizou o modelo com sucesso
  ✔ [PASSOU] DELETE /veiculos/:id responde com status 200
  ✔ [PASSOU] GET /veiculos/:id após DELETE responde com 404 (Not Found)
  ✔ [PASSOU] POST /veiculos com dados inválidos responde com 400 (Bad Request)
=======================================================
🎉 TODOS OS TESTES PASSARAM COM SUCESSO!
```
