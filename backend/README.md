# Backend API - Mi Tienda

## Comandos

```bash
# Instalar dependencias
npm install

# 🚀 Servidor con Webpay REAL (Transbank)
npm run dev      # Desarrollo con hot-reload
npm start        # Producción

# 🎭 Servidor MOCK (sin dependencias externas)
npm run mock     # Solo para pruebas rápidas sin Firebase/Webpay
```

## Diferencia entre servidores

| Característica | `server.js` (npm run dev) | `mockServer.js` (npm run mock) |
|----------------|---------------------------|--------------------------------|
| Webpay | ✅ Real de Transbank | ❌ Mock local |
| Firebase | ✅ Requerido | ❌ No necesario |
| Datos | Persistentes | En memoria |
| Uso | Desarrollo real / Producción | Pruebas rápidas UI |

## Variables de Entorno (.env)

```bash
# Servidor
PORT=5000
BACKEND_PUBLIC_URL=http://localhost:5000
FRONTEND_PUBLIC_URL=http://localhost:8080

# Firebase (requerido para server.js)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=tu-proyecto

# Transbank/Webpay
TRANSBANK_ENV=integration  # usa credenciales de prueba
# TRANSBANK_ENV=production # requiere TBK_API_KEY_ID y TBK_API_KEY_SECRET
```

## Webpay - Tarjetas de Prueba

En modo `integration`, usa estas tarjetas de prueba de Transbank:

| Tarjeta | Número | CVV | Vencimiento |
|---------|--------|-----|-------------|
| VISA (aprueba) | 4051 8856 0044 6623 | 123 | Cualquier fecha futura |
| VISA (rechaza) | 4051 8842 3993 7763 | 123 | Cualquier fecha futura |

**RUT de prueba:** 11.111.111-1  
**Clave:** 123
