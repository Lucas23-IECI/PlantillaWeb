/**
 * ⚠️ SERVIDOR MOCK - Solo para desarrollo sin Firebase/Transbank
 * 
 * Este servidor simula todas las APIs incluyendo Webpay (mock local).
 * NO conecta con el Webpay real de Transbank.
 * 
 * Usar:
 *   npm run mock     → Inicia este servidor mock
 *   npm run dev      → Inicia server.js con Webpay REAL de Transbank
 * 
 * Para pagos reales, usa server.js (npm run dev o npm start)
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para form data de Webpay

const users = [{
    id: 'user_1',
    email: 'admin@test.com',
    password: 'password',
    name: 'Admin Test',
    admin: true
}];
const products = [
    {
        product_id: 'prod_1',
        name: 'MacBook Pro 14"',
        brand: 'Apple',
        price: 1899000,
        original_price: 2199000,
        discount: 14,
        description: 'MacBook Pro con chip M3 Pro, 18GB RAM y 512GB SSD. Pantalla Liquid Retina XDR de 14.2 pulgadas.',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop'
        ],
        stock: 10,
        rating: 4.9,
        reviews: 287,
        category: 'Electrónica'
    },
    {
        product_id: 'prod_2',
        name: 'iPhone 15 Pro Max',
        brand: 'Apple',
        price: 1499000,
        original_price: 1699000,
        discount: 12,
        description: 'iPhone 15 Pro Max con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR de 6.7".',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&h=800&fit=crop'
        ],
        stock: 15,
        rating: 4.8,
        reviews: 523,
        category: 'Electrónica'
    },
    {
        product_id: 'prod_3',
        name: 'Camiseta Algodón Premium',
        brand: 'UrbanStyle',
        price: 25000,
        original_price: 35000,
        discount: 29,
        description: 'Camiseta 100% algodón orgánico certificado. Disponible en 8 colores. Corte regular fit.',
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1618354691551-44de113f0164?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop'
        ],
        stock: 50,
        rating: 4.5,
        reviews: 156,
        category: 'Ropa'
    },
    {
        product_id: 'prod_4',
        name: 'Nike Air Max 270',
        brand: 'Nike',
        price: 119000,
        original_price: 159000,
        discount: 25,
        description: 'Zapatillas con la unidad Air más grande jamás creada. Amortiguación revolucionaria.',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'
        ],
        stock: 8,
        rating: 4.8,
        reviews: 423,
        category: 'Deportes'
    },
    {
        product_id: 'prod_5',
        name: 'Sony WH-1000XM5',
        brand: 'Sony',
        price: 289000,
        original_price: 350000,
        discount: 17,
        description: 'Audífonos inalámbricos con la mejor cancelación de ruido del mercado. 30 horas de batería.',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop'
        ],
        stock: 30,
        rating: 4.9,
        reviews: 512,
        category: 'Electrónica'
    },
    {
        product_id: 'prod_6',
        name: "Jeans Levi's 501",
        brand: "Levi's",
        price: 59000,
        original_price: 79000,
        discount: 25,
        description: 'El jeans original desde 1873. Corte recto clásico, 100% algodón.',
        image_url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&h=800&fit=crop'
        ],
        stock: 25,
        rating: 4.6,
        reviews: 234,
        category: 'Ropa'
    },
    {
        product_id: 'prod_7',
        name: 'Lámpara LED Moderna',
        brand: 'LumiHome',
        price: 45000,
        description: 'Lámpara de mesa con luz LED regulable en 3 tonos. Diseño minimalista escandinavo.',
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop'
        ],
        stock: 15,
        rating: 4.3,
        reviews: 89,
        category: 'Hogar'
    },
    {
        product_id: 'prod_8',
        name: 'Samsung Galaxy S24 Ultra',
        brand: 'Samsung',
        price: 1299000,
        original_price: 1499000,
        discount: 13,
        description: 'Smartphone con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED 2X.',
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=800&fit=crop'
        ],
        stock: 12,
        rating: 4.7,
        reviews: 345,
        category: 'Electrónica'
    },
    {
        product_id: 'prod_9',
        name: 'Apple Watch Ultra 2',
        brand: 'Apple',
        price: 799000,
        description: 'El Apple Watch más resistente. GPS + Cellular, caja de titanio de 49mm.',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop'
        ],
        stock: 20,
        rating: 4.8,
        reviews: 198,
        category: 'Accesorios'
    },
    {
        product_id: 'prod_10',
        name: 'Mochila Patagonia 28L',
        brand: 'Patagonia',
        price: 89000,
        description: 'Mochila resistente al agua con múltiples compartimentos. Materiales reciclados.',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=800&fit=crop'
        ],
        stock: 18,
        rating: 4.6,
        reviews: 167,
        category: 'Accesorios'
    },
    {
        product_id: 'prod_11',
        name: 'Polera Running Adidas',
        brand: 'Adidas',
        price: 35000,
        original_price: 45000,
        discount: 22,
        description: 'Polera deportiva con tecnología Climalite para máxima transpirabilidad.',
        image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop'
        ],
        stock: 40,
        rating: 4.4,
        reviews: 112,
        category: 'Deportes'
    },
    {
        product_id: 'prod_12',
        name: 'Smart TV LG 55" OLED',
        brand: 'LG',
        price: 1299000,
        original_price: 1599000,
        discount: 19,
        description: 'TV OLED 4K con procesador α9 AI, Dolby Vision y webOS 24.',
        image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=800&h=800&fit=crop'
        ],
        stock: 5,
        rating: 4.9,
        reviews: 278,
        category: 'Electrónica'
    },
    {
        product_id: 'prod_13',
        name: 'Silla Gamer ProX',
        brand: 'SecretLab',
        price: 249000,
        description: 'Silla ergonómica para gaming con soporte lumbar ajustable y reposabrazos 4D.',
        image_url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=800&h=800&fit=crop'
        ],
        stock: 7,
        rating: 4.7,
        reviews: 203,
        category: 'Hogar'
    },
    {
        product_id: 'prod_14',
        name: 'Converse Chuck Taylor',
        brand: 'Converse',
        price: 69000,
        description: 'El clásico que nunca pasa de moda. Canvas premium, suela de goma vulcanizada.',
        image_url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1494496195158-c3becb4f2475?w=800&h=800&fit=crop'
        ],
        stock: 35,
        rating: 4.5,
        reviews: 456,
        category: 'Deportes'
    },
    {
        product_id: 'prod_15',
        name: 'AirPods Pro 2',
        brand: 'Apple',
        price: 299000,
        original_price: 349000,
        discount: 14,
        description: 'Cancelación activa de ruido, audio espacial y hasta 6 horas de reproducción.',
        image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1588423771073-b8903fba77ac?w=800&h=800&fit=crop'
        ],
        stock: 25,
        rating: 4.8,
        reviews: 389,
        category: 'Electrónica'
    }
];
const orders = [];

function createMockToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64').replace(/=/g, '');
    const payload = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        admin: user.admin,
        exp: Math.floor(Date.now() / 1000) + 86400
    })).toString('base64').replace(/=/g, '');
    return `${header}.${payload}.mock_signature`;
}

app.use((req, res, next) => {
    setTimeout(next, 300);
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ token: createMockToken(user), user: { ...user, password: undefined } });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas (Mock: admin@test.com / password)' });
    }
});

app.post('/api/auth/register', (req, res) => {
    const newUser = { ...req.body, id: `user_${users.length + 1}`, admin: false };
    users.push(newUser);
    res.json({ token: createMockToken(newUser), user: newUser });
});

app.get('/api/products', (req, res) => res.json(products));
app.get('/api/products/home-featured', (req, res) => res.json(products.slice(0, 4)));
app.get('/api/products/:id', (req, res) => {
    const p = products.find(i => i.product_id === req.params.id);
    p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/transactions', (req, res) => {
    const order = { ...req.body, order_id: `ord_${Date.now()}`, status: 'pending', createdAt: new Date() };
    orders.push(order);
    res.json({ order_id: order.order_id });
});

app.post('/api/webpay/create', (req, res) => {

    res.json({ url: `http://localhost:5000/mock-webpay`, token: 'mock_token_ws_' + req.body.order_id });
});
app.post('/api/webpay/commit', (req, res) => {
    res.json({
        status: 'AUTHORIZED',
        amount: 10000,
        authorization_code: '123456',
        buy_order: req.body.order_id,
        card_detail: { card_number: '6623' }
    });
});

const webpayForm = (req, res) => {
    const token = req.query.token_ws || req.body.token_ws || 'mock_token_ws';
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Webpay Mock</title><link rel="stylesheet" href="http://localhost:8080/css/styles.css"></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f0f0f0;flex-direction:column;gap:20px;">
            <div style="background:white;padding:40px;border-radius:10px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color:#d0021b;">Webpay Plus <small>(MOCK)</small></h1>
                <p>Simulación de pago seguro</p>
                <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
                    <form action="http://localhost:8080/pages/resultado-pago.html" method="GET">
                        <input type="hidden" name="token_ws" value="${token}">
                        <button type="submit" style="background:#2ecc71;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-size:16px;">
                            ✅ Aprobar Pago
                        </button>
                    </form>
                    <form action="http://localhost:8080/pages/resultado-pago.html" method="GET">
                        <input type="hidden" name="TBK_TOKEN" value="${token}">
                        <input type="hidden" name="TBK_ORDEN_COMPRA" value="123">
                        <input type="hidden" name="TBK_ID_SESION" value="123">
                        <button type="submit" style="background:#e74c3c;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-size:16px;">
                            ❌ Anular Pago
                        </button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    `);
};
app.get('/mock-webpay', webpayForm);
app.post('/mock-webpay', webpayForm);

app.get('/api/notices/active', (req, res) => res.json([{ message: '📢 Envío gratis por compras sobre $50.000 (Mock)', active: true }]));

app.get('/api/discount-codes/validate', (req, res) => {
    const code = req.query.code;
    if (code === 'TEST') {
        res.json({ valid: true, code: 'TEST', discount_type: 'percentage', discount_value: 20, min_purchase: 0 });
    } else if (code === 'FIJO') {
        res.json({ valid: true, code: 'FIJO', discount_type: 'fixed', discount_value: 5000, min_purchase: 10000 });
    } else {
        res.status(404).json({ valid: false, error: 'Código no válido' });
    }
});

app.get('/api/admin/orders', (req, res) => res.json({ orders }));
app.get('/api/admin/products', (req, res) => res.json(products));
app.get('/api/admin/notices', (req, res) => res.json({ notices: [] }));
app.get('/api/admin/discount-codes', (req, res) => res.json({ codes: [] }));

app.listen(5000, () => {
    console.log('🎭 MOCK Server corriendo en http://localhost:5000');
});
