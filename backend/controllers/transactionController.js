const { getDb } = require('../config/firebaseAdmin');

const TRANSACTIONS_COLLECTION = 'transactions';

async function createTransaction(req, res) {
    try {
        const {
            items,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            shipping_city,
            notes,
            discount_code,
            discount_amount = 0
        } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ error: 'Items del pedido son requeridos' });
        }
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total_amount = Math.max(0, subtotal - discount_amount);
        const ts = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 8);
        const order_id = `ORD-${ts}-${rand}`.toUpperCase();

        const db = getDb();
        const transactionData = {
            order_id,
            user_id: req.user.uid,
            items,
            customer_name: customer_name || '',
            customer_email: customer_email || req.user.email,
            customer_phone: customer_phone || '',
            shipping_address: shipping_address || '',
            shipping_city: shipping_city || '',
            notes: notes || '',
            discount_code: discount_code || null,
            discount_amount,
            subtotal,
            total_amount,
            amount: total_amount, // Alias para compatibilidad
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(transactionData);

        res.status(201).json({
            message: 'Pedido creado exitosamente',
            transaction_id: docRef.id,
            order_id,
            ...transactionData
        });
    } catch (error) {
        console.error('Error en createTransaction:', error);
        res.status(500).json({ error: 'Error al crear pedido' });
    }
}

async function getTransaction(req, res) {
    try {
        const { orderId } = req.params;
        const db = getDb();

        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', orderId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        if (data.user_id !== req.user.uid && !req.user.admin) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        res.json({
            transaction_id: doc.id,
            ...data
        });
    } catch (error) {
        console.error('Error en getTransaction:', error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
}

async function getMyTransactions(req, res) {
    try {
        const db = getDb();
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('user_id', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const transactions = snapshot.docs.map(doc => ({
            transaction_id: doc.id,
            ...doc.data()
        }));

        res.json({ transactions });
    } catch (error) {
        console.error('Error en getMyTransactions:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
}

async function updateTransactionStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const db = getDb();
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', orderId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const doc = snapshot.docs[0];

        await db.collection(TRANSACTIONS_COLLECTION).doc(doc.id).update({
            status,
            updatedAt: new Date()
        });

        res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
        console.error('Error en updateTransactionStatus:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
}

async function getAllOrders(req, res) {
    try {
        const db = getDb();
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const orders = snapshot.docs.map(doc => ({
            transaction_id: doc.id,
            ...doc.data()
        }));

        res.json({ orders });
    } catch (error) {
        console.error('Error en getAllOrders:', error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
}

async function adminUpdateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const db = getDb();
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', orderId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const doc = snapshot.docs[0];

        await db.collection(TRANSACTIONS_COLLECTION).doc(doc.id).update({
            status,
            updatedAt: new Date()
        });

        res.json({ message: 'Estado actualizado exitosamente' });
    } catch (error) {
        console.error('Error en adminUpdateOrderStatus:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
}

async function deleteOrder(req, res) {
    try {
        const { orderId } = req.params;
        const db = getDb();

        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', orderId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        await db.collection(TRANSACTIONS_COLLECTION).doc(snapshot.docs[0].id).delete();

        res.json({ message: 'Pedido eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteOrder:', error);
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
}

module.exports = {
    createTransaction,
    getTransaction,
    getMyTransactions,
    updateTransactionStatus,
    getAllOrders,
    adminUpdateOrderStatus,
    deleteOrder
};
