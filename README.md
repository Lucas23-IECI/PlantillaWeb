# Plantilla Web E-commerce

Plantilla profesional con todo lo necesario para lanzar un sitio de ventas online.

## Inicio Rapido

### Frontend
```bash
cd frontend
python -m http.server 8080
```
Abrir en navegador: `http://localhost:8080`

### Backend
```bash
cd backend
node mockServer.js
```
El servidor corre en: `http://localhost:3000`

## Caracteristicas

- Autenticacion JWT completa (registro, login, cambio de contrasena)
- Gestion de productos con imagenes
- Carrito de compras persistente
- Panel de administracion completo
- Integracion Webpay Plus (Transbank)
- Emails transaccionales (Resend)
- Upload de imagenes (Cloudinary)
- SEO optimizado con Schema.org
- Responsive design mobile-first
- Avisos flotantes y codigos de descuento

## Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Pagos | Webpay Plus (Transbank) |
| Email | Resend |
| Storage | Cloudinary |

## Estructura del Proyecto

```
PlantillaCompleta/
├── frontend/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── pages/
│   └── index.html
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── server.js
│
└── docs/
```

## Instalacion Completa

### 1. Clonar y entrar al proyecto
```bash
cd PlantillaCompleta
```

### 2. Configurar backend
```bash
cd backend
cp .env.example .env
npm install
```

### 3. Configurar variables de entorno
Editar `.env` con las credenciales correspondientes.

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

## Personalizacion

### Cambiar colores
Editar `frontend/css/variables.css`:
```css
:root {
    --color-primary: #tu-color;
    --color-secondary: #tu-color;
}
```

### Configurar datos del negocio
Editar `frontend/js/config.js`:
```javascript
const CONFIG = {
    SITE_NAME: 'Tu Tienda',
    WHATSAPP_NUMBER: '56912345678',
};
```

## Documentacion

- [Guia de Instalacion](docs/INSTALLATION.md)
- [Guia de Personalizacion](docs/CUSTOMIZATION.md)
- [Documentacion API](docs/API.md)
- [Guia de Deploy](docs/DEPLOYMENT.md)
- [Integraciones](docs/INTEGRATIONS.md)

## Credenciales de Prueba

Para Webpay en modo integracion:

| Campo | Valor |
|-------|-------|
| Tarjeta | 4051 8856 0044 6623 |
| CVV | 123 |
| Fecha | Cualquier fecha futura |

## Licencia

MIT - Libre para uso personal y comercial.
