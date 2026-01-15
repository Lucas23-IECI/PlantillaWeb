const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');
router.post('/create', webpayController.createPayment);
router.post('/return', webpayController.handleReturn);
router.post('/commit', webpayController.commitPayment);

module.exports = router;
