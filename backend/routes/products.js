const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas públicas
router.get('/', productController.getProducts);
router.get('/home-featured', productController.getHomeFeaturedProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
