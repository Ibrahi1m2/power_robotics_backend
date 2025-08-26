const express = require('express');
const router = express.Router();
const gmailController = require('../controllers/gmailController');
const { required } = require('../middleware/auth');

// Gmail routes
router.get('/emails', required, gmailController.getEmails);
router.get('/emails/:id', required, gmailController.getEmailById);
router.get('/search', required, gmailController.searchEmails);
router.get('/labels', required, gmailController.getLabels);
router.get('/auth/url', gmailController.getAuthUrl);

module.exports = router; 