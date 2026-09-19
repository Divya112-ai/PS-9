const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const alertService = require('../services/alert.service');

// ─────────────────────────────────────────────
// GET /api/v1/alerts
// ─────────────────────────────────────────────
const listAlerts = asyncHandler(async (req, res) => {
  const result = await alertService.listAlerts(req.query);
  return successResponse(res, result);
});

// ─────────────────────────────────────────────
// GET /api/v1/alerts/:id
// ─────────────────────────────────────────────
const getAlert = asyncHandler(async (req, res) => {
  const alert = await alertService.getAlertById(req.params.id);
  return successResponse(res, alert);
});

// ─────────────────────────────────────────────
// PATCH /api/v1/alerts/:id/acknowledge
// ─────────────────────────────────────────────
const acknowledge = asyncHandler(async (req, res) => {
  const alert = await alertService.acknowledgeAlert(req.params.id, req.user);
  return successResponse(res, alert);
});

module.exports = {
  listAlerts,
  getAlert,
  acknowledge,
};