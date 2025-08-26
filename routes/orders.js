const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/', required, orderController.getOrders);
router.get('/stats', required, isAdmin, orderController.getOrderStats);
router.get('/:id', required, orderController.getOrderById);
router.post('/', required, orderController.createOrder);
router.put('/:id', required, isAdmin, orderController.updateOrderStatus);
router.delete('/:id', required, isAdmin, orderController.deleteOrder);

module.exports = router; 