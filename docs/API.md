# Documentación de la API

Base URL: `http://localhost:5000/api`

## Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

---

## Endpoints Públicos

### Auth

#### POST /auth/register
Registrar nuevo usuario.

```json
{
    "email": "usuario@email.com",
    "name": "Nombre Completo",
    "password": "minimo6caracteres",
    "phone": "+56912345678",  // opcional
    "address": "Dirección",    // opcional
    "city": "Ciudad"           // opcional
}
```

**Respuesta:**
```json
{
    "message": "Usuario registrado exitosamente",
    "token": "eyJhbGc...",
    "user": {
        "id": "abc123",
        "email": "usuario@email.com",
        "name": "Nombre",
        "admin": false
    }
}
```

#### POST /auth/login
Iniciar sesión.

```json
{
    "email": "usuario@email.com",
    "password": "contraseña"
}
```

#### POST /auth/password-reset
Solicitar recuperación de contraseña.

```json
{
    "email": "usuario@email.com"
}
```

### Productos

#### GET /products
Obtener todos los productos activos.

#### GET /products/:id
Obtener producto por ID.

#### GET /products/home-featured
Obtener productos destacados para el home.

### Avisos

#### GET /notices/active
Obtener avisos activos.

### Códigos de Descuento

#### GET /discount-codes/validate?code=CODIGO
Validar código de descuento.

**Respuesta:**
```json
{
    "valid": true,
    "code": "VERANO20",
    "discount_type": "percentage",
    "discount_value": 20,
    "min_purchase": 10000
}
```

---

## Endpoints Protegidos (Requieren Token)

### Auth

#### POST /auth/change-password
```json
{
    "currentPassword": "actual",
    "newPassword": "nueva123"
}
```

### Transacciones

#### POST /transactions
Crear pedido.

```json
{
    "items": [
        {
            "product_id": "abc123",
            "name": "Producto",
            "price": 15000,
            "quantity": 2
        }
    ],
    "customer_name": "Nombre",
    "customer_email": "email@example.com",
    "customer_phone": "+56912345678",
    "shipping_address": "Dirección",
    "shipping_city": "Ciudad",
    "discount_code": "VERANO20",
    "discount_amount": 3000
}
```

#### GET /transactions/my
Obtener mis pedidos.

#### GET /transactions/:orderId
Obtener pedido por ID.

### Pagos (Webpay)

#### POST /webpay/create
Iniciar pago.

```json
{
    "order_id": "ORD-ABC123"
}
```

**Respuesta:**
```json
{
    "url": "https://webpay.transbank.cl/...",
    "token": "token_ws"
}
```

#### POST /webpay/commit
Confirmar pago.

```json
{
    "token_ws": "token_recibido",
    "order_id": "ORD-ABC123"
}
```

---

## Endpoints Admin (Requieren Token + Admin)

### Pedidos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /admin/orders | Listar todos los pedidos |
| PATCH | /admin/orders/:orderId/status | Actualizar estado |
| DELETE | /admin/orders/:orderId | Eliminar pedido |

### Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /admin/products | Listar productos |
| POST | /admin/products | Crear producto |
| PATCH | /admin/products/:id | Actualizar producto |
| DELETE | /admin/products/:id | Eliminar producto |
| POST | /admin/upload | Subir imagen |

### Avisos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /admin/notices | Listar avisos |
| POST | /admin/notices | Crear aviso |
| PATCH | /admin/notices/:id | Actualizar aviso |
| DELETE | /admin/notices/:id | Eliminar aviso |

### Códigos de Descuento

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /admin/discount-codes | Listar códigos |
| POST | /admin/discount-codes | Crear código |
| PATCH | /admin/discount-codes/:code | Actualizar código |
| DELETE | /admin/discount-codes/:code | Eliminar código |

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token requerido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Internal Error - Error del servidor |

## Health Check

```
GET /health
GET /api/health
```

Respuesta: `{ "ok": true, "service": "backend" }`
