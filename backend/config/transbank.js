const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');

/**
 * Obtiene la configuración de Transbank según el ambiente
 */
function getTransbankConfig() {
    const env = process.env.TRANSBANK_ENV || 'integration';

    if (env === 'production') {
        // Producción
        return {
            commerceCode: process.env.TBK_API_KEY_ID,
            apiKey: process.env.TBK_API_KEY_SECRET,
            environment: Environment.Production
        };
    }

    // Integración (testing)
    return {
        commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
        apiKey: IntegrationApiKeys.WEBPAY,
        environment: Environment.Integration
    };
}

/**
 * Crea una nueva instancia de WebpayPlus.Transaction
 */
function getWebpayTransaction() {
    const config = getTransbankConfig();
    const options = new Options(config.commerceCode, config.apiKey, config.environment);
    return new WebpayPlus.Transaction(options);
}

/**
 * Crea una transacción de pago
 * @param {string} buyOrder - Orden de compra (único)
 * @param {string} sessionId - ID de sesión
 * @param {number} amount - Monto en CLP
 * @param {string} returnUrl - URL de retorno
 */
async function createTransaction(buyOrder, sessionId, amount, returnUrl) {
    const tx = getWebpayTransaction();
    return tx.create(buyOrder, sessionId, amount, returnUrl);
}

/**
 * Confirma una transacción
 * @param {string} token - Token de la transacción
 */
async function commitTransaction(token) {
    const tx = getWebpayTransaction();
    return tx.commit(token);
}

/**
 * Obtiene el estado de una transacción
 * @param {string} token - Token de la transacción
 */
async function getTransactionStatus(token) {
    const tx = getWebpayTransaction();
    return tx.status(token);
}

module.exports = {
    getTransbankConfig,
    getWebpayTransaction,
    createTransaction,
    commitTransaction,
    getTransactionStatus
};
