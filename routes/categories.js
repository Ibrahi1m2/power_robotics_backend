const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', required, isAdmin, categoryController.createCategory);
router.put('/:id', required, isAdmin, categoryController.updateCategory);
router.delete('/:id', required, isAdmin, categoryController.deleteCategory);

module.exports = router; 