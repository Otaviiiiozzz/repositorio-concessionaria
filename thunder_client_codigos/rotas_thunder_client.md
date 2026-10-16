# ⚡ Rotas do Thunder Client - AutoPrime

Guia rápido com os métodos e endpoints para testar no Thunder Client:

### 1. Listar Veículos
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos`

### 2. Buscar por ID
- **Método:** `GET`
- **URL:** `http://localhost:3000/veiculos/1`

### 3. Cadastrar Veículo
- **Método:** `POST`
- **URL:** `http://localhost:3000/veiculos`
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

### 4. Atualizar Veículo
- **Método:** `PUT`
- **URL:** `http://localhost:3000/veiculos/1`
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

### 5. Excluir Veículo
- **Método:** `DELETE`
- **URL:** `http://localhost:3000/veiculos/8`
