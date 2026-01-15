const { getDb } = require('../config/firebaseAdmin');

const DISCOUNT_CODES_COLLECTION = 'discount_codes';

async function validateCode(req, res) {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Código es requerido' });
        }

        const db = getDb();
        const codeUpper = code.toUpperCase().trim();

        const snapshot = await db.collection(DISCOUNT_CODES_COLLECTION)
            .where('code', '==', codeUpper)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Código no válido', valid: false });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        if (!data.active) {
            return res.status(400).json({ error: 'Código expirado', valid: false });
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Código expirado', valid: false });
        }
        if (data.max_uses && data.uses_count >= data.max_uses) {
            return res.status(400).json({ error: 'Código agotado', valid: false });
        }

        res.json({
            valid: true,
            code: data.code,
            discount_type: data.discount_type || 'percentage', // 'percentage' o 'fixed'
            discount_value: data.discount_value,
            min_purchase: data.min_purchase || 0
        });
    } catch (error) {
        console.error('Error en validateCode:', error);
        res.status(500).json({ error: 'Error al validar código' });
    }
}

async function listCodes(req, res) {
    try {
        const db = getDb();
        const snapshot = await db.collection(DISCOUNT_CODES_COLLECTION)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const codes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ codes });
    } catch (error) {
        console.error('Error en listCodes:', error);
        res.status(500).json({ error: 'Error al obtener códigos' });
    }
}

async function createCode(req, res) {
    try {
        const {
            code,
            discount_type = 'percentage',
            discount_value,
            min_purchase = 0,
            max_uses,
            expires_at,
            active = true
        } = req.body;

        if (!code || !discount_value) {
            return res.status(400).json({ error: 'Código y valor de descuento son requeridos' });
        }

        const db = getDb();
        const codeUpper = code.toUpperCase().trim();
        const existing = await db.collection(DISCOUNT_CODES_COLLECTION)
            .where('code', '==', codeUpper)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ error: 'Este código ya existe' });
        }

        const codeData = {
            code: codeUpper,
            discount_type,
            discount_value: Number(discount_value),
            min_purchase: Number(min_purchase),
            max_uses: max_uses ? Number(max_uses) : null,
            uses_count: 0,
            expires_at: expires_at || null,
            active: !!active,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(DISCOUNT_CODES_COLLECTION).add(codeData);

        res.status(201).json({
            message: 'Código creado exitosamente',
            id: docRef.id,
            ...codeData
        });
    } catch (error) {
        console.error('Error en createCode:', error);
        res.status(500).json({ error: 'Error al crear código' });
    }
}

async function updateCode(req, res) {
    try {
        const { code } = req.params;
        const updates = req.body;

        const db = getDb();
        const codeUpper = code.toUpperCase().trim();

        const snapshot = await db.collection(DISCOUNT_CODES_COLLECTION)
            .where('code', '==', codeUpper)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Código no encontrado' });
        }

        const doc = snapshot.docs[0];
        const allowedFields = ['discount_type', 'discount_value', 'min_purchase', 'max_uses', 'expires_at', 'active'];
        const filteredUpdates = {};

        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        filteredUpdates.updatedAt = new Date();

        await db.collection(DISCOUNT_CODES_COLLECTION).doc(doc.id).update(filteredUpdates);

        res.json({ message: 'Código actualizado exitosamente' });
    } catch (error) {
        console.error('Error en updateCode:', error);
        res.status(500).json({ error: 'Error al actualizar código' });
    }
}

async function deleteCode(req, res) {
    try {
        const { code } = req.params;
        const db = getDb();
        const codeUpper = code.toUpperCase().trim();

        const snapshot = await db.collection(DISCOUNT_CODES_COLLECTION)
            .where('code', '==', codeUpper)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Código no encontrado' });
        }

        await db.collection(DISCOUNT_CODES_COLLECTION).doc(snapshot.docs[0].id).delete();

        res.json({ message: 'Código eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteCode:', error);
        res.status(500).json({ error: 'Error al eliminar código' });
    }
}

module.exports = {
    validateCode,
    listCodes,
    createCode,
    updateCode,
    deleteCode
};
