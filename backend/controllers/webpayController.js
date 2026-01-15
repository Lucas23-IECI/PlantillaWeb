const { getDb } = require('../config/firebaseAdmin');
const { createTransaction, commitTransaction } = require('../config/transbank');
const { sendOrderConfirmation, sendOrderNotification } = require('../config/email');

const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Crear pago Webpay
 */
async function createPayment(req, res) {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ error: 'order_id es requerido' });
        }

        const db = getDb();

        // Buscar transacción
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', order_id)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const transactionDoc = snapshot.docs[0];
        const transactionData = transactionDoc.data();

        // Verificar que no esté ya pagado
        if (transactionData.status === 'completed') {
            return res.status(400).json({ error: 'Este pedido ya fue pagado' });
        }

        const amount = transactionData.amount || transactionData.total_amount;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Monto inválido' });
        }

        // URL de retorno
        const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const returnUrl = `${backendUrl}/api/webpay/return`;

        // Generar sessionId único
        const sessionId = `SID-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Crear transacción en Webpay
        const webpayResponse = await createTransaction(order_id, sessionId, Math.round(amount), returnUrl);

        // Guardar token en la transacción
        await db.collection(TRANSACTIONS_COLLECTION).doc(transactionDoc.id).update({
            webpay_token: webpayResponse.token,
            webpay_session_id: sessionId,
            updatedAt: new Date()
        });

        res.json({
            url: webpayResponse.url,
            token: webpayResponse.token
        });
    } catch (error) {
        console.error('Error en createPayment:', error);
        res.status(500).json({ error: 'Error al crear pago' });
    }
}

/**
 * Manejar retorno de Webpay
 */
async function handleReturn(req, res) {
    try {
        const token = req.body.token_ws || req.query.token_ws;
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';

        if (!token) {
            // Usuario canceló el pago
            return res.redirect(`${frontendUrl}/pages/resultado-pago.html?status=cancelled`);
        }

        // Redirigir al frontend con el token para confirmar
        res.redirect(`${frontendUrl}/pages/resultado-pago.html?token_ws=${token}`);
    } catch (error) {
        console.error('Error en handleReturn:', error);
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/pages/resultado-pago.html?status=error`);
    }
}

/**
 * Confirmar pago
 */
async function commitPayment(req, res) {
    try {
        const { token_ws, order_id } = req.body;

        if (!token_ws) {
            return res.status(400).json({ error: 'Token es requerido' });
        }

        const db = getDb();

        // Buscar transacción por token o order_id
        let snapshot;
        if (order_id) {
            snapshot = await db.collection(TRANSACTIONS_COLLECTION)
                .where('order_id', '==', order_id)
                .limit(1)
                .get();
        } else {
            snapshot = await db.collection(TRANSACTIONS_COLLECTION)
                .where('webpay_token', '==', token_ws)
                .limit(1)
                .get();
        }

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const transactionDoc = snapshot.docs[0];
        const transactionData = transactionDoc.data();

        // Verificar que no esté ya procesado (idempotencia)
        if (transactionData.status === 'completed') {
            return res.json({
                success: true,
                message: 'Pago ya fue procesado anteriormente',
                order_id: transactionData.order_id,
                ...transactionData.webpay_result
            });
        }

        // Confirmar con Webpay
        const result = await commitTransaction(token_ws);

        // Verificar respuesta
        const isApproved = result.response_code === 0;

        // Actualizar transacción
        const updateData = {
            status: isApproved ? 'completed' : 'failed',
            webpay_result: {
                vci: result.vci,
                amount: result.amount,
                status: result.status,
                buy_order: result.buy_order,
                session_id: result.session_id,
                card_detail: result.card_detail,
                accounting_date: result.accounting_date,
                transaction_date: result.transaction_date,
                authorization_code: result.authorization_code,
                payment_type_code: result.payment_type_code,
                response_code: result.response_code,
                installments_amount: result.installments_amount,
                installments_number: result.installments_number
            },
            paidAt: isApproved ? new Date() : null,
            updatedAt: new Date()
        };

        await db.collection(TRANSACTIONS_COLLECTION).doc(transactionDoc.id).update(updateData);

        // Si el pago fue exitoso, enviar emails
        if (isApproved) {
            const fullTransaction = { ...transactionData, ...updateData };

            // Email al cliente
            if (transactionData.customer_email) {
                try {
                    await sendOrderConfirmation(fullTransaction, transactionData.customer_email);
                } catch (emailError) {
                    console.warn('Error enviando confirmación:', emailError.message);
                }
            }

            // Email a la tienda
            try {
                await sendOrderNotification(fullTransaction);
            } catch (emailError) {
                console.warn('Error enviando notificación:', emailError.message);
            }
        }

        res.json({
            success: isApproved,
            message: isApproved ? 'Pago exitoso' : 'Pago rechazado',
            order_id: transactionData.order_id,
            ...updateData.webpay_result
        });
    } catch (error) {
        console.error('Error en commitPayment:', error);
        res.status(500).json({ error: 'Error al confirmar pago' });
    }
}

module.exports = {
    createPayment,
    handleReturn,
    commitPayment
};
