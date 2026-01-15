const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

// Crear transacción de pago
router.post('/create', webpayController.createPayment);

// Retorno desde Webpay
router.post('/return', webpayController.handleReturn);

// Confirmar pago
router.post('/commit', webpayController.commitPayment);

module.exports = router;
