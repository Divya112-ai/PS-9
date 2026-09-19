const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const analyticsService = require('../services/analytics.service');

// ─────────────────────────────────────────────
// GET /api/v1/analytics/overview
// ─────────────────────────────────────────────
const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview();
  return successResponse(res, data);
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/types
// ─────────────────────────────────────────────
const getTypes = asyncHandler(async (req, res) => {
  const data = await analyticsService.getIncidentsByType();
  return successResponse(res, { distribution: data });
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/severity
// ─────────────────────────────────────────────
const getSeverity = asyncHandler(async (req, res) => {
  const data = await analyticsService.getIncidentsBySeverity();
  return successResponse(res, { distribution: data });
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/priority
// ─────────────────────────────────────────────
const getPriority = asyncHandler(async (req, res) => {
  const data = await analyticsService.getIncidentsByPriority();
  return successResponse(res, { distribution: data });
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/response-time
// ─────────────────────────────────────────────
const getResponseTime = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const data = await analyticsService.getResponseTimeTrend(days);
  return successResponse(res, { trend: data });
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/resources
// ─────────────────────────────────────────────
const getResources = asyncHandler(async (req, res) => {
  const data = await analyticsService.getResourceUtilization();
  return successResponse(res, data);
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/hotspots
// ─────────────────────────────────────────────
const getHotspots = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHotspots();
  return successResponse(res, { hotspots: data });
});

// ─────────────────────────────────────────────
// GET /api/v1/analytics/events
// ─────────────────────────────────────────────
const getRecentEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const data = await analyticsService.getRecentEvents(limit);
  return successResponse(res, { events: data });
});

module.exports = {
  getOverview,
  getTypes,
  getSeverity,
  getPriority,
  getResponseTime,
  getResources,
  getHotspots,
  getRecentEvents,
};