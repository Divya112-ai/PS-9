const Alert = require('../models/Alert');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// LIST — with filters
// ─────────────────────────────────────────────
const listAlerts = async (filters = {}) => {
  const query = {};

  if (filters.acknowledged === 'false') {
    query.acknowledged = false;
  } else if (filters.acknowledged === 'true') {
    query.acknowledged = true;
  }

  if (filters.severity) {
    const severities = filters.severity.split(',').map((s) => s.trim());
    query.severity = { $in: severities };
  }

  if (filters.incidentId) {
    query.incidentId = filters.incidentId;
  }

  const limit = Math.min(parseInt(filters.limit) || 100, 500);

  const [alerts, total] = await Promise.all([
    Alert.find(query)
      .populate('incidentId', 'publicId type severity priority status')
      .sort({ createdAt: -1 })
      .limit(limit),
    Alert.countDocuments(query),
  ]);

  return { alerts, total };
};

// ─────────────────────────────────────────────
// GET one
// ─────────────────────────────────────────────
const getAlertById = async (id) => {
  const alert = await Alert.findById(id).populate(
    'incidentId',
    'publicId type severity priority status'
  );
  if (!alert) throw ApiError.notFound('Alert not found', 'ALERT_NOT_FOUND');
  return alert;
};

// ─────────────────────────────────────────────
// ACKNOWLEDGE
// ─────────────────────────────────────────────
const acknowledgeAlert = async (alertId, actor) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw ApiError.notFound('Alert not found', 'ALERT_NOT_FOUND');

  if (alert.acknowledged) {
    return alert; // Idempotent
  }

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = actor?.id || null;
  await alert.save();

  logger.info('Alert acknowledged', {
    alertId: alert._id.toString(),
    actor: actor?.id,
  });

  return alert;
};

// ─────────────────────────────────────────────
// CREATE — used by escalation and other services
// ─────────────────────────────────────────────
const createAlert = async ({ incidentId, type, severity, message }) => {
  const alert = await Alert.create({
    incidentId,
    type: type || 'info',
    severity: severity || 'info',
    message,
  });

  logger.info('Alert created', {
    type,
    severity,
    incidentId: incidentId?.toString(),
  });

  return alert;
};

module.exports = {
  listAlerts,
  getAlertById,
  acknowledgeAlert,
  createAlert,
};