-- =====================================================================
-- AutoPrime Motors - Sistema de Gestão de Concessionária
-- Script DDL & DML - Banco de Dados Relacional MySQL
-- =====================================================================
-- Projeto Integrador: Banco de Dados Relacional, Autenticação JWT e CRUD Completo
-- Modelagem relacional completa com chaves primárias, estrangeiras,
-- integridade referencial, perfis de acesso e dados iniciais.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS concessionaria
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE concessionaria;

-- =====================================================================
-- 1. TABELA DE PERFIS DE USUÁRIO (Controle de Acesso / RBAC)
-- =====================================================================
CREATE TABLE IF NOT EXISTS perfis (
    id          INT             NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(50)     NOT NULL UNIQUE,
    descricao   VARCHAR(255)    NOT NULL,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. TABELA DE USUÁRIOS (Autenticação, Senhas com Hash e Perfis)
-- =====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              INT             NOT NULL AUTO_INCREMENT,
    nome            VARCHAR(100)    NOT NULL,
    email           VARCHAR(120)    NOT NULL UNIQUE,
    senha           VARCHAR(255)    NOT NULL, -- Hash bcrypt com salt rounds >= 10
    perfil_id       INT             NOT NULL,
    telefone        VARCHAR(20)     NULL,
    ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_usuarios_perfis 
        FOREIGN KEY (perfil_id) 
        REFERENCES perfis(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_perfil (perfil_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. TABELA DE CATEGORIAS DE VEÍCULOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS categorias (
    id          INT             NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(50)     NOT NULL UNIQUE,
    descricao   VARCHAR(255)    NULL,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. TABELA DE VEÍCULOS (Entidade Principal do Catálogo)
-- =====================================================================
CREATE TABLE IF NOT EXISTS veiculos (
    id              INT             NOT NULL AUTO_INCREMENT,
    modelo          VARCHAR(100)    NOT NULL,
    fabricante      VARCHAR(100)    NOT NULL,
    ano             INT             NOT NULL,
    quilometragem   DECIMAL(12,2)   NOT NULL DEFAULT 0,
    preco           DECIMAL(12,2)   NOT NULL,
    status          ENUM('disponivel', 'reservado', 'vendido') NOT NULL DEFAULT 'disponivel',
    categoria_id    INT             NULL,
    cadastrado_por  INT             NULL,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_veiculos_categorias 
        FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_veiculos_usuarios 
        FOREIGN KEY (cadastrado_por) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    INDEX idx_veiculos_fabricante (fabricante),
    INDEX idx_veiculos_ano (ano),
    INDEX idx_veiculos_status (status),
    INDEX idx_veiculos_categoria (categoria_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. TABELA DE PROPOSTAS / VENDAS (Relacionamento Veículo x Cliente)
-- =====================================================================
CREATE TABLE IF NOT EXISTS propostas (
    id              INT             NOT NULL AUTO_INCREMENT,
    veiculo_id      INT             NOT NULL,
    cliente_id      INT             NOT NULL,
    vendedor_id     INT             NULL,
    valor_proposta  DECIMAL(12,2)   NOT NULL,
    status          ENUM('pendente', 'aprovada', 'recusada', 'cancelada') NOT NULL DEFAULT 'pendente',
    forma_pagamento ENUM('a_vista', 'financiamento', 'consorcio', 'troca') NOT NULL DEFAULT 'a_vista',
    observacoes     TEXT            NULL,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_propostas_veiculos 
        FOREIGN KEY (veiculo_id) 
        REFERENCES veiculos(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_propostas_cliente 
        FOREIGN KEY (cliente_id) 
        REFERENCES usuarios(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_propostas_vendedor 
        FOREIGN KEY (vendedor_id) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    INDEX idx_propostas_status (status),
    INDEX idx_propostas_veiculo (veiculo_id),
    INDEX idx_propostas_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- INSERÇÃO DE DADOS INICIAIS (SEED)
-- =====================================================================

-- 1. Perfis de acesso padrão
INSERT INTO perfis (id, nome, descricao) VALUES
(1, 'admin', 'Administrador com acesso total ao sistema e gestão de usuários'),
(2, 'vendedor', 'Vendedor com permissão de gerenciar catálogo e responder propostas'),
(3, 'cliente', 'Cliente que navega pelo catálogo e realiza propostas de negociação')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

-- 2. Usuários iniciais com senhas criptografadas em bcrypt
-- Senhas originais:
-- admin@autoprime.com    -> admin123
-- vendedor@autoprime.com -> vendedor123
-- cliente@autoprime.com  -> cliente123
INSERT INTO usuarios (id, nome, email, senha, perfil_id, telefone, ativo) VALUES
(1, 'Administrador AutoPrime', 'admin@autoprime.com', '$2b$10$o6OImj9JXu3Tk3RDfafD9.77LJgP0Pk5eZSt1Gsm982nVQhryKCaG', 1, '(51) 99999-0001', 1),
(2, 'Carlos Vendas',           'vendedor@autoprime.com', '$2b$10$pGlH9lFg5PhxiDxhUxRgzOiEeln4WH6QyWQNyF/q3yKlky0C85aNK', 2, '(51) 98888-0002', 1),
(3, 'Mariana Cliente',         'cliente@autoprime.com', '$2b$10$j8eFVHkqtODwGTJJBvtu8edgO2fsgizrA7xvsFlrYiDsla6LZ.io2', 3, '(51) 97777-0003', 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 3. Categorias de veículos
INSERT INTO categorias (id, nome, descricao) VALUES
(1, 'Sedan',     'Carros de três volumes confortáveis com ótimo espaço interno'),
(2, 'SUV',       'Veículos utilitários esportivos com posição de dirigir elevada'),
(3, 'Hatch',     'Modelos compactos com excelente agilidade e economia urbana'),
(4, 'Picape',    'Veículos utilitários robustos para transporte e carga'),
(5, 'Esportivo', 'Veículos de alta performance com design aerodinâmico')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);

-- 4. Veículos iniciais com chaves estrangeiras
INSERT INTO veiculos (id, modelo, fabricante, ano, quilometragem, preco, status, categoria_id, cadastrado_por) VALUES
(1, 'Corolla XEi 2.0',    'Toyota',       2024,   12000,  158900.00, 'disponivel', 1, 1),
(2, 'Civic Touring',      'Honda',        2023,   25000,  172500.00, 'disponivel', 1, 1),
(3, 'HB20 Comfort',       'Hyundai',      2022,   45000,   82900.00, 'disponivel', 3, 2),
(4, 'Onix Plus LTZ',      'Chevrolet',    2023,   18000,   97500.00, 'disponivel', 1, 2),
(5, 'Compass Limited',    'Jeep',         2024,    8000,  198700.00, 'disponivel', 2, 1),
(6, 'T-Cross Highline',   'Volkswagen',   2023,   32000,  139900.00, 'disponivel', 2, 2),
(7, 'Tracker Premier',    'Chevrolet',    2022,   41000,  128000.00, 'disponivel', 2, 2),
(8, 'Kicks Advance',      'Nissan',       2023,   22000,  112900.00, 'disponivel', 2, 1)
ON DUPLICATE KEY UPDATE modelo = VALUES(modelo);

-- 5. Propostas iniciais
INSERT INTO propostas (id, veiculo_id, cliente_id, vendedor_id, valor_proposta, status, forma_pagamento, observacoes) VALUES
(1, 1, 3, 2, 155000.00, 'pendente', 'financiamento', 'Cliente solicita entrada de 50.000 e saldo em 36x.'),
(2, 3, 3, 2,  80000.00, 'aprovada', 'a_vista',      'Pagamento via TED confirmado na entrega.')
ON DUPLICATE KEY UPDATE valor_proposta = VALUES(valor_proposta);
