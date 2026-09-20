const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

/**
 * POST /api/v1/whatsapp/webhook
 *
 * Receives incoming WhatsApp messages from Twilio.
 */
const handleWebhook = async (req, res, next) => {
  try {
    // Validate Twilio signature when configuration is available.
    const valid = whatsappService.validateTwilioSignature(req);

    if (!valid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Twilio webhook signature',
      });
    }

    const payload = whatsappService.parseTwilioPayload(req.body);

    // Development logging so we can verify Twilio is reaching Express.
    logger.info('Incoming WhatsApp message', {
      From: req.body.From,
      To: req.body.To,
      Body: req.body.Body,
      MessageSid: req.body.MessageSid,
      ProfileName: req.body.ProfileName,
      NumMedia: req.body.NumMedia,
    });

    if (!payload.messageSid) {
      return res.status(400).json({
        success: false,
        message: 'Missing Twilio MessageSid',
      });
    }

    // Prevent duplicate Twilio webhook deliveries.
    const alreadyProcessed =
      await whatsappService.isAlreadyProcessed(payload.messageSid);

    if (alreadyProcessed) {
      logger.info('Duplicate WhatsApp webhook ignored', {
        messageSid: payload.messageSid,
      });

      return res.status(200).send('OK');
    }

    // Process through the existing PS-9 incident pipeline.
    const result =
      await whatsappService.processIncomingMessage(payload);

    if (!result) {
      return res.status(200).send('OK');
    }

    // Build confirmation message.
    const confirmation =
      whatsappService.buildConfirmationMessage(
        result.incident,
        result.duplicateCandidates
      );

    // Send confirmation back to the WhatsApp sender.
    await whatsappService.sendReply(
      payload.from,
      confirmation
    );

    // Return quickly to Twilio.
    return res.status(200).send('OK');
  } catch (error) {
    logger.error('WhatsApp webhook processing failed', {
      message: error.message,
      stack: error.stack,
    });

    // Pass to existing Express error handler.
    return next(error);
  }
};

/**
 * GET /api/v1/whatsapp/status
 */
const getStatus = async (req, res) => {
  return res.status(200).json({
    success: true,
    ...whatsappService.getConfigStatus(),
  });
};

module.exports = {
  handleWebhook,
  getStatus,
};