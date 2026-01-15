# Guía de Despliegue

## Opciones de Hosting

### Backend (Node.js)

| Servicio | Tier Gratuito | Ventajas |
|----------|---------------|----------|
| **Render** | ✅ Sí | Fácil, auto-deploy desde Git |
| **Railway** | ✅ Sí ($5 crédito) | Rápido, buena UI |
| **Fly.io** | ✅ Sí | Global, bajo latency |
| **Heroku** | ❌ No | Muy conocido |

### Frontend (Estático)

| Servicio | Tier Gratuito | Ventajas |
|----------|---------------|----------|
| **Vercel** | ✅ Sí | Excelente, CDN global |
| **Netlify** | ✅ Sí | Fácil, auto-deploy |
| **Cloudflare Pages** | ✅ Sí | Muy rápido |
| **GitHub Pages** | ✅ Sí | Simple |

---

## Deploy en Render (Recomendado)

### 1. Preparar Backend

Crea `render.yaml` en la raíz:

```yaml
services:
  - type: web
    name: plantilla-backend
    env: node
    region: ohio
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: FIREBASE_SERVICE_ACCOUNT_BASE64
        sync: false
```

### 2. Conectar Repositorio

1. Sube el proyecto a GitHub
2. Ve a [render.com](https://render.com)
3. Crea cuenta y conecta GitHub
4. Click en "New +" > "Web Service"
5. Selecciona tu repositorio
6. Render detectará `render.yaml`

### 3. Configurar Variables

En el dashboard de Render:
1. Ve a tu servicio > Environment
2. Agrega las variables de `.env`:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64`
   - `RESEND_API_KEY`
   - `CLOUDINARY_*` (si usas)
   - etc.

### 4. Deploy Frontend en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. "Add new site" > "Import from Git"
3. Selecciona tu repo
4. Configura:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
5. Deploy!

### 5. Conectar Frontend con Backend

1. Copia la URL de tu backend en Render (ej: `https://tu-app.onrender.com`)
2. Actualiza `frontend/js/config.js`:

```javascript
API_URL: 'https://tu-app.onrender.com/api'
```

3. Redeploy frontend

---

## Deploy con Docker

### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend .

EXPOSE 5000
CMD ["node", "server.js"]
```

### Build y Run

```bash
docker build -t plantilla-backend .
docker run -p 5000:5000 --env-file backend/.env plantilla-backend
```

---

## Configuración DNS

### Dominio personalizado

1. Compra dominio en Namecheap, GoDaddy, etc.
2. En Netlify/Vercel: Settings > Domains > Add domain
3. Configura DNS:
   - **A Record**: `@` → IP del servicio
   - **CNAME**: `www` → `tu-dominio.netlify.app`

### SSL/HTTPS

Netlify, Vercel y Render incluyen certificados SSL gratuitos automáticamente.

---

## Variables de Producción

```env
NODE_ENV=production
PORT=5000

# URLs públicas (actualizar con tus dominios)
BACKEND_PUBLIC_URL=https://api.tudominio.com
FRONTEND_PUBLIC_URL=https://tudominio.com

# CORS (separar por comas si hay múltiples)
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com

# Transbank producción
TRANSBANK_ENV=production
TBK_API_KEY_ID=tu-codigo
TBK_API_KEY_SECRET=tu-secret
```

---

## Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] SSL/HTTPS habilitado
- [ ] Dominio configurado
- [ ] Transbank en modo producción
- [ ] Emails funcionando
- [ ] Imágenes en Cloudinary
- [ ] Monitoreo/logs configurado
- [ ] Backup de base de datos
