# 🎓 Guia Completo para Apresentação no Colégio (Senac RS)
## Projeto AutoPrime — Concessionária: Banco de Dados Relacional & Autenticação JWT

Este guia foi elaborado para você apresentar a **Segunda Entrega** com segurança e maestria, garantindo nota máxima nos 4 indicadores de avaliação.

---

## 📌 Checklist de Pré-Requisitos na Máquina da Escola

1. **Node.js** instalado (versão 18, 20 ou superior).
2. **MySQL Server + MySQL Workbench** (ou XAMPP com MySQL ativo).
3. **VS Code** com a extensão **Thunder Client**.

---

## 🗄️ 1. O que Mostrar sobre o Banco de Dados Relacional (Indicador 1)

1. Abra o arquivo **`sql/concessionaria.sql`** no VS Code ou no **MySQL Workbench**.
2. Destaque ao professor as **5 tabelas relacionadas**:
   - `perfis` (1:N com `usuarios`)
   - `usuarios` (N:1 com `perfis`)
   - `categorias` (1:N com `veiculos`)
   - `veiculos` (N:1 com `categorias`, N:1 com `usuarios` que cadastrou)
   - `propostas` (N:1 com `veiculos`, N:1 com `usuarios`/cliente, N:1 com `usuarios`/vendedor)
3. Mostre as **Chaves Primárias (`PRIMARY KEY`)** e **Chaves Estrangeiras (`FOREIGN KEY`)** com integridade referencial (`ON DELETE RESTRICT / CASCADE / SET NULL`).
4. Rode a consulta no MySQL Workbench:
   ```sql
   USE concessionaria;
   SHOW TABLES;
   SELECT * FROM perfis;
   SELECT id, nome, email, perfil_id, ativo FROM usuarios;
   SELECT id, modelo, fabricante, preco, status FROM veiculos;
   SELECT * FROM propostas;
   ```

---

## 🔐 2. O que Mostrar sobre Cadastro e Proteção de Senhas (Indicador 2)

1. Mostre no código **`backend/controllers/authController.js`**:
   - O uso de **`bcryptjs`** com fator de custo `saltRounds = 10`.
   - Explique que as senhas **nunca** são salvas em texto puro no banco de dados.
   - Mostre no Workbench ou em `usuarios` a coluna `senha` preenchida com o hash `$2b$10$...`.
2. Mostre a validação de credenciais:
   - Validação de e-mail duplicado (retorna `409 Conflict`).
   - Validação de senha fraca (mínimo de 6 caracteres, retorna `400 Bad Request`).
   - Bloqueio com mensagem segura caso a senha esteja incorreta (`401 Unauthorized`).

---

## 🛡️ 3. O que Mostrar sobre Autenticação JWT e Controle de Perfis (Indicador 3)

1. Mostre no código **`backend/middlewares/authMiddleware.js`**:
   - `autenticarToken`: extrai `Authorization: Bearer <token>`, valida assinatura e decodifica os dados.
   - `autorizarPerfis`: middleware RBAC que compara o perfil do usuário logado (`admin`, `vendedor`, `cliente`) com a lista de perfis permitidos.
2. Demonstre as regras de negócio em ação:
   - **Cliente:** pode ver catálogo e enviar propostas de compra, mas é **bloqueado (403 Forbidden)** se tentar cadastrar ou excluir veículos.
   - **Vendedor:** pode cadastrar e editar veículos e aprovar propostas, mas é **bloqueado (403 Forbidden)** se tentar excluir veículos.
   - **Administrador:** possui permissão total, incluindo a **exclusão de veículos (`DELETE /veiculos/:id`)** e a gestão de contas de usuários (`GET /usuarios`).

---

## ⚡ 4. Roteiro Prático de Demonstração (Ao Vivo)

### Passo 1: Ligar o Servidor
Dê duplo-clique em **`iniciar-servidor.bat`** (ou `npm start` na pasta backend).

### Passo 2: Rodar os 29 Testes Automatizados
Dê duplo-clique em **`testar-api.bat`**.
> 🌟 **Dica de Ouro:** Mostre o relatório final com os **29 testes verdes aprovados** na frente do professor! Isso comprova que 100% dos fluxos de banco, segurança, JWT e RBAC estão validados.

### Passo 3: Demonstração no Thunder Client
Abra a coleção **AutoPrime - Concessionária & Autenticação** no VS Code:
1. **Login de Vendedor (`POST /auth/login`):** mostre o token JWT gerado e o payload.
2. **Cadastrar Veículo com Token (`POST /veiculos`):** envie a requisição com o cabeçalho `Authorization: Bearer {{tokenVendedor}}`.
3. **Tentativa de Exclusão pelo Vendedor (`DELETE /veiculos/1`):** envie e mostre o erro **`403 Forbidden - Permissão insuficiente`**.
4. **Exclusão pelo Administrador:** troque para o token do Admin e mostre o sucesso **`200 OK - Veículo excluído`**!

### Passo 4: Demonstração na Interface Web (Frontend)
1. Abra `frontend/index.html`.
2. Clique em **Entrar / Cadastro**.
3. Use os botões de **Acesso Rápido (Admin, Vendedor, Cliente)** para demonstrar como o perfil muda dinamicamente na tela.
4. Entre como **Cliente** e clique em **💬 Proposta** em um carro para enviar uma oferta comercial com valor e forma de pagamento!
5. Entre como **Vendedor** e veja a proposta aparecer no painel inferior com o botão **✅ Aprovar**!

---

## 🏆 Resumo das Credenciais para Apresentação
- **Administrador:** `admin@autoprime.com` / `admin123`
- **Vendedor:** `vendedor@autoprime.com` / `vendedor123`
- **Cliente:** `cliente@autoprime.com` / `cliente123`
