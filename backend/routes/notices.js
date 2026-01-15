const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
router.get('/active', noticeController.getActiveNotices);

module.exports = router;
