const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/auth');
router.post('/', verifyToken, transactionController.createTransaction);
router.get('/my', verifyToken, transactionController.getMyTransactions);
router.get('/:orderId', verifyToken, transactionController.getTransaction);
router.patch('/:orderId/status', verifyToken, transactionController.updateTransactionStatus);

module.exports = router;
