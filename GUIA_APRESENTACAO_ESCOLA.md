# 🎓 Guia Completo para Apresentação no Colégio (Senac RS)
## Projeto AutoPrime Motors — Concessionária: Sistema Completo em Funcionamento
### Entrega Final: CRUD Completo, Autenticação JWT, Controle de Permissões (RBAC) e Banco MySQL Workbench

Este guia foi elaborado para você realizar a **Apresentação Final** com total segurança, garantindo a nota máxima em todos os indicadores da avaliação.

---

## 📌 Checklist de Pré-Requisitos na Máquina da Apresentação

1. **Node.js** instalado (versão 18, 20 ou superior).
2. **MySQL Server + MySQL Workbench** (ou MariaDB / XAMPP com MySQL ativo na porta 3306).
3. **VS Code** com a extensão **Thunder Client** instalada.
4. Navegador de internet (Chrome, Edge ou Firefox).

---

## 🗄️ 1. O que Mostrar sobre o Banco de Dados Relacional

1. Abra o arquivo **`sql/concessionaria.sql`** no VS Code ou no **MySQL Workbench**.
2. Destaque ao professor a modelagem relacional com as **5 tabelas**:
   - `perfis` (1:N com `usuarios`)
   - `usuarios` (N:1 com `perfis`)
   - `categorias` (1:N com `veiculos`)
   - `veiculos` (N:1 com `categorias`, N:1 com `usuarios` que cadastrou)
   - `propostas` (N:1 com `veiculos`, N:1 com `usuarios`/cliente, N:1 com `usuarios`/vendedor)
3. Mostre as **Chaves Primárias (`PRIMARY KEY`)** e **Chaves Estrangeiras (`FOREIGN KEY`)** com integridade referencial (`ON DELETE RESTRICT / CASCADE / SET NULL`).
4. Execute no MySQL Workbench para demonstrar os dados em tempo real:
   ```sql
   USE concessionaria;
   SHOW TABLES;
   SELECT * FROM perfis;
   SELECT id, nome, email, perfil_id, ativo FROM usuarios;
   SELECT id, modelo, fabricante, preco, status FROM veiculos;
   SELECT * FROM propostas;
   ```

---

## 🔐 2. O que Mostrar sobre Autenticação, Senhas e Segurança

1. Mostre no código **`backend/controllers/authController.js`**:
   - O uso de **`bcryptjs`** com fator de custo `saltRounds = 10`.
   - Explique que as senhas **nunca** são salvas em texto puro no banco de dados.
   - Mostre no Workbench ou em `usuarios` a coluna `senha` preenchida com o hash `$2b$10$...`.
2. Mostre as validações no back-end:
   - Validação de e-mail duplicado (retorna status HTTP `409 Conflict`).
   - Validação de senha curta com menos de 6 caracteres (`400 Bad Request`).
   - Bloqueio seguro caso a senha informada seja incorreta (`401 Unauthorized`).

---

## 🛡️ 3. O que Mostrar sobre Controle de Permissões (RBAC)

1. Mostre no código **`backend/middlewares/authMiddleware.js`**:
   - `autenticarToken`: extrai `Authorization: Bearer <token>`, valida assinatura e decodifica os dados.
   - `autorizarPerfis`: middleware RBAC que compara o perfil do usuário logado (`admin`, `vendedor`, `cliente`) com a lista de perfis permitidos.
2. Demonstre as regras de negócio em ação:
   - **Cliente:** pode ver catálogo e enviar propostas de compra, mas é **bloqueado pela API (403 Forbidden)** se tentar cadastrar ou excluir veículos.
   - **Vendedor:** pode cadastrar e editar veículos e aprovar propostas, mas é **bloqueado pela API (403 Forbidden)** se tentar excluir veículos.
   - **Administrador:** possui permissão total, incluindo a **exclusão de veículos (`DELETE /veiculos/:id`)** e a gestão de contas de usuários (`GET /usuarios`).

---

## ⚡ 4. Roteiro Prático de Demonstração (Ao Vivo na Sala de Aula)

### Passo 1: Ligar o Banco e o Servidor
1. Dê duplo-clique em **`iniciar-mysql.bat`** (ou certifique-se de que o serviço MySQL está ativo).
2. Dê duplo-clique em **`iniciar-servidor.bat`** (a API inicia na porta 3000 conectada ao MySQL Workbench).

### Passo 2: Rodar os 33 Testes Automatizados
Dê duplo-clique em **`testar-api.bat`**.
> 🌟 **Dica de Ouro:** Mostre o relatório final com os **33 testes verdes aprovados (100% Sucesso)** na frente do professor! Isso comprova que todas as regras de negócio, CRUD, autenticação JWT, integridade referencial e RBAC estão rigorosamente validadas.

### Passo 3: Demonstração na Interface Web (Frontend)
1. Abra o arquivo **`frontend/index.html`** no navegador.
2. Mostre os **Cards de Métricas em Tempo Real** (total de veículos, veículos disponíveis, valor total do estoque e quilometragem média).
3. Demonstre os **Filtros Combinados** (busca por texto, filtro de categorias, filtro de fabricantes e filtro de status: Disponível, Reservado, Vendido).
4. Clique em **Entrar / Cadastro** e use os botões de **Acesso Rápido**:
   - Entre como **Cliente**:
     - Clique em **💬 Proposta** em um carro (ex: Corolla) e envie uma proposta de compra com valor e forma de pagamento.
     - Mostre que a proposta aparece no histórico do cliente.
   - Entre como **Vendedor**:
     - Mostre que os botões de edição aparecem na tabela de veículos.
     - Mostre a proposta enviada pelo cliente no painel inferior e clique em **✅ Aprovar**.
     - **Destaque a Regra de Negócio Automotiva:** Ao aprovar a proposta, o Corolla passa automaticamente do status `'disponivel'` para `'reservado'` no estoque!
   - Entre como **Administrador**:
     - Mostre o botão **🗑️ Excluir** disponível exclusivamente para o Admin.
     - Role até o final e mostre o **Painel Exclusivo de Gestão de Usuários (RBAC)**.
     - Demonstre a inativação/ativação de um usuário com 1 clique (botão **🚫 Inativar** / **✅ Ativar**).
     - Clique em **＋ Novo Usuário** para criar uma conta com perfil escolhido diretamente no MySQL.

### Passo 4: Demonstração no Thunder Client (VS Code)
Abra a extensão **Thunder Client** no VS Code:
1. Abra a coleção **AutoPrime - Concessionária & Autenticação**.
2. Execute requisições nas pastas `/auth`, `/veiculos`, `/propostas` e `/usuarios`.
3. Demonstre a segurança: faça uma requisição de exclusão com o token do Vendedor e mostre o retorno **`403 Forbidden - Permissão insuficiente`**!

---

## 🏆 Resumo das Credenciais para Apresentação
- **Administrador:** `admin@autoprime.com` / `admin123`
- **Vendedor:** `vendedor@autoprime.com` / `vendedor123`
- **Cliente:** `cliente@autoprime.com` / `cliente123`
