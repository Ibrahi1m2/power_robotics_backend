const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { required } = require('../middleware/auth');

// Email routes
router.post('/send', required, emailController.sendEmail);
router.post('/send-to-self', required, emailController.sendEmailToSelf);
router.get('/test', emailController.testEmailConfig);

module.exports = router; 