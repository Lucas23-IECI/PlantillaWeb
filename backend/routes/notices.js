const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// Ruta pública - obtener avisos activos
router.get('/active', noticeController.getActiveNotices);

module.exports = router;
