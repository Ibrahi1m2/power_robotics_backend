const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { required } = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/summary', required, isAdmin, dashboardController.getSummary);

module.exports = router; 