const express = require('express');
const router = express.Router();
const multer = require('multer');

const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const productController = require('../controllers/productController');
const transactionController = require('../controllers/transactionController');
const noticeController = require('../controllers/noticeController');
const discountCodeController = require('../controllers/discountCodeController');
const settingsController = require('../controllers/settingsController');

// Optional controllers - will be created as needed
let categoryController, variantController, bulkController, importExportController;
let alertController, inventoryHistoryController, supplierController;

try {
    categoryController = require('../controllers/categoryController');
} catch (e) { categoryController = null; }

try {
    variantController = require('../controllers/variantController');
} catch (e) { variantController = null; }

try {
    bulkController = require('../controllers/bulkController');
} catch (e) { bulkController = null; }

try {
    importExportController = require('../controllers/importExportController');
} catch (e) { importExportController = null; }

try {
    alertController = require('../controllers/alertController');
} catch (e) { alertController = null; }

try {
    inventoryHistoryController = require('../controllers/inventoryHistoryController');
} catch (e) { inventoryHistoryController = null; }

try {
    supplierController = require('../controllers/supplierController');
} catch (e) { supplierController = null; }

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Middleware
router.use(verifyToken);
router.use(requireAdmin);

// Helper for optional routes
const optionalRoute = (controller, method) => {
    return (req, res) => {
        if (controller && controller[method]) {
            return controller[method](req, res);
        }
        res.status(501).json({ 
            error: 'Funcionalidad no implementada',
            message: 'Este endpoint estará disponible próximamente'
        });
    };
};

// ==========================================
// DASHBOARD STATS
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        // TODO: Implement actual stats from database
        res.json({
            ventas: { total: 0, change: 0 },
            productos: { total: 0, activos: 0 },
            usuarios: { total: 0, nuevos: 0 },
            pedidos: { pendientes: 0, hoy: 0 }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ==========================================
// ORDERS
// ==========================================
router.get('/orders', transactionController.getAllOrders);
router.patch('/orders/:orderId/status', transactionController.adminUpdateOrderStatus);
router.delete('/orders/:orderId', transactionController.deleteOrder);

// ==========================================
// PRODUCTS
// ==========================================
router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.patch('/products/:productId', productController.updateProduct);
router.delete('/products/:productId', productController.deleteProduct);
router.post('/upload', upload.single('image'), productController.uploadImage);

router.get('/home-featured-products', productController.getHomeFeaturedProductIds);
router.put('/home-featured-products', productController.setHomeFeaturedProducts);

router.get('/catalog-product-order', productController.getCatalogProductOrder);
router.put('/catalog-product-order', productController.setCatalogProductOrder);

// ==========================================
// CATEGORIES
// ==========================================
router.get('/categories', optionalRoute(categoryController, 'getCategories'));
router.post('/categories', optionalRoute(categoryController, 'createCategory'));
router.patch('/categories/:id', optionalRoute(categoryController, 'updateCategory'));
router.delete('/categories/:id', optionalRoute(categoryController, 'deleteCategory'));
router.put('/categories/reorder', optionalRoute(categoryController, 'reorderCategories'));

// ==========================================
// PRODUCT VARIANTS
// ==========================================
router.get('/products/:productId/variants', optionalRoute(variantController, 'getVariants'));
router.post('/products/:productId/variants', optionalRoute(variantController, 'createVariant'));
router.patch('/products/:productId/variants/:variantId', optionalRoute(variantController, 'updateVariant'));
router.delete('/products/:productId/variants/:variantId', optionalRoute(variantController, 'deleteVariant'));

// ==========================================
// BULK OPERATIONS
// ==========================================
router.post('/products/bulk-update', optionalRoute(bulkController, 'bulkUpdateProducts'));
router.post('/products/bulk-delete', optionalRoute(bulkController, 'bulkDeleteProducts'));
router.post('/products/bulk-create', optionalRoute(bulkController, 'bulkCreateProducts'));

// ==========================================
// IMPORT/EXPORT
// ==========================================
router.get('/products/export', optionalRoute(importExportController, 'exportProducts'));
router.post('/products/import', upload.single('file'), optionalRoute(importExportController, 'importProducts'));
router.get('/products/import-template', optionalRoute(importExportController, 'getImportTemplate'));

// ==========================================
// STOCK ALERTS
// ==========================================
router.get('/alerts', optionalRoute(alertController, 'getAlerts'));
router.patch('/alerts/:id/dismiss', optionalRoute(alertController, 'dismissAlert'));
router.put('/settings/stock-threshold', optionalRoute(alertController, 'updateStockThreshold'));
router.post('/products/:productId/restock', optionalRoute(alertController, 'restockProduct'));

// ==========================================
// INVENTORY HISTORY
// ==========================================
router.get('/inventory-history', optionalRoute(inventoryHistoryController, 'getHistory'));
router.post('/inventory-history', optionalRoute(inventoryHistoryController, 'createMovement'));

// ==========================================
// SUPPLIERS
// ==========================================
router.get('/suppliers', optionalRoute(supplierController, 'getSuppliers'));
router.post('/suppliers', optionalRoute(supplierController, 'createSupplier'));
router.patch('/suppliers/:id', optionalRoute(supplierController, 'updateSupplier'));
router.delete('/suppliers/:id', optionalRoute(supplierController, 'deleteSupplier'));

// ==========================================
// NOTICES
// ==========================================
router.get('/notices', noticeController.listNotices);
router.post('/notices', noticeController.createNotice);
router.patch('/notices/:noticeId', noticeController.updateNotice);
router.delete('/notices/:noticeId', noticeController.deleteNotice);

// ==========================================
// DISCOUNT CODES
// ==========================================
router.get('/discount-codes', discountCodeController.listCodes);
router.post('/discount-codes', discountCodeController.createCode);
router.patch('/discount-codes/:code', discountCodeController.updateCode);
router.delete('/discount-codes/:code', discountCodeController.deleteCode);

// ==========================================
// STORE SETTINGS
// ==========================================
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);

module.exports = router;
