# 🚀 Plantilla Web E-commerce Completa

Plantilla profesional con todo lo necesario para lanzar un sitio de ventas online.

## ✨ Características

- ✅ Autenticación JWT completa (registro, login, cambio contraseña)
- ✅ Gestión de productos con imágenes
- ✅ Carrito de compras persistente
- ✅ Panel de administración completo
- ✅ Integración Webpay Plus (Transbank)
- ✅ Emails transaccionales (Resend)
- ✅ Upload de imágenes (Cloudinary)
- ✅ SEO optimizado con Schema.org
- ✅ Responsive design mobile-first
- ✅ Avisos flotantes y códigos de descuento

## 🛠️ Stack Tecnológico

**Frontend:** HTML5, CSS3, JavaScript ES6+  
**Backend:** Node.js + Express  
**Database:** Firebase Firestore  
**Pagos:** Webpay Plus (Transbank)  
**Email:** Resend  
**Storage:** Cloudinary  

## 📁 Estructura del Proyecto

```
PlantillaCompleta/
├── frontend/           # Código del cliente
│   ├── css/            # Estilos
│   ├── js/             # JavaScript
│   ├── images/         # Imágenes y assets
│   ├── pages/          # Páginas HTML
│   └── index.html      # Página principal
│
├── backend/            # Código del servidor
│   ├── config/         # Configuraciones
│   ├── controllers/    # Lógica de rutas
│   ├── middleware/     # Middlewares
│   ├── routes/         # Definición de rutas
│   ├── services/       # Servicios externos
│   └── server.js       # Punto de entrada
│
└── docs/               # Documentación
```

## 🚀 Instalación Rápida

### 1. Clonar y entrar al proyecto
```bash
cd PlantillaCompleta
```

### 2. Configurar backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
```

### 3. Ejecutar
```bash
npm run dev
```

### 4. Abrir frontend
Abre `frontend/index.html` en tu navegador o usa un servidor estático.

## 🎨 Personalización

### Cambiar colores
Edita `frontend/css/variables.css`:
```css
:root {
    --color-primary: #tu-color;
    --color-secondary: #tu-color;
}
```

### Configurar datos del negocio
Edita `frontend/js/config.js`:
```javascript
const CONFIG = {
    SITE_NAME: 'Tu Tienda',
    WHATSAPP_NUMBER: '56912345678',
    // ...
};
```

## 📖 Documentación

- [Guía de Instalación](docs/INSTALLATION.md)
- [Guía de Personalización](docs/CUSTOMIZATION.md)
- [Documentación API](docs/API.md)
- [Guía de Deploy](docs/DEPLOYMENT.md)
- [Integraciones](docs/INTEGRATIONS.md)

## 👤 Credenciales de Prueba

Para Webpay en modo integración:
- **Tarjeta:** 4051 8856 0044 6623
- **CVV:** 123
- **Fecha:** Cualquier fecha futura

## 📝 Licencia

MIT - Libre para uso personal y comercial.

---

Desarrollado con ❤️ como plantilla base para proyectos e-commerce.
