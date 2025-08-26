const express = require('express');
const router = express.Router();
const cartImageController = require('../controllers/cartImageController');

// Upload cart image and create order
router.post('/upload-and-create-order', cartImageController.uploadCartImageAndCreateOrder);

// Get order details by unique ID (for admin)
router.get('/admin/order/:uniqueId', cartImageController.getOrderByUniqueId);

// Serve uploaded images
router.get('/uploads/cart-images/:filename', cartImageController.serveImage);

module.exports = router; 