const express = require('express');
const router = express.Router();
const multer = require('multer');

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const productController = require('../controllers/productController');
const transactionController = require('../controllers/transactionController');
const noticeController = require('../controllers/noticeController');
const discountCodeController = require('../controllers/discountCodeController');

// Configurar multer para uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Aplicar autenticación y admin a todas las rutas
router.use(verifyToken);
router.use(requireAdmin);

// =============================================
// PEDIDOS
// =============================================
router.get('/orders', transactionController.getAllOrders);
router.patch('/orders/:orderId/status', transactionController.adminUpdateOrderStatus);
router.delete('/orders/:orderId', transactionController.deleteOrder);

// =============================================
// PRODUCTOS
// =============================================
router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.patch('/products/:productId', productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);
router.post('/upload', upload.single('image'), productController.uploadImage);

// Productos destacados home
router.get('/home-featured-products', productController.getHomeFeaturedProductIds);
router.put('/home-featured-products', productController.setHomeFeaturedProducts);

// Orden del catálogo
router.get('/catalog-product-order', productController.getCatalogProductOrder);
router.put('/catalog-product-order', productController.setCatalogProductOrder);

// =============================================
// AVISOS
// =============================================
router.get('/notices', noticeController.listNotices);
router.post('/notices', noticeController.createNotice);
router.patch('/notices/:noticeId', noticeController.updateNotice);
router.delete('/notices/:noticeId', noticeController.deleteNotice);

// =============================================
// CÓDIGOS DE DESCUENTO
// =============================================
router.get('/discount-codes', discountCodeController.listCodes);
router.post('/discount-codes', discountCodeController.createCode);
router.patch('/discount-codes/:code', discountCodeController.updateCode);
router.delete('/discount-codes/:code', discountCodeController.deleteCode);

module.exports = router;
