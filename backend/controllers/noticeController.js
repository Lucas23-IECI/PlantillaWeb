const { getDb } = require('../config/firebaseAdmin');

const NOTICES_COLLECTION = 'notices';

async function getActiveNotices(req, res) {
    try {
        const db = getDb();
        const now = new Date();

        const snapshot = await db.collection(NOTICES_COLLECTION)
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        const notices = snapshot.docs
            .map(doc => ({
                notice_id: doc.id,
                ...doc.data()
            }))
            .filter(notice => {
                if (notice.start_date && new Date(notice.start_date) > now) return false;
                if (notice.end_date && new Date(notice.end_date) < now) return false;
                return true;
            });

        res.json(notices);
    } catch (error) {
        console.error('Error en getActiveNotices:', error);
        res.status(500).json({ error: 'Error al obtener avisos' });
    }
}

async function listNotices(req, res) {
    try {
        const db = getDb();
        const snapshot = await db.collection(NOTICES_COLLECTION)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const notices = snapshot.docs.map(doc => ({
            notice_id: doc.id,
            ...doc.data()
        }));

        res.json({ notices });
    } catch (error) {
        console.error('Error en listNotices:', error);
        res.status(500).json({ error: 'Error al obtener avisos' });
    }
}

async function createNotice(req, res) {
    try {
        const { message, active = true, start_date, end_date } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensaje es requerido' });
        }

        const db = getDb();
        const noticeData = {
            message: message.trim(),
            active: !!active,
            start_date: start_date || null,
            end_date: end_date || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(NOTICES_COLLECTION).add(noticeData);

        res.status(201).json({
            message: 'Aviso creado exitosamente',
            notice_id: docRef.id,
            ...noticeData
        });
    } catch (error) {
        console.error('Error en createNotice:', error);
        res.status(500).json({ error: 'Error al crear aviso' });
    }
}

async function updateNotice(req, res) {
    try {
        const { noticeId } = req.params;
        const updates = req.body;

        const db = getDb();
        const docRef = db.collection(NOTICES_COLLECTION).doc(noticeId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Aviso no encontrado' });
        }

        const allowedFields = ['message', 'active', 'start_date', 'end_date'];
        const filteredUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        filteredUpdates.updatedAt = new Date();

        await docRef.update(filteredUpdates);

        res.json({ message: 'Aviso actualizado exitosamente' });
    } catch (error) {
        console.error('Error en updateNotice:', error);
        res.status(500).json({ error: 'Error al actualizar aviso' });
    }
}

async function deleteNotice(req, res) {
    try {
        const { noticeId } = req.params;
        const db = getDb();

        const docRef = db.collection(NOTICES_COLLECTION).doc(noticeId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Aviso no encontrado' });
        }

        await docRef.delete();

        res.json({ message: 'Aviso eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteNotice:', error);
        res.status(500).json({ error: 'Error al eliminar aviso' });
    }
}

module.exports = {
    getActiveNotices,
    listNotices,
    createNotice,
    updateNotice,
    deleteNotice
};
