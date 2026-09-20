const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const resourceService = require('../services/resource.service');

// ─────────────────────────────────────────────
// GET /api/v1/resources
// ─────────────────────────────────────────────
const listResources = asyncHandler(async (req, res) => {
  const result = await resourceService.listResources(req.query);
  return successResponse(res, result);
});

// ─────────────────────────────────────────────
// GET /api/v1/resources/:id
// ─────────────────────────────────────────────
const getResource = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  return successResponse(res, resource);
});

// ─────────────────────────────────────────────
// PATCH /api/v1/resources/:id/status
// ─────────────────────────────────────────────
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw ApiError.badRequest('status is required', 'MISSING_STATUS');
  }

  const resource = await resourceService.updateResourceStatus(
    req.params.id,
    status,
    req.user
  );
  return successResponse(res, resource);
});

// ─────────────────────────────────────────────
// POST /api/v1/resources/seed
// ─────────────────────────────────────────────
const seedResources = asyncHandler(async (req, res) => {
  const result = await resourceService.seedResources();
  return successResponse(res, result, 201);
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw ApiError.badRequest('lat and lng are required', 'MISSING_COORDS');
  }
  const resource = await resourceService.updateResourceLocation(
    req.params.id,
    lat,
    lng
  );
  return successResponse(res, resource);
});


module.exports = {
  listResources,
  getResource,
  updateStatus,
  seedResources,
  updateLocation,
};