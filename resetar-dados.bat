@echo off
chcp 65001 > nul
title AutoPrime - Restaurar Estoque Original
echo =======================================================
echo 🔄 Restaurando os 8 veículos originais do estoque...
echo =======================================================

(
echo [
echo   { "id": 1, "modelo": "Corolla XEi 2.0",    "fabricante": "Toyota",     "ano": 2024, "quilometragem": 12000, "preco": 158900.00 },
echo   { "id": 2, "modelo": "Civic Touring",      "fabricante": "Honda",      "ano": 2023, "quilometragem": 25000, "preco": 172500.00 },
echo   { "id": 3, "modelo": "HB20 Comfort",       "fabricante": "Hyundai",    "ano": 2022, "quilometragem": 45000, "preco": 82900.00 },
echo   { "id": 4, "modelo": "Onix Plus LTZ",      "fabricante": "Chevrolet",  "ano": 2023, "quilometragem": 18000, "preco": 97500.00 },
echo   { "id": 5, "modelo": "Compass Limited",    "fabricante": "Jeep",       "ano": 2024, "quilometragem": 8000,  "preco": 198700.00 },
echo   { "id": 6, "modelo": "T-Cross Highline",   "fabricante": "Volkswagen", "ano": 2023, "quilometragem": 32000, "preco": 139900.00 },
echo   { "id": 7, "modelo": "Tracker Premier",    "fabricante": "Chevrolet",  "ano": 2022, "quilometragem": 41000, "preco": 128000.00 },
echo   { "id": 8, "modelo": "Kicks Advance",      "fabricante": "Nissan",     "ano": 2023, "quilometragem": 22000, "preco": 112900.00 }
echo ]
) > "%~dp0backend\database\dados_locais.json"

echo.
echo ✅ Estoque restaurado com sucesso para o estado original!
echo 💡 Se o servidor estiver rodando, reinicie-o (ou salve um arquivo) para recarregar.
echo.
pause
