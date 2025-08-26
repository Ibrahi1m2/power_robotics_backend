const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/', required, isAdmin, userController.getAllUsers);
router.get('/vendors', required, userController.getVendors);
router.get('/:id', required, userController.getUserById);
router.put('/:id', required, userController.updateUser);
router.delete('/:id', required, isAdmin, userController.deleteUser);
router.get('/me', required, userController.getProfile);
router.put('/me', required, userController.updateProfile);

module.exports = router; 