# Guía de Instalación

## Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Cuenta de **Firebase** con Firestore habilitado
- (Opcional) Cuenta de **Cloudinary** para imágenes
- (Opcional) Cuenta de **Resend** para emails
- (Opcional) Credenciales de **Transbank** para pagos

## Instalación Paso a Paso

### 1. Preparar el proyecto

```bash
cd PlantillaCompleta
```

### 2. Configurar el Backend

```bash
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Instalar dependencias
npm install
```

### 3. Configurar Variables de Entorno

Edita el archivo `backend/.env` con tus credenciales:

#### Firebase (Obligatorio)

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un proyecto o selecciona uno existente
3. Ve a Configuración del proyecto > Cuentas de servicio
4. Genera una nueva clave privada (JSON)
5. Copia el contenido y configura en `.env`:

```env
# Opción 1: Base64 (recomendado para deploy)
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIj...

# Opción 2: JSON directo
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account"...}

# Opción 3: Path a archivo (desarrollo local)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-credentials.json
```

#### JWT Secret

Genera un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado a `JWT_SECRET`.

#### Cloudinary (Opcional - para imágenes)

1. Crea cuenta en [cloudinary.com](https://cloudinary.com)
2. Ve al Dashboard y copia las credenciales:

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123xyz
```

#### Resend (Opcional - para emails)

1. Crea cuenta en [resend.com](https://resend.com)
2. Genera una API Key:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=Tu Tienda <noreply@tudominio.com>
```

#### Webpay (Opcional - para pagos)

Para desarrollo, usa el modo integración (ya configurado por defecto).

Para producción:
```env
TRANSBANK_ENV=production
TBK_API_KEY_ID=tu-codigo-comercio
TBK_API_KEY_SECRET=tu-api-key-secret
```

### 4. Iniciar el Backend

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

### 5. Crear Usuario Admin

```bash
# Primero registra un usuario desde el frontend
# Luego asigna rol admin:
npm run set-admin usuario@email.com
```

O usa el script de seed para datos de prueba:

```bash
npm run seed
```

Esto creará:
- Usuario admin: `admin@tutienda.com` / `Admin123!`
- 5 productos de ejemplo

### 6. Servir el Frontend

Para desarrollo local, puedes usar cualquier servidor estático:

```bash
# Con Python
cd frontend
python -m http.server 8080

# Con npx
npx serve frontend

# O abre directamente frontend/index.html en el navegador
```

## Verificación

1. Abre `http://localhost:8080` (o tu puerto)
2. Verifica que la página cargue correctamente
3. Inicia sesión con el usuario admin
4. Accede al panel de administración

## Problemas Comunes

### Error de CORS
Asegúrate de que `FRONTEND_PUBLIC_URL` en `.env` coincida con la URL del frontend.

### Firebase no conecta
Verifica que las credenciales JSON sean válidas y que Firestore esté habilitado.

### Imágenes no cargan
Si no has configurado Cloudinary, usa URLs de imágenes externas o locales.
