const { getDb } = require('../config/firebaseAdmin');
const { createTransaction, commitTransaction } = require('../config/transbank');
const { sendOrderConfirmation, sendOrderNotification } = require('../config/email');

const TRANSACTIONS_COLLECTION = 'transactions';

async function createPayment(req, res) {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ error: 'order_id es requerido' });
        }

        const db = getDb();
        const snapshot = await db.collection(TRANSACTIONS_COLLECTION)
            .where('order_id', '==', order_id)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const transactionDoc = snapshot.docs[0];
        const transactionData = transactionDoc.data();
        if (transactionData.status === 'completed') {
            return res.status(400).json({ error: 'Este pedido ya fue pagado' });
        }

        const amount = transactionData.amount || transactionData.total_amount;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Monto inválido' });
        }
        const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const returnUrl = `${backendUrl}/api/webpay/return`;
        const sessionId = `SID-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const webpayResponse = await createTransaction(order_id, sessionId, Math.round(amount), returnUrl);
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

async function handleReturn(req, res) {
    try {
        const token = req.body.token_ws || req.query.token_ws;
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';

        if (!token) {
            return res.redirect(`${frontendUrl}/pages/resultado-pago.html?status=cancelled`);
        }
        res.redirect(`${frontendUrl}/pages/resultado-pago.html?token_ws=${token}`);
    } catch (error) {
        console.error('Error en handleReturn:', error);
        const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/pages/resultado-pago.html?status=error`);
    }
}

async function commitPayment(req, res) {
    try {
        const { token_ws, order_id } = req.body;

        if (!token_ws) {
            return res.status(400).json({ error: 'Token es requerido' });
        }

        const db = getDb();
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
        if (transactionData.status === 'completed') {
            return res.json({
                success: true,
                message: 'Pago ya fue procesado anteriormente',
                order_id: transactionData.order_id,
                ...transactionData.webpay_result
            });
        }
        const result = await commitTransaction(token_ws);
        const isApproved = result.response_code === 0;
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
        if (isApproved) {
            const fullTransaction = { ...transactionData, ...updateData };
            if (transactionData.customer_email) {
                try {
                    await sendOrderConfirmation(fullTransaction, transactionData.customer_email);
                } catch (emailError) {
                    console.warn('Error enviando confirmación:', emailError.message);
                }
            }
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
