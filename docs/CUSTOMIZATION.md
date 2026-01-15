# Guía de Personalización

Esta guía explica cómo adaptar la plantilla a tu negocio.

## 1. Información del Sitio

### Archivo: `frontend/js/config.js`

```javascript
const CONFIG = {
    SITE_NAME: 'Tu Nombre de Tienda',
    SITE_TAGLINE: 'Tu eslogan aquí',
    WHATSAPP_NUMBER: '56912345678', // Sin + ni espacios
    EMAIL: 'contacto@tudominio.com',
    PHONE: '+56 9 1234 5678',
    ADDRESS: 'Tu dirección',
    CITY: 'Tu ciudad',
    // ...
};
```

## 2. Colores y Diseño

### Archivo: `frontend/css/variables.css`

```css
:root {
    /* Colores principales */
    --color-primary: #1a1a2e;      /* Tu color de marca */
    --color-accent: #e94560;        /* Color de botones/CTAs */
    
    /* Fondos */
    --color-background: #ffffff;
    --color-background-alt: #f8f9fa;
    
    /* Tipografía */
    --font-primary: 'Tu Fuente', system-ui, sans-serif;
}
```

### Agregar Google Fonts

1. Ve a [fonts.google.com](https://fonts.google.com)
2. Selecciona tu fuente
3. Agrega el `<link>` en el `<head>` de cada HTML
4. Actualiza `--font-primary` en `variables.css`

## 3. Logo

### Reemplazar logo

1. Prepara tu logo en formato SVG o PNG
2. Reemplaza `frontend/images/logo-placeholder.svg`
3. Ajusta el tamaño en el CSS si es necesario

### Favicon

1. Genera favicons en [realfavicongenerator.net](https://realfavicongenerator.net)
2. Reemplaza `frontend/favicon.ico`
3. Agrega los meta tags generados al `<head>`

## 4. Contenido

### Textos del Home (`frontend/index.html`)

```html
<section class="hero">
    <p class="hero-subtitle">Tu subtítulo</p>
    <h1 class="hero-title">Tu Título Principal</h1>
    <p class="hero-description">Tu descripción...</p>
</section>
```

### Footer

Busca la sección `<footer>` y actualiza:
- Nombre de la tienda
- Links de contacto
- Redes sociales
- Textos legales

## 5. SEO

### En cada página HTML, actualiza:

```html
<title>Tu Título | Tu Tienda</title>
<meta name="description" content="Tu descripción para Google">

<!-- Schema.org -->
<script type="application/ld+json">
{
    "@type": "Store",
    "name": "Tu Tienda",
    "telephone": "+56 9 1234 5678",
    ...
}
</script>

<!-- Open Graph -->
<meta property="og:title" content="Tu Tienda">
<meta property="og:image" content="https://tudominio.com/tu-imagen.jpg">
```

## 6. Páginas Legales

### `pages/privacidad.html` y `pages/terminos.html`

Actualiza el contenido con:
- Nombre de tu empresa
- Datos de contacto
- Políticas específicas de tu negocio
- Información sobre envíos y devoluciones

## 7. Redes Sociales

Actualiza los links en:
- Footer de cada página
- `config.js` (INSTAGRAM_URL, FACEBOOK_URL)
- Botón flotante de WhatsApp

## 8. Moneda y Formato

### En `config.js`:

```javascript
CURRENCY: 'CLP',           // Código ISO de moneda
CURRENCY_SYMBOL: '$',
CURRENCY_LOCALE: 'es-CL',  // Formato regional
```

## Checklist de Personalización

- [ ] Actualizar `config.js` con datos del negocio
- [ ] Cambiar colores en `variables.css`
- [ ] Reemplazar logo
- [ ] Actualizar favicon
- [ ] Editar textos del home
- [ ] Actualizar footer
- [ ] Configurar Schema.org
- [ ] Editar Open Graph tags
- [ ] Actualizar páginas legales
- [ ] Configurar número de WhatsApp
- [ ] Agregar redes sociales
- [ ] Revisar textos de emails (backend)
