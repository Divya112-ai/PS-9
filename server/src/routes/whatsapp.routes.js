const express = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = express.Router();

// Twilio WhatsApp webhook
router.post('/webhook', whatsappController.handleWebhook);

// Integration configuration status
router.get('/status', whatsappController.getStatus);

module.exports = router;