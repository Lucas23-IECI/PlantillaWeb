const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 * Agrega req.user con los datos del token decodificado
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(403).json({ error: 'Token inválido' });
    }
}

/**
 * Middleware opcional - verifica token si existe, pero no bloquea
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch {
            // Token inválido, pero no bloqueamos
            req.user = null;
        }
    }

    next();
}

module.exports = { verifyToken, optionalAuth };
