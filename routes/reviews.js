const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Get all reviews (admin only)
router.get('/', required, isAdmin, reviewController.getAllReviews);

// Get reviews for a specific product
router.get('/product/:product_id', reviewController.getProductReviews);

// Get rating statistics for a product
router.get('/product/:product_id/stats', reviewController.getProductRatingStats);

// Get review by ID
router.get('/:id', reviewController.getReviewById);

// Create a new review
router.post('/', required, reviewController.createReview);

// Update a review
router.put('/:id', required, reviewController.updateReview);

// Delete a review
router.delete('/:id', required, reviewController.deleteReview);

module.exports = router; 