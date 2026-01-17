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
const imageController = require('../controllers/imageController');

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
        const { getDb } = require('../config/firebaseAdmin');
        const db = getDb();

        // Get products stats
        const productsSnapshot = await db.collection('products').get();
        const totalProducts = productsSnapshot.size;
        const activeProducts = productsSnapshot.docs.filter(doc => doc.data().active !== false).length;

        // Get orders stats
        const ordersSnapshot = await db.collection('transactions').get();
        const allOrders = ordersSnapshot.docs.map(doc => doc.data());
        const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

        // Calculate today's orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = allOrders.filter(o => {
            const createdAt = o.createdAt?.toDate?.() || new Date(o.createdAt);
            return createdAt >= today;
        }).length;

        // Calculate total sales from completed orders
        const completedOrders = allOrders.filter(o => o.status === 'completed');
        const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0);

        // Get users stats
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        // Calculate new users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newUsers = usersSnapshot.docs.filter(doc => {
            const createdAt = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
            return createdAt >= weekAgo;
        }).length;

        res.json({
            ventas: { total: totalSales, change: 0 },
            productos: { total: totalProducts, activos: activeProducts },
            usuarios: { total: totalUsers, nuevos: newUsers },
            pedidos: { pendientes: pendingOrders, hoy: todayOrders }
        });
    } catch (error) {
        console.error('Error en getAdminStats:', error);
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
router.get('/products', productController.getAdminProducts);
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

// ==========================================
// IMAGE MANAGEMENT (Cloudinary)
// ==========================================
router.get('/images', imageController.getImages);
router.get('/images/folders', imageController.listFolders);
router.get('/images/predefined-folders', imageController.getPredefinedFolders);
router.post('/images/folders', imageController.addFolder);
router.post('/images/upload', upload.array('images', 10), imageController.uploadImages);
router.post('/images/transform', imageController.transformImage);
router.post('/images/bulk-delete', imageController.bulkDeleteImages);
router.get('/images/:publicId(*)', imageController.getImage);
router.delete('/images/:publicId(*)', imageController.removeImage);
router.post('/images/:publicId(*)/move', imageController.moveImageToFolder);
router.patch('/images/:publicId(*)/tags', imageController.updateImageTags);

module.exports = router;
