const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const incidentService = require('../services/incident.service');
const Incident = require('../models/Incident');

// ─────────────────────────────────────────────
// POST /api/v1/incidents  (public — citizen)
// ─────────────────────────────────────────────
const createIncident = asyncHandler(async (req, res) => {
  const actor = req.user || null;  // may be anonymous
  const result = await incidentService.createIncident(req.body, actor);
  return successResponse(res, result, 201);
});

// ─────────────────────────────────────────────
// GET /api/v1/incidents
// ─────────────────────────────────────────────
const listIncidents = asyncHandler(async (req, res) => {
  const result = await incidentService.listIncidents(req.query);
  return successResponse(res, result);
});

// ─────────────────────────────────────────────
// GET /api/v1/incidents/:id
// ─────────────────────────────────────────────
const getIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncidentById(req.params.id);
  return successResponse(res, incident);
});

// ─────────────────────────────────────────────
// POST /api/v1/incidents/:id/assign
// ─────────────────────────────────────────────
const assignResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.body;
  if (!resourceId) {
    return res.status(400).json({
      success: false,
      message: 'resourceId is required',
      code: 'MISSING_RESOURCE_ID',
    });
  }

  const result = await incidentService.assignResource(
    req.params.id,
    resourceId,
    req.user
  );
  return successResponse(res, result);
});

// ─────────────────────────────────────────────
// POST /api/v1/incidents/:id/status
// ─────────────────────────────────────────────
const updateStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'status is required',
      code: 'MISSING_STATUS',
    });
  }

  const incident = await incidentService.updateStatus(
    req.params.id,
    status,
    req.user,
    notes
  );
  return successResponse(res, incident);
});

// ─────────────────────────────────────────────
// POST /api/v1/incidents/:id/merge
// ─────────────────────────────────────────────
const mergeIncidents = asyncHandler(async (req, res) => {
  const { sourceIncidentId } = req.body;
  if (!sourceIncidentId) {
    return res.status(400).json({
      success: false,
      message: 'sourceIncidentId is required',
      code: 'MISSING_SOURCE_ID',
    });
  }

  const result = await incidentService.mergeIncidents(
    req.params.id,
    sourceIncidentId,
    req.user
  );
  return successResponse(res, result);
});

// ─────────────────────────────────────────────
// GET /api/v1/incidents/:id/recommendations
// ─────────────────────────────────────────────
const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await incidentService.getRecommendations(req.params.id);
  return successResponse(res, { recommendations });
});

// ─────────────────────────────────────────────
// GET /api/v1/incidents/my-reports   (citizen)
// Returns all incidents reported by the authenticated user
// ─────────────────────────────────────────────
const getMyReports = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({ reportedBy: req.user.id })
    .populate('assignedResources', 'publicId name subtype status')
    .sort({ createdAt: -1 })
    .limit(100);
  return successResponse(res, { incidents, total: incidents.length });
});

module.exports = {
  createIncident,
  listIncidents,
  getIncident,
  getMyReports,
  assignResource,
  updateStatus,
  mergeIncidents,
  getRecommendations,
};