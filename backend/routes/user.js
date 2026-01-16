const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All routes require authentication
router.use(verifyToken);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Address routes
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

module.exports = router;
