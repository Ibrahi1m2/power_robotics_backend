const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { required } = require('../middleware/auth');

// Get user's cart
router.get('/', required, cartController.getCart);
// Get cart summary
router.get('/summary', required, cartController.getCartSummary);
// Add item to cart
router.post('/add', required, cartController.addToCart);
// Update cart item quantity
router.put('/update', required, cartController.updateCartItem);
// Remove item from cart
router.delete('/remove', required, cartController.removeFromCart);
// Clear cart
router.delete('/clear', required, cartController.clearCart);

module.exports = router; 