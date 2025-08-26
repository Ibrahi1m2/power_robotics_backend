const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/', productController.getAllProducts);
router.get('/deals', productController.getDealOfTheWeek);
router.get('/category/:category_id', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
// TEMP: allow non-admins during testing
router.post('/', required, productController.createProduct);
router.put('/:id', required, productController.updateProduct);
router.delete('/:id', required, productController.deleteProduct);

module.exports = router; 