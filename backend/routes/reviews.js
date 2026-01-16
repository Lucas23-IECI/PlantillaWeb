const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Authenticated routes
router.post('/product/:productId', verifyToken, reviewController.createReview);
router.post('/:reviewId/helpful', reviewController.markHelpful);

// Admin routes
router.get('/admin/all', verifyToken, requireAdmin, reviewController.getAllReviews);
router.patch('/admin/:reviewId/status', verifyToken, requireAdmin, reviewController.updateReviewStatus);
router.delete('/admin/:reviewId', verifyToken, requireAdmin, reviewController.deleteReview);

module.exports = router;
