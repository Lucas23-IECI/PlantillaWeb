const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// =============================================
// FIREBASE ADMIN INITIALIZATION
// =============================================
try {
    require('./config/firebaseAdmin').initFirebaseAdmin();
    console.log('✅ Firebase Admin inicializado');
} catch (e) {
    console.warn('⚠️ Firebase Admin no inicializado:', e.message);
}

// =============================================
// CORS CONFIGURATION
// =============================================
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = new Set(
    (corsOrigin ? corsOrigin.split(',') : [])
        .map(s => s.trim())
        .filter(Boolean)
);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (no Origin header)
        if (!origin) return callback(null, true);

        if (allowedOrigins.has(origin)) return callback(null, true);

        // Safe defaults for development and common deployments
        const isAllowedByPattern = [
            /^https?:\/\/localhost(?::\d+)?$/,
            /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
            /^https:\/\/.*\.vercel\.app$/,
            /^https:\/\/.*\.netlify\.app$/,
            /^https:\/\/.*\.onrender\.com$/
        ].some((re) => re.test(origin));

        if (isAllowedByPattern) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =============================================
// MIDDLEWARES
// =============================================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// =============================================
// API ROUTES
// =============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/webpay', require('./routes/webpay'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/discount-codes', require('./routes/discountCodes'));
app.use('/api/admin', require('./routes/admin'));

// =============================================
// HEALTH CHECKS
// =============================================
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'plantilla-backend' });
});

app.get('/api/health', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, service: 'backend', ts: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, service: 'backend', ts: new Date().toISOString() });
});

// =============================================
// ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
