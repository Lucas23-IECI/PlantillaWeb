const express = require('express');
const router = express.Router();
const multer = require('multer');

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const productController = require('../controllers/productController');
const transactionController = require('../controllers/transactionController');
const noticeController = require('../controllers/noticeController');
const discountCodeController = require('../controllers/discountCodeController');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
router.use(verifyToken);
router.use(requireAdmin);
router.get('/orders', transactionController.getAllOrders);
router.patch('/orders/:orderId/status', transactionController.adminUpdateOrderStatus);
router.delete('/orders/:orderId', transactionController.deleteOrder);
router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.patch('/products/:productId', productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);
router.post('/upload', upload.single('image'), productController.uploadImage);
router.get('/home-featured-products', productController.getHomeFeaturedProductIds);
router.put('/home-featured-products', productController.setHomeFeaturedProducts);
router.get('/catalog-product-order', productController.getCatalogProductOrder);
router.put('/catalog-product-order', productController.setCatalogProductOrder);
router.get('/notices', noticeController.listNotices);
router.post('/notices', noticeController.createNotice);
router.patch('/notices/:noticeId', noticeController.updateNotice);
router.delete('/notices/:noticeId', noticeController.deleteNotice);
router.get('/discount-codes', discountCodeController.listCodes);
router.post('/discount-codes', discountCodeController.createCode);
router.patch('/discount-codes/:code', discountCodeController.updateCode);
router.delete('/discount-codes/:code', discountCodeController.deleteCode);

module.exports = router;
