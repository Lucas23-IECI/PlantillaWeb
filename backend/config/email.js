const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

async function sendEmail({ to, subject, html }) {
    if (!resend) {
        console.warn('⚠️ Email no enviado: RESEND_API_KEY no configurada');
        return null;
    }

    const from = process.env.MAIL_FROM || 'Tu Tienda <noreply@tudominio.com>';
    const replyTo = process.env.MAIL_REPLY_TO;

    try {
        const result = await resend.emails.send({
            from,
            to,
            subject,
            html,
            ...(replyTo ? { reply_to: replyTo } : {})
        });
        return result;
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        throw error;
    }
}

async function sendOrderConfirmation(order, customerEmail) {
    const subject = `Confirmación de pedido #${order.order_id}`;
    const html = `
        <h1>¡Gracias por tu compra!</h1>
        <p>Tu pedido <strong>#${order.order_id}</strong> ha sido confirmado.</p>
        <p><strong>Total:</strong> $${order.amount?.toLocaleString('es-CL') || order.total_amount?.toLocaleString('es-CL')}</p>
        <p>Te contactaremos pronto para coordinar la entrega.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            Si tienes alguna pregunta, responde a este correo o contáctanos por WhatsApp.
        </p>
    `;

    return sendEmail({ to: customerEmail, subject, html });
}

async function sendOrderNotification(order) {
    const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.MAIL_REPLY_TO;
    if (!notificationEmail) return null;

    const subject = `🛒 Nuevo pedido #${order.order_id}`;
    const html = `
        <h1>Nuevo pedido recibido</h1>
        <p><strong>Orden:</strong> #${order.order_id}</p>
        <p><strong>Cliente:</strong> ${order.customer_name || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
        <p><strong>Total:</strong> $${order.amount?.toLocaleString('es-CL') || order.total_amount?.toLocaleString('es-CL')}</p>
        <p><strong>Estado:</strong> ${order.status}</p>
        <hr>
        <p>Revisa el panel de administración para más detalles.</p>
    `;

    return sendEmail({ to: notificationEmail, subject, html });
}

async function sendPasswordResetEmail(email, resetUrl) {
    const subject = 'Recuperar contraseña';
    const html = `
        <h1>Recuperar contraseña</h1>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}" style="color: #0066cc;">${resetUrl}</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
    `;

    return sendEmail({ to: email, subject, html });
}

module.exports = {
    resend,
    sendEmail,
    sendOrderConfirmation,
    sendOrderNotification,
    sendPasswordResetEmail
};
