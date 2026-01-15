const express = require('express');
const router = express.Router();
const discountCodeController = require('../controllers/discountCodeController');

// Ruta pública - validar código
router.get('/validate', discountCodeController.validateCode);

module.exports = router;
