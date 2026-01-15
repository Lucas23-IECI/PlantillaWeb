const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/firebaseAdmin');
const { sendPasswordResetEmail } = require('../config/email');

const USERS_COLLECTION = 'users';

async function register(req, res) {
    try {
        const { email, name, password, phone = '', address = '', city = '' } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({ error: 'Email, nombre y contraseña son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const db = getDb();
        const emailLower = email.toLowerCase().trim();
        const existingUser = await db.collection(USERS_COLLECTION)
            .where('email', '==', emailLower)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            return res.status(400).json({ error: 'Este email ya está registrado' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            email: emailLower,
            name: name.trim(),
            password: hashedPassword,
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            admin: false,
            createdAt: new Date()
        };

        const docRef = await db.collection(USERS_COLLECTION).add(userData);
        const token = jwt.sign(
            { uid: docRef.id, email: emailLower, admin: false },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: docRef.id,
                email: emailLower,
                name: userData.name,
                admin: false
            }
        });
    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const db = getDb();
        const emailLower = email.toLowerCase().trim();
        const snapshot = await db.collection(USERS_COLLECTION)
            .where('email', '==', emailLower)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign(
            { uid: userDoc.id, email: emailLower, admin: !!userData.admin },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: userDoc.id,
                email: emailLower,
                name: userData.name,
                admin: !!userData.admin
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
}

async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        const db = getDb();
        const emailLower = email.toLowerCase().trim();
        const snapshot = await db.collection(USERS_COLLECTION)
            .where('email', '==', emailLower)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
        }

        const userDoc = snapshot.docs[0];
        const resetToken = jwt.sign(
            { uid: userDoc.id, email: emailLower, type: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        await db.collection(USERS_COLLECTION).doc(userDoc.id).update({
            resetToken,
            resetTokenExpires: new Date(Date.now() + 3600000) // 1 hora
        });
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/pages/reset-password.html?token=${resetToken}`;

        try {
            await sendPasswordResetEmail(emailLower, resetUrl);
        } catch (emailError) {
            console.warn('Error enviando email de reset:', emailError.message);
        }

        res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
    } catch (error) {
        console.error('Error en requestPasswordReset:', error);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
}

async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        const db = getDb();
        const userDoc = await db.collection(USERS_COLLECTION).doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userData = userDoc.data();
        const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.collection(USERS_COLLECTION).doc(req.user.uid).update({
            password: hashedPassword,
            updatedAt: new Date()
        });
        const token = jwt.sign(
            { uid: req.user.uid, email: req.user.email, admin: req.user.admin },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({ message: 'Contraseña actualizada exitosamente', token });
    } catch (error) {
        console.error('Error en changePassword:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
}

module.exports = {
    register,
    login,
    requestPasswordReset,
    changePassword
};
