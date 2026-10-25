# 🎓 Guia Completo para Apresentação no Colégio
## Projeto AutoPrime — Sistema de Concessionária com Node.js e MySQL Workbench

Este guia foi feito especialmente para você levar para a escola e conseguir rodar **tudo com perfeição em qualquer computador**, mesmo sem internet ou sem ajuda de ninguém.

---

## 📌 Checklist: O que o computador da escola precisa ter

Antes de apresentar, certifique-se de que a máquina do colégio possui:
1. **Node.js** instalado (versão 18, 20 ou superior).
2. **MySQL Server + MySQL Workbench** (ou XAMPP com MySQL ativo).
3. **VS Code** instalado.
4. Extensão **Thunder Client** instalada no VS Code (basta buscar na aba de extensões).

---

## 📥 1. Como baixar e abrir o projeto na escola

1. Acesse o seu repositório no GitHub:
   👉 **`https://github.com/Otaviiiiozzz/repositorio-concessionaria`**
2. Clique no botão verde **Code** e depois em **Download ZIP**.
3. Extraia o arquivo ZIP na **Área de Trabalho** (Desktop).
4. Abra a pasta do projeto no VS Code (**File > Open Folder** > selecione a pasta `repositorio-concessionaria`).
5. Se for a primeira vez abrindo em um computador novo sem a pasta `node_modules`, abra o terminal do VS Code e digite:
   ```bash
   cd backend
   npm install
   ```

---

## 🗄️ 2. Como configurar a conexão com o MySQL na escola

O arquivo de configuração do banco fica em:
📁 **`backend/.env`**

Abra esse arquivo no VS Code. Ele tem este conteúdo:
```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin
DB_NAME=concessionaria
```

### ⚠️ O ponto mais importante: A Senha do MySQL do Colégio
Nos computadores da escola, o MySQL geralmente usa uma destas senhas padrão para o usuário `root`:
* Senha vazia: `DB_PASSWORD=`
* Senha root: `DB_PASSWORD=root`
* Senha admin: `DB_PASSWORD=admin`
* Senha numérica: `DB_PASSWORD=123456` ou `1234`
* Senha da instituição: `DB_PASSWORD=senac` (ou o nome da escola)

> 💡 **Super Vantagem do seu Projeto:**
> O seu backend tem um sistema inteligente de **auto-detecção de senhas**! Se a senha do `.env` não bater, ele testa automaticamente as senhas mais comuns da lista acima para tentar conectar sozinho sem você se desesperar.

### 🧪 Testando se o MySQL conectou (em 1 clique)
Na pasta do projeto, dê dois cliques no arquivo:
📁 **`verificar-mysql.bat`**

Ele dirá na hora:
* `🎉 SUCESSO: O MySQL está ATIVO e CONECTADO!` ➡️ Tudo certo para a apresentação!
* Se der aviso amarelo, significa que o serviço do MySQL precisa ser iniciado no Windows ou no XAMPP.

---

## 🚀 3. Roteiro Passo a Passo da Apresentação (Para tirar Nota Máxima!)

Siga exatamente esta ordem na frente do professor:

### 🔹 Passo 1: Abrir o MySQL Workbench
1. Abra o **MySQL Workbench** e entre na conexão local (`Local instance MySQL`).
2. Se o banco `concessionaria` ainda não aparecer na aba lateral esquerda (*Schemas*), não se preocupe: assim que o backend ligar, ele cria o banco e a tabela automaticamente!
3. Se o professor quiser ver o script SQL original, abra o arquivo [`sql/concessionaria.sql`](file:///C:/Users/otavi/Desktop/concessionaria/sql/concessionaria.sql) no Workbench e mostre o `CREATE TABLE` e os `INSERTs`.

---

### 🔹 Passo 2: Iniciar o Servidor Backend
Você pode iniciar de duas formas:
* **Forma 1:** Dê dois cliques em `iniciar-servidor.bat`.
* **Forma 2:** No terminal do VS Code, digite:
  ```bash
  cd backend
  node server.js
  ```

Olhe a mensagem que vai aparecer no terminal:
```text
=============================================================
🚗 AutoPrime Concessionária - Servidor Ativo!
📡 URL Base:        http://localhost:3000
💾 Banco Ativo:     MYSQL WORKBENCH (CONECTADO) ✅
   -> Tudo o que você alterar grava no MySQL Workbench!
   -> Comando Workbench: SELECT * FROM concessionaria.veiculos;
=============================================================
```
> Mostre essa mensagem para o professor para provar que a API está rodando e conectada ao MySQL!

---

### 🔹 Passo 3: Abrir o Thunder Client no VS Code
1. No VS Code, clique no ícone do raio ⚡ (**Thunder Client**).
2. Se ainda não tiver as requisições salvas, clique em **Collections > Import** e escolha:
   `thunder-client/thunder-collection_autoprime.json`.
3. Todas as 5 operações do CRUD vão aparecer na lista!

---

### 🔹 Passo 4: Fazer as 4 Demonstrações ao Vivo (CRUD)

Aqui está o momento que o professor mais quer ver: **as alterações feitas no Thunder Client aparecendo no MySQL Workbench!**

#### 1. Demonstração do `GET` (Listar Veículos):
* No Thunder Client, selecione `GET http://localhost:3000/veiculos` e clique em **Send**.
* Mostre a lista em JSON com os 8 veículos retornados da API.

#### 2. Demonstração do `POST` (Cadastrar Carro Novo):
* No Thunder Client, selecione `POST http://localhost:3000/veiculos`.
* Na aba **Body > JSON**, mostre os dados da nova picape:
  ```json
  {
    "modelo": "Hilux SRX Plus 4x4",
    "fabricante": "Toyota",
    "ano": 2024,
    "quilometragem": 15000,
    "preco": 334900.00
  }
  ```
* Clique em **Send** e mostre a resposta: `201 Created` com o novo ID gerado!
* **O PULO DO GATO 🐱:** Vá agora no **MySQL Workbench**, abra uma aba de query e rode:
  ```sql
  SELECT * FROM concessionaria.veiculos ORDER BY id DESC;
  ```
  Aperte o raiozinho ⚡. **A Hilux estará lá na primeira linha gravada no MySQL!**

#### 3. Demonstração do `PUT` (Atualizar Veículo):
* No Thunder Client, selecione `PUT http://localhost:3000/veiculos/1`.
* Na aba **Body > JSON**, altere o preço ou o nome do Corolla:
  ```json
  {
    "modelo": "Corolla Altis Premium Híbrido",
    "fabricante": "Toyota",
    "ano": 2024,
    "quilometragem": 8500,
    "preco": 182900.00
  }
  ```
* Clique em **Send** (Retorna `200 OK`).
* Volte no **MySQL Workbench**, aperte o raiozinho ⚡ e mostre o veículo #1 atualizado no banco de dados!

#### 4. Demonstração do `DELETE` (Excluir Veículo):
* No Thunder Client, selecione `DELETE http://localhost:3000/veiculos/8`.
* Clique em **Send** (Retorna `200 OK - Veículo excluído com sucesso`).
* Volte no **MySQL Workbench**, execute o `SELECT` e mostre que o veículo #8 sumiu da tabela!

---

### 🔹 Passo 5: Apresentar o Frontend Visual
1. Abra o arquivo [`frontend/index.html`](file:///C:/Users/otavi/Desktop/concessionaria/frontend/index.html) no navegador (duplo clique ou com o Live Server no VS Code).
2. Mostre para a turma:
   * O badge no topo: **"💾 Banco: MySQL Conectado"**.
   * Os cards calculando automaticamente o valor total do estoque, média de quilometragem e contagem de carros.
   * A barra de pesquisa buscando em tempo real por modelo ou marca.
   * Os botões de **Editar** e **Excluir** que também atualizam a API e o MySQL Workbench instantaneamente.

---

## 🧠 Perguntas prováveis do professor e como responder:

* **Pergunta: "Qual biblioteca você usou para conectar o Node com o MySQL?"**
  * **Resposta:** *"Utilizei a biblioteca `mysql2/promise`, que permite trabalhar com conexão assíncrona usando async/await e connection pool para alta performance."*

* **Pergunta: "Onde ficam as credenciais do banco de dados?"**
  * **Resposta:** *"Ficam isoladas no arquivo `.env` por boas práticas de segurança, utilizando a biblioteca `dotenv`. Esse arquivo está incluído no `.gitignore` para nunca expor senhas no GitHub."*

* **Pergunta: "Como você garantiu que ninguém cadastre dados errados?"**
  * **Resposta:** *"Criei uma função de validação no `veiculosController.js` que verifica se o modelo e a fabricante não estão vazios, se o ano é válido, se a quilometragem é positiva e se o preço é maior que zero, retornando status `400 Bad Request` caso algum dado seja inválido."*

* **Pergunta: "E se o serviço do MySQL cair no meio do uso?"**
  * **Resposta:** *"O sistema possui um adaptador com modo resiliente automático: se a conexão com o MySQL for interrompida, ele chaveia de forma transparente para armazenamento local em JSON, impedindo que o servidor caia."*

---

## 🛠️ Resolução Rápida de Perrengues no Colégio

| Problema | Causa | O que fazer |
|---|---|---|
| `ECONNREFUSED na porta 3306` | O serviço do MySQL está parado no Windows da escola | Abra o menu Iniciar, digite `Serviços` (Services), procure `MySQL` ou `MySQL80` e clique em **Iniciar**. Se a escola usar XAMPP, abra o painel do XAMPP e clique em **Start** no MySQL. |
| `Access denied for user 'root'` | A senha do MySQL da escola é diferente de `admin` | Abra o arquivo `backend/.env` e troque a linha `DB_PASSWORD=admin` pela senha da escola (ou deixe em branco se não tiver senha). |
| `Port 3000 already in use` | Um processo do Node ficou aberto em segundo plano | Feche o terminal ou rode no PowerShell: `Stop-Process -Name node -Force` e inicie novamente. |
| O terminal dá erro de script `.ps1` | Política de execução do PowerShell bloqueada no PC | Não use `npm start`, use direto: `node server.js` ou dê dois cliques em `iniciar-servidor.bat`. |

---

**Sucesso na sua apresentação! O projeto está impecável, robusto e vai impressionar o colégio!** 🚀🎓
