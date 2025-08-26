const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const auth = require('../middleware/auth');

// Create a new order (requires authentication for logged-in users, but allows guest checkout)
router.post('/create-order', auth.optional, checkoutController.createOrder);

// Get order details by ID (requires authentication or admin access)
router.get('/order/:orderId', auth.optional, checkoutController.getOrderDetails);

// Get user's order history (requires authentication)
router.get('/user-orders', auth.required, checkoutController.getUserOrders);

// Update order status (admin only)
router.put('/order/:orderId/status', auth.required, checkoutController.updateOrderStatus);

// Get order statistics (admin only)
router.get('/stats', auth.required, checkoutController.getOrderStats);

// Calculate shipping cost
router.post('/calculate-shipping', checkoutController.calculateShipping);

module.exports = router; 