/**
 * WhatsApp / Twilio integration service.
 *
 * Responsibilities:
 *  - Validate Twilio webhook signatures
 *  - Parse incoming WhatsApp messages
 *  - Idempotency guard via MessageSid
 *  - Convert to SourceReport + feed into existing PS-9 pipeline
 *  - Send confirmation reply through Twilio
 *  - Surface config status for the /status endpoint
 */

const twilio = require('twilio');
const SourceReport = require('../models/SourceReport');
const incidentService = require('./incident.service');
const logger = require('../utils/logger');
const { generateReportId } = require('../utils/generateId');

// ─────────────────────────────────────────────
// Twilio client — lazily initialised
// ─────────────────────────────────────────────
let _client = null;

const getClient = () => {
  if (_client) return _client;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  _client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return _client;
};

// ─────────────────────────────────────────────
// Config status (used by GET /status)
// ─────────────────────────────────────────────
const getConfigStatus = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const number = process.env.TWILIO_WHATSAPP_NUMBER;
  const configured = !!(sid && token && number);

  return {
    configured,
    accountSidPresent: !!sid,
    authTokenPresent: !!token,
    whatsappNumberPresent: !!number,
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || null,
    message: configured
      ? 'Twilio WhatsApp integration is configured.'
      : 'Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in server/.env',
  };
};

// ─────────────────────────────────────────────
// Validate Twilio webhook signature
// Returns true / false. Skips validation when
// TWILIO_WEBHOOK_URL or credentials are absent
// (allows local dev without ngrok).
// ─────────────────────────────────────────────
const validateTwilioSignature = (req) => {
  const { TWILIO_AUTH_TOKEN, TWILIO_WEBHOOK_URL } = process.env;

  // Can't validate without credentials — allow through with a warning
  if (!TWILIO_AUTH_TOKEN || !TWILIO_WEBHOOK_URL) {
    logger.warn('Twilio signature validation skipped — credentials or TWILIO_WEBHOOK_URL missing');
    return true;
  }

  const signature = req.headers['x-twilio-signature'] || '';
  const url = TWILIO_WEBHOOK_URL;
  const params = req.body || {};

  const valid = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);

  if (!valid) {
    logger.warn('Twilio signature validation FAILED', {
      url,
      signaturePresent: !!signature,
    });
  }

  return valid;
};

// ─────────────────────────────────────────────
// Parse raw Twilio body into a clean object
// ─────────────────────────────────────────────
const parseTwilioPayload = (body) => {
  const numMedia = parseInt(body.NumMedia || '0', 10);
  const mediaUrls = [];
  const mediaContentTypes = [];

  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    const ct = body[`MediaContentType${i}`];
    if (url) mediaUrls.push(url);
    if (ct) mediaContentTypes.push(ct);
  }

  // Try to extract lat/lng from Twilio's location sharing
  let coords = null;
  if (body.Latitude && body.Longitude) {
    const lat = parseFloat(body.Latitude);
    const lng = parseFloat(body.Longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      coords = [lng, lat]; // GeoJSON: [lng, lat]
    }
  }

  return {
    messageSid: body.MessageSid || null,
    from: body.From || null,          // e.g. "whatsapp:+91XXXXXXXXXX"
    to: body.To || null,              // e.g. "whatsapp:+14155238886"
    body: (body.Body || '').trim(),
    profileName: body.ProfileName || null,
    numMedia,
    mediaUrls,
    mediaContentTypes,
    coords,
    address: body.Address || null,   // sent by some WhatsApp location shares
  };
};

// ─────────────────────────────────────────────
// Default coordinates for Ahmedabad city centre
// Used when the sender doesn't share location.
// In production you'd extract from message text
// or ask the user to share their location.
// ─────────────────────────────────────────────
const DEFAULT_COORDS = [72.5714, 23.0225]; // [lng, lat] — Ahmedabad

// ─────────────────────────────────────────────
// Idempotency check — have we already processed this MessageSid?
// ─────────────────────────────────────────────
const isAlreadyProcessed = async (messageSid) => {
  if (!messageSid) return false;
  const existing = await SourceReport.findOne({ 'whatsapp.messageSid': messageSid });
  return !!existing;
};

// ─────────────────────────────────────────────
// Core: process one incoming WhatsApp message
// Returns { incident, report, duplicateCandidates, classification }
// ─────────────────────────────────────────────
const processIncomingMessage = async (twilioPayload) => {
  const { messageSid, from, to, body: messageText, profileName,
          numMedia, mediaUrls, mediaContentTypes, coords, address } = twilioPayload;

  // 1. Guard: message must have text
  if (!messageText) {
    logger.warn('WhatsApp message has no text body — skipping', { messageSid });
    return null;
  }

  // 2. Resolve coordinates
  const coordinates = coords || DEFAULT_COORDS;

  // 3. Build the payload that incident.service.createIncident() expects
  const incidentPayload = {
    description: messageText,
    location: {
      type: 'Point',
      coordinates,
    },
    address: address || null,
    sourceType: 'whatsapp',
  };

  // 4. Synthetic actor — represents the WhatsApp sender (no PS-9 account)
  const actor = {
    id: null,
    role: 'citizen',
    name: profileName || 'WhatsApp User',
    phone: from,
  };

  // 5. Run through the existing PS-9 pipeline
  //    (AI classification → duplicate detection → incident creation → Socket.IO)
  const result = await incidentService.createIncident(incidentPayload, actor);

  // 6. Patch the SourceReport with WhatsApp metadata
  //    (createIncident already saved the report — we just enrich it)
  const reportPublicId = result.trackingId; // e.g. REP-10042
  await SourceReport.findOneAndUpdate(
    { publicId: reportPublicId },
    {
      $set: {
        sourceType: 'whatsapp',
        reporterName: profileName || null,
        reporterContact: from ? from.replace('whatsapp:', '') : null,
        'whatsapp.messageSid': messageSid,
        'whatsapp.profileName': profileName || null,
        'whatsapp.from': from,
        'whatsapp.to': to,
        'whatsapp.numMedia': numMedia,
        'whatsapp.mediaUrls': mediaUrls,
        'whatsapp.mediaContentTypes': mediaContentTypes,
      },
    }
  );

  logger.info('WhatsApp incident created', {
    messageSid,
    from,
    publicId: result.incident.publicId,
    type: result.incident.type,
    priority: result.incident.priority,
  });

  return result;
};

// ─────────────────────────────────────────────
// Build the confirmation TwiML reply text
// ─────────────────────────────────────────────
const buildConfirmationMessage = (incident, duplicateCandidates = []) => {
  const priority = incident.priority;
  const type = (incident.type || 'other').charAt(0).toUpperCase() + (incident.type || 'other').slice(1);
  const status = 'Reported';

  let msg =
    `✅ Your emergency report has been received.\n\n` +
    `Incident ID: ${incident.publicId}\n` +
    `Type: ${type}\n` +
    `Priority: ${priority}\n` +
    `Status: ${status}\n\n` +
    `Your report is now being reviewed by the emergency response team.`;

  if (duplicateCandidates && duplicateCandidates.length > 0) {
    msg += `\n\nNote: A similar incident (${duplicateCandidates[0].publicId}) has already been reported nearby. Both are being tracked.`;
  }

  return msg;
};

// ─────────────────────────────────────────────
// Send WhatsApp reply via Twilio REST API
// Falls back silently if Twilio is not configured
// ─────────────────────────────────────────────
const sendReply = async (to, messageBody) => {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!client || !from) {
    logger.warn('Cannot send WhatsApp reply — Twilio not configured');
    return;
  }

  // Ensure the "to" number has the whatsapp: prefix
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const fromNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  try {
    const msg = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messageBody,
    });
    logger.info('WhatsApp reply sent', { sid: msg.sid, to: toNumber });
  } catch (err) {
    logger.error('Failed to send WhatsApp reply', err);
    // Non-fatal — the incident was already created
  }
};

module.exports = {
  getConfigStatus,
  validateTwilioSignature,
  parseTwilioPayload,
  isAlreadyProcessed,
  processIncomingMessage,
  buildConfirmationMessage,
  sendReply,
};
