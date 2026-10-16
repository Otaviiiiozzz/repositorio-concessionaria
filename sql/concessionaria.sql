-- ===========================================
-- Script SQL - Concessionária AutoPrime
-- ===========================================

CREATE DATABASE IF NOT EXISTS concessionaria
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE concessionaria;

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id          INT             NOT NULL AUTO_INCREMENT,
    modelo      VARCHAR(100)    NOT NULL,
    fabricante  VARCHAR(100)    NOT NULL,
    ano         INT             NOT NULL,
    quilometragem DECIMAL(12,2) NOT NULL DEFAULT 0,
    preco       DECIMAL(12,2)   NOT NULL,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fabricante (fabricante),
    INDEX idx_ano (ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados de exemplo para testes
INSERT INTO veiculos (modelo, fabricante, ano, quilometragem, preco) VALUES
('Corolla XEi 2.0',    'Toyota',       2024,   12000,  158900.00),
('Civic Touring',      'Honda',        2023,   25000,  172500.00),
('HB20 Comfort',       'Hyundai',      2022,   45000,   82900.00),
('Onix Plus LTZ',      'Chevrolet',    2023,   18000,   97500.00),
('Compass Limited',    'Jeep',         2024,    8000,  198700.00),
('T-Cross Highline',   'Volkswagen',   2023,   32000,  139900.00),
('Tracker Premier',    'Chevrolet',    2022,   41000,  128000.00),
('Kicks Advance',      'Nissan',       2023,   22000,  112900.00);
