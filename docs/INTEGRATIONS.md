# Guía de Integraciones

## Firebase Firestore

### Colecciones Utilizadas

| Colección | Descripción |
|-----------|-------------|
| `users` | Usuarios registrados |
| `products` | Catálogo de productos |
| `transactions` | Pedidos y transacciones |
| `notices` | Avisos del sitio |
| `discount_codes` | Códigos de descuento |
| `settings` | Configuraciones (featured, catalog order) |

### Estructura de Documentos

#### users
```json
{
  "email": "usuario@email.com",
  "name": "Nombre",
  "password": "$2a$10...",  // bcrypt hash
  "phone": "+56912345678",
  "address": "Dirección",
  "city": "Ciudad",
  "admin": false,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### products
```json
{
  "name": "Producto",
  "description": "Descripción",
  "price": 15000,
  "image_url": "https://...",
  "category": "General",
  "stock": 50,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Webpay Plus (Transbank)

### Modo Integración (Testing)

Ya viene configurado por defecto. Credenciales de prueba:

- **Tarjeta**: 4051 8856 0044 6623
- **CVV**: 123
- **Fecha**: Cualquier fecha futura
- **RUT**: 11.111.111-1

### Modo Producción

1. Solicita credenciales en [Transbank Developers](https://www.transbankdevelopers.cl/)
2. Completa el proceso de certificación
3. Actualiza `.env`:

```env
TRANSBANK_ENV=production
TBK_API_KEY_ID=tu-codigo-comercio
TBK_API_KEY_SECRET=tu-api-key-secret
```

### Flujo de Pago

```
1. Frontend crea transacción (POST /transactions)
2. Frontend inicia pago (POST /webpay/create)
3. Usuario es redirigido a Webpay
4. Usuario completa pago
5. Webpay redirige a /webpay/return
6. Frontend confirma (POST /webpay/commit)
7. Se actualizan estado y se envían emails
```

---

## Cloudinary (Imágenes)

### Configuración

1. Crea cuenta en [cloudinary.com](https://cloudinary.com)
2. Ve al Dashboard
3. Copia credenciales a `.env`:

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123xyz
```

### Uso

Las imágenes se suben automáticamente cuando:
- Creas/editas un producto en el admin
- Usas el endpoint `POST /admin/upload`

### Optimización

El servicio configura automáticamente:
- Resize a máximo 800x800px
- Calidad automática
- Formato automático (WebP cuando es soportado)

---

## Resend (Emails)

### Configuración

1. Crea cuenta en [resend.com](https://resend.com)
2. Genera API Key
3. Verifica tu dominio (recomendado para producción)
4. Configura `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=Tu Tienda <noreply@tudominio.com>
MAIL_REPLY_TO=contacto@tudominio.com
ORDER_NOTIFICATION_EMAIL=ventas@tudominio.com
```

### Emails Enviados

| Evento | Destinatario | Descripción |
|--------|--------------|-------------|
| Pago exitoso | Cliente | Confirmación de pedido |
| Pago exitoso | Tienda | Notificación de nuevo pedido |
| Reset password | Usuario | Link de recuperación |

### Personalizar Templates

Edita `backend/config/email.js` para modificar los templates HTML de los emails.

---

## WhatsApp

### Botón Flotante

Configurado en `frontend/js/config.js`:

```javascript
WHATSAPP_NUMBER: '56912345678'  // Sin + ni espacios
```

### Links de Consulta

En la página de producto, hay un link automático a WhatsApp con mensaje pre-formateado incluyendo el nombre del producto.

---

## Google Analytics (Manual)

### Agregar Tracking

1. Crea propiedad en [analytics.google.com](https://analytics.google.com)
2. Obtén tu Measurement ID (G-XXXXXXXX)
3. Agrega al `<head>` de cada HTML:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

---

## Schema.org (SEO)

### Tipos Utilizados

- `Store` - Información del negocio (index.html)

### Agregar Schema a Productos

Puedes agregar Schema.org dinámicamente en `producto.html` para mejorar SEO:

```javascript
const schema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "CLP"
  }
};
```

---

## Alternativas

### Base de Datos
- **PostgreSQL**: Usar con TypeORM (ver proyecto OpticaDanniels)
- **MongoDB**: Cambiar firebaseAdmin por mongoose

### Pagos
- **Stripe**: Reemplazar transbank.js
- **MercadoPago**: SDK disponible para Node.js

### Email
- **Nodemailer**: Alternativa gratuita con Gmail
- **SendGrid**: Similar a Resend

### Storage
- **AWS S3**: Cambiar cloudinary.js
- **Firebase Storage**: Ya soportado en firebaseAdmin.js
