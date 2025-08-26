const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { required } = require('../middleware/auth');

// Get user's wishlist
router.get('/', required, wishlistController.getWishlist);
// Add item to wishlist
router.post('/add', required, wishlistController.addToWishlist);
// Remove item from wishlist
router.delete('/remove', required, wishlistController.removeFromWishlist);

module.exports = router; 