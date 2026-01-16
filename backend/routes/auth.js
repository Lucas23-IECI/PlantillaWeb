const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/password-reset', authController.requestPasswordReset); // Alias
router.post('/reset-password', authController.resetPassword);

router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
