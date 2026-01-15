const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = require('transbank-sdk');

function getTransbankConfig() {
    const env = process.env.TRANSBANK_ENV || 'integration';

    if (env === 'production') {
        return {
            commerceCode: process.env.TBK_API_KEY_ID,
            apiKey: process.env.TBK_API_KEY_SECRET,
            environment: Environment.Production
        };
    }
    return {
        commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
        apiKey: IntegrationApiKeys.WEBPAY,
        environment: Environment.Integration
    };
}

function getWebpayTransaction() {
    const config = getTransbankConfig();
    const options = new Options(config.commerceCode, config.apiKey, config.environment);
    return new WebpayPlus.Transaction(options);
}

async function createTransaction(buyOrder, sessionId, amount, returnUrl) {
    const tx = getWebpayTransaction();
    return tx.create(buyOrder, sessionId, amount, returnUrl);
}

async function commitTransaction(token) {
    const tx = getWebpayTransaction();
    return tx.commit(token);
}

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
