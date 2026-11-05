# ⚡ Guia de Rotas & Testes no Thunder Client - AutoPrime

Este documento traz a lista completa de endpoints da API, divididos por módulo, acompanhados de exemplos de requisição, cabeçalhos de autenticação e permissões de perfil (RBAC).

---

## 🔑 1. Módulo de Autenticação & Perfis (`/auth`)

### 1.1 Cadastro Público de Usuário
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/registrar`
- **Cabeçalhos:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "nome": "Lucas Martins",
  "email": "lucas@email.com",
  "senha": "senhaSegura123",
  "telefone": "(51) 99887-6655"
}
```
- **Retorno Esperado (201):** Mensagem de sucesso, token JWT assinado e dados do usuário (sem expor hash de senha).

### 1.2 Login de Usuário (Geração do Token JWT)
- **Método:** `POST`
- **URL:** `http://localhost:3000/auth/login`
- **Cabeçalhos:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "email": "admin@autoprime.com",
  "senha": "admin123"
}
```
> 💡 **Contas de Teste Prontas:**
> - **Administrador:** `admin@autoprime.com` / `admin123`
> - **Vendedor:** `vendedor@autoprime.com` / `vendedor123`
> - **Cliente:** `cliente@autoprime.com` / `cliente123`

### 1.3 Consultar Dados do Usuário Logado (`/auth/me`)
- **Método:** `GET`
- **URL:** `http://localhost:3000/auth/me`
- **Cabeçalhos:**
  - `Authorization`: `Bearer <SEU_TOKEN_JWT_AQUI>`
- **Retorno Esperado (200):** Dados do usuário e perfil ativo.

### 1.4 Listar Perfis de Acesso
- **Método:** `GET`
- **URL:** `http://localhost:3000/auth/perfis`

---

## 🚗 2. Módulo de Veículos (`/veiculos`)

### 2.1 Listar Veículos (Público)
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos`
- **Filtros Opcionais:** `?busca=Corolla&fabricante=Toyota&preco_max=160000&ordenar=preco_asc`

### 2.2 Resumo Estatístico do Estoque (Público)
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/resumo`

### 2.3 Buscar Veículo por ID (Público)
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/1`

### 2.4 Cadastrar Veículo no Estoque (Requer Vendedor ou Admin)
- **Método:** `POST`
- **URL:** `http://localhost:3000/veiculos`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_VENDEDOR_OU_ADMIN>`
- **Body (JSON):**
```json
{
  "modelo": "Hilux GR-Sport 4x4",
  "fabricante": "Toyota",
  "ano": 2024,
  "quilometragem": 12000,
  "preco": 349900.00
}
```

### 2.5 Atualizar Dados do Veículo (Requer Vendedor ou Admin)
- **Método:** `PUT`
- **URL:** `http://localhost:3000/veiculos/1`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_VENDEDOR_OU_ADMIN>`
- **Body (JSON):**
```json
{
  "modelo": "Corolla XEi 2.0 Atualizado",
  "fabricante": "Toyota",
  "ano": 2024,
  "quilometragem": 14000,
  "preco": 159900.00
}
```

### 2.6 Excluir Veículo do Estoque (Restrito ao Administrador)
- **Método:** `DELETE`
- **URL:** `http://localhost:3000/veiculos/8`
- **Cabeçalhos:**
  - `Authorization`: `Bearer <TOKEN_ADMIN>`
- **Retorno Esperado (200):** `{ "mensagem": "Veículo #8 excluído com sucesso do estoque!" }`
- *(Caso um vendedor ou cliente tente excluir, a API retorna `403 Forbidden`).*

---

## 👥 3. Módulo de Gestão de Usuários (`/usuarios`) - Restrito ao Admin

### 3.1 Listar Todos os Usuários
- **Método:** `GET`
- **URL:** `http://localhost:3000/usuarios`
- **Cabeçalhos:**
  - `Authorization`: `Bearer <TOKEN_ADMIN>`

### 3.2 Criar Funcionário / Usuário com Perfil Específico
- **Método:** `POST`
- **URL:** `http://localhost:3000/usuarios`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_ADMIN>`
- **Body (JSON):**
```json
{
  "nome": "Fernando Vendedor",
  "email": "fernando@autoprime.com",
  "senha": "vendas123456",
  "perfil_id": 2,
  "telefone": "(51) 98765-1122"
}
```

### 3.3 Ativar ou Inativar Conta de Usuário
- **Método:** `PATCH`
- **URL:** `http://localhost:3000/usuarios/2/status`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_ADMIN>`
- **Body (JSON):**
```json
{
  "ativo": 0
}
```

---

## 💬 4. Módulo de Propostas Comerciais (`/propostas`) - Relacional

### 4.1 Enviar Proposta de Compra (Cliente Autenticado)
- **Método:** `POST`
- **URL:** `http://localhost:3000/propostas`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_CLIENTE>`
- **Body (JSON):**
```json
{
  "veiculo_id": 1,
  "valor_proposta": 155000.00,
  "forma_pagamento": "financiamento",
  "observacoes": "Entrada de R$ 50.000 + saldo em 36 vezes pelo banco."
}
```

### 4.2 Listar Minhas Propostas (Cliente Autenticado)
- **Método:** `GET`
- **URL:** `http://localhost:3000/propostas/minhas`
- **Cabeçalhos:**
  - `Authorization`: `Bearer <TOKEN_CLIENTE>`

### 4.3 Listar Todas as Propostas da Concessionária (Vendedor ou Admin)
- **Método:** `GET`
- **URL:** `http://localhost:3000/propostas`
- **Cabeçalhos:**
  - `Authorization`: `Bearer <TOKEN_VENDEDOR_OU_ADMIN>`

### 4.4 Atualizar Status da Proposta (Vendedor ou Admin)
- **Método:** `PATCH`
- **URL:** `http://localhost:3000/propostas/1/status`
- **Cabeçalhos:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TOKEN_VENDEDOR_OU_ADMIN>`
- **Body (JSON):**
```json
{
  "status": "aprovada"
}
```
*(Opções válidas de status: `pendente`, `aprovada`, `recusada`, `cancelada`).*
