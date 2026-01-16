const { getDb } = require('../config/firebaseAdmin');

const REVIEWS_COLLECTION = 'reviews';
const PRODUCTS_COLLECTION = 'products';

/**
 * Get reviews for a product
 */
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'recent' } = req.query;

        const db = getDb();
        let query = db.collection(REVIEWS_COLLECTION)
            .where('product_id', '==', productId)
            .where('status', '==', 'approved');

        // Sorting
        if (sort === 'recent') {
            query = query.orderBy('createdAt', 'desc');
        } else if (sort === 'rating_high') {
            query = query.orderBy('rating', 'desc');
        } else if (sort === 'rating_low') {
            query = query.orderBy('rating', 'asc');
        } else if (sort === 'helpful') {
            query = query.orderBy('helpful_count', 'desc');
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const snapshot = await query.limit(limitNum).offset(offset).get();

        const reviews = [];
        snapshot.forEach(doc => {
            reviews.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            });
        });

        // Get total count
        const totalSnapshot = await db.collection(REVIEWS_COLLECTION)
            .where('product_id', '==', productId)
            .where('status', '==', 'approved')
            .count()
            .get();

        const total = totalSnapshot.data().count;

        // Get rating distribution
        const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const allReviewsSnapshot = await db.collection(REVIEWS_COLLECTION)
            .where('product_id', '==', productId)
            .where('status', '==', 'approved')
            .get();

        let totalRating = 0;
        allReviewsSnapshot.forEach(doc => {
            const rating = doc.data().rating;
            ratingDist[rating] = (ratingDist[rating] || 0) + 1;
            totalRating += rating;
        });

        const averageRating = total > 0 ? (totalRating / total).toFixed(1) : 0;

        res.json({
            reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            stats: {
                average_rating: parseFloat(averageRating),
                total_reviews: total,
                rating_distribution: ratingDist
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ message: 'Error al obtener reseñas' });
    }
};

/**
 * Create a new review
 */
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;
        const userId = req.user.uid;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5' });
        }

        if (!comment || comment.trim().length < 10) {
            return res.status(400).json({ message: 'El comentario debe tener al menos 10 caracteres' });
        }

        const db = getDb();

        // Check if user already reviewed this product
        const existingReview = await db.collection(REVIEWS_COLLECTION)
            .where('product_id', '==', productId)
            .where('user_id', '==', userId)
            .limit(1)
            .get();

        if (!existingReview.empty) {
            return res.status(400).json({ message: 'Ya has dejado una reseña para este producto' });
        }

        // Get user data
        const userSnapshot = await db.collection('users').doc(userId).get();
        const userData = userSnapshot.exists ? userSnapshot.data() : { name: 'Usuario Anónimo' };

        // Create review
        const review = {
            product_id: productId,
            user_id: userId,
            user_name: userData.name || 'Usuario',
            rating: parseInt(rating),
            title: title?.trim() || '',
            comment: comment.trim(),
            helpful_count: 0,
            status: 'pending', // pending, approved, rejected
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection(REVIEWS_COLLECTION).add(review);

        // Update product rating (will be done after approval)
        res.status(201).json({
            id: docRef.id,
            ...review,
            message: 'Reseña enviada. Será visible después de ser aprobada.'
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error al crear reseña' });
    }
};

/**
 * Mark review as helpful
 */
exports.markHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.uid || req.ip;

        const db = getDb();
        const reviewRef = db.collection(REVIEWS_COLLECTION).doc(reviewId);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        const reviewData = reviewDoc.data();
        const helpfulBy = reviewData.helpful_by || [];

        if (helpfulBy.includes(userId)) {
            return res.status(400).json({ message: 'Ya marcaste esta reseña como útil' });
        }

        await reviewRef.update({
            helpful_count: (reviewData.helpful_count || 0) + 1,
            helpful_by: [...helpfulBy, userId]
        });

        res.json({ message: 'Marcada como útil', helpful_count: (reviewData.helpful_count || 0) + 1 });
    } catch (error) {
        console.error('Error marking helpful:', error);
        res.status(500).json({ message: 'Error al marcar como útil' });
    }
};

/**
 * Admin: Get all reviews (for moderation)
 */
exports.getAllReviews = async (req, res) => {
    try {
        const { status = 'all', page = 1, limit = 20 } = req.query;

        const db = getDb();
        let query = db.collection(REVIEWS_COLLECTION);

        if (status !== 'all') {
            query = query.where('status', '==', status);
        }

        query = query.orderBy('createdAt', 'desc');

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const snapshot = await query.limit(limitNum).offset(offset).get();

        const reviews = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Get product info
            let productName = 'Producto eliminado';
            try {
                const productDoc = await db.collection(PRODUCTS_COLLECTION).doc(data.product_id).get();
                if (productDoc.exists) {
                    productName = productDoc.data().name || productDoc.data().nombre;
                }
            } catch (e) {
                // Product not found
            }

            reviews.push({
                id: doc.id,
                ...data,
                product_name: productName,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            });
        }

        // Get counts
        const pendingCount = (await db.collection(REVIEWS_COLLECTION).where('status', '==', 'pending').count().get()).data().count;
        const approvedCount = (await db.collection(REVIEWS_COLLECTION).where('status', '==', 'approved').count().get()).data().count;
        const rejectedCount = (await db.collection(REVIEWS_COLLECTION).where('status', '==', 'rejected').count().get()).data().count;

        res.json({
            reviews,
            counts: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                total: pendingCount + approvedCount + rejectedCount
            },
            pagination: {
                page: pageNum,
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Error getting all reviews:', error);
        res.status(500).json({ message: 'Error al obtener reseñas' });
    }
};

/**
 * Admin: Update review status
 */
exports.updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        const db = getDb();
        const reviewRef = db.collection(REVIEWS_COLLECTION).doc(reviewId);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        const reviewData = reviewDoc.data();
        const wasApproved = reviewData.status === 'approved';
        const isNowApproved = status === 'approved';

        await reviewRef.update({
            status,
            updatedAt: new Date()
        });

        // Update product rating if status changed to/from approved
        if (wasApproved !== isNowApproved) {
            await updateProductRating(db, reviewData.product_id);
        }

        res.json({ message: 'Estado actualizado', status });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({ message: 'Error al actualizar estado' });
    }
};

/**
 * Admin: Delete review
 */
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const db = getDb();
        const reviewRef = db.collection(REVIEWS_COLLECTION).doc(reviewId);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        const productId = reviewDoc.data().product_id;

        await reviewRef.delete();

        // Update product rating
        await updateProductRating(db, productId);

        res.json({ message: 'Reseña eliminada' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Error al eliminar reseña' });
    }
};

/**
 * Helper: Update product rating based on approved reviews
 */
async function updateProductRating(db, productId) {
    try {
        const reviewsSnapshot = await db.collection(REVIEWS_COLLECTION)
            .where('product_id', '==', productId)
            .where('status', '==', 'approved')
            .get();

        let totalRating = 0;
        let count = 0;

        reviewsSnapshot.forEach(doc => {
            totalRating += doc.data().rating;
            count++;
        });

        const averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

        await db.collection(PRODUCTS_COLLECTION).doc(productId).update({
            rating: parseFloat(averageRating),
            reviews_count: count
        });
    } catch (error) {
        console.error('Error updating product rating:', error);
    }
}
