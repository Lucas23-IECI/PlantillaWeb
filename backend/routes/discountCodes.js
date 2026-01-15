const express = require('express');
const router = express.Router();
const discountCodeController = require('../controllers/discountCodeController');
router.get('/validate', discountCodeController.validateCode);

module.exports = router;
