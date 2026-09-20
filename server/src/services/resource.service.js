const Resource = require('../models/Resource');
const { haversineDistance, estimateEta } = require('../utils/distance');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const CONFIG = {
  WEIGHT_CAPABILITY: 0.50,
  WEIGHT_AVAILABILITY: 0.25,
  WEIGHT_DISTANCE: 0.25,
  MAX_RELEVANT_DISTANCE_KM: 20,   // beyond this, distance score = 0
  MIN_MATCH_SCORE: 30,            // filter out weak matches
  MAX_RECOMMENDATIONS: 3,         // return top 3
  AVG_SPEED_KMH: 30,              // for ETA estimation
};

// ─────────────────────────────────────────────
// Which capabilities does each incident type need?
// ─────────────────────────────────────────────
const CAPABILITY_MAP = {
  fire: ['fire_suppression', 'rescue'],
  flood: ['water_rescue', 'rescue'],
  medical: ['medical', 'transport'],
  accident: ['rescue', 'medical', 'traffic_control'],
  industrial: ['fire_suppression', 'hazmat', 'rescue'],
  structural: ['rescue', 'heavy_equipment'],
  other: ['rescue'],
};

// ─────────────────────────────────────────────
// Individual score components
// ─────────────────────────────────────────────

/**
 * How well does this resource's capabilities match what the incident needs?
 * Returns value in [0, 1].
 */
const calculateCapabilityScore = (resourceCapabilities, requiredCapabilities) => {
  if (!requiredCapabilities || requiredCapabilities.length === 0) return 1;

  const matches = requiredCapabilities.filter((cap) =>
    resourceCapabilities.includes(cap)
  );
  return matches.length / requiredCapabilities.length;
};

/**
 * Available = 1.0, currently on a call = 0.5, assigned/unavailable = 0.
 */
const calculateAvailabilityScore = (status) => {
  if (status === 'available') return 1.0;
  if (status === 'en_route' || status === 'on_scene') return 0.5;
  return 0;
};

/**
 * Linear falloff over MAX_RELEVANT_DISTANCE_KM.
 */
const calculateDistanceScore = (distanceKm) => {
  return Math.max(0, 1 - distanceKm / CONFIG.MAX_RELEVANT_DISTANCE_KM);
};

// ─────────────────────────────────────────────
// Main: rank resources for an incident
// ─────────────────────────────────────────────
const recommendResources = async (incident) => {
  if (!incident || !incident.type || !incident.location?.coordinates) {
    logger.warn('Cannot recommend resources — invalid incident');
    return [];
  }

  const requiredCapabilities = CAPABILITY_MAP[incident.type] || CAPABILITY_MAP.other;
  const incidentCoords = incident.location.coordinates;

  // Fetch available (and semi-available) resources
  const resources = await Resource.find({
    status: { $in: ['available', 'en_route', 'on_scene'] },
  });

  if (resources.length === 0) {
    logger.warn('No resources found for recommendation');
    return [];
  }

  const scored = resources.map((resource) => {
    const distanceKm = haversineDistance(incidentCoords, resource.location.coordinates);

    const capabilityScore = calculateCapabilityScore(
      resource.capabilities || [],
      requiredCapabilities
    );
    const availabilityScore = calculateAvailabilityScore(resource.status);
    const distanceScore = calculateDistanceScore(distanceKm);

    const matchScore =
      capabilityScore * CONFIG.WEIGHT_CAPABILITY +
      availabilityScore * CONFIG.WEIGHT_AVAILABILITY +
      distanceScore * CONFIG.WEIGHT_DISTANCE;

    const etaMinutes = estimateEta(distanceKm, CONFIG.AVG_SPEED_KMH);

    return {
      resourceId: resource._id,
      publicId: resource.publicId,
      name: resource.name,
      subtype: resource.subtype,
      status: resource.status,
      capabilities: resource.capabilities,
      matchScore: Math.round(matchScore * 100),
      breakdown: {
        capability: Math.round(capabilityScore * 100) / 100,
        availability: Math.round(availabilityScore * 100) / 100,
        distance: Math.round(distanceScore * 100) / 100,
      },
      distanceKm: Math.round(distanceKm * 10) / 10,
      etaMinutes,
    };
  });

  // Sort by score desc, filter weak matches, cap at top 3
  scored.sort((a, b) => b.matchScore - a.matchScore);

  const filtered = scored.filter((r) => r.matchScore >= CONFIG.MIN_MATCH_SCORE);
  const top = filtered.slice(0, CONFIG.MAX_RECOMMENDATIONS);

  logger.info('Resource recommendation complete', {
    incidentType: incident.type,
    candidateCount: resources.length,
    recommendationCount: top.length,
  });

  return top;
};
const listResources = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim());
    query.status = { $in: statuses };
  }
  if (filters.subtype) {
    const subtypes = filters.subtype.split(',').map((s) => s.trim());
    query.subtype = { $in: subtypes };
  }
  if (filters.type) {
    query.type = filters.type;
  }

  const limit = Math.min(parseInt(filters.limit) || 200, 500);
  const skip = parseInt(filters.skip) || 0;

  const [resources, total] = await Promise.all([
    Resource.find(query).sort({ status: 1, subtype: 1, publicId: 1 }).skip(skip).limit(limit),
    Resource.countDocuments(query),
  ]);

  return { resources, total, limit, skip };
};

// ─────────────────────────────────────────────
// GET one by ID (accepts ObjectId OR publicId)
// ─────────────────────────────────────────────
const getResourceById = async (idOrPublicId) => {
  const query = /^[A-Z]{2,4}-\d+$/.test(idOrPublicId)
    ? { publicId: idOrPublicId }
    : { _id: idOrPublicId };

  const resource = await Resource.findOne(query).populate(
    'assignedIncidentId',
    'publicId type severity status'
  );

  if (!resource) {
    throw new (require('../utils/ApiError'))(404, 'Resource not found', 'RESOURCE_NOT_FOUND');
  }

  return resource;
};

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────
const updateResourceStatus = async (resourceId, newStatus, actor) => {
  const VALID_STATUSES = ['available', 'assigned', 'en_route', 'on_scene', 'unavailable'];
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new (require('../utils/ApiError'))(
      400,
      `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      'INVALID_STATUS'
    );
  }

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new (require('../utils/ApiError'))(404, 'Resource not found', 'RESOURCE_NOT_FOUND');
  }

  const previousStatus = resource.status;
  resource.status = newStatus;

  // If moving to available, release the incident link
  if (newStatus === 'available') {
    resource.assignedIncidentId = null;
  }

  resource.lastUpdated = new Date();
  await resource.save();

  logger.info('Resource status updated', {
    publicId: resource.publicId,
    from: previousStatus,
    to: newStatus,
  });

  return resource;
};

// ─────────────────────────────────────────────
// SEED — quick demo data (idempotent — skips existing publicIds)
// ─────────────────────────────────────────────
const seedResources = async () => {
  const demoResources = [
    // Fire teams — Ahmedabad area
    { prefix: 'FT', n: 1, subtype: 'fire_team', name: 'Fire Team 01', caps: ['fire_suppression', 'rescue'], loc: [72.5714, 23.0225] },
    { prefix: 'FT', n: 2, subtype: 'fire_team', name: 'Fire Team 02', caps: ['fire_suppression'], loc: [72.59, 23.03] },
    { prefix: 'FT', n: 3, subtype: 'fire_team', name: 'Fire Team 03', caps: ['fire_suppression', 'rescue'], loc: [72.55, 23.01] },
    { prefix: 'FT', n: 4, subtype: 'fire_team', name: 'Fire Team 04', caps: ['fire_suppression', 'hazmat'], loc: [72.56, 23.04] },
    { prefix: 'FT', n: 5, subtype: 'fire_team', name: 'Fire Team 05', caps: ['fire_suppression'], loc: [72.60, 23.05] },

    // Ambulances
    { prefix: 'AMB', n: 1, subtype: 'ambulance', name: 'Ambulance 01', caps: ['medical', 'transport'], loc: [72.572, 23.023] },
    { prefix: 'AMB', n: 2, subtype: 'ambulance', name: 'Ambulance 02', caps: ['medical', 'transport'], loc: [72.58, 23.02] },
    { prefix: 'AMB', n: 3, subtype: 'ambulance', name: 'Ambulance 03', caps: ['medical'], loc: [72.57, 23.03] },
    { prefix: 'AMB', n: 4, subtype: 'ambulance', name: 'Ambulance 04', caps: ['medical', 'transport'], loc: [72.55, 23.04] },
    { prefix: 'AMB', n: 5, subtype: 'ambulance', name: 'Ambulance 05', caps: ['medical'], loc: [72.59, 23.00] },

    // Police
    { prefix: 'PU', n: 1, subtype: 'police', name: 'Police Unit 01', caps: ['traffic_control', 'security'], loc: [72.573, 23.024] },
    { prefix: 'PU', n: 2, subtype: 'police', name: 'Police Unit 02', caps: ['traffic_control'], loc: [72.56, 23.02] },
    { prefix: 'PU', n: 3, subtype: 'police', name: 'Police Unit 03', caps: ['security'], loc: [72.58, 23.03] },

    // Rescue
    { prefix: 'RS', n: 1, subtype: 'rescue', name: 'Rescue Team 01', caps: ['rescue', 'water_rescue'], loc: [72.575, 23.025] },
    { prefix: 'RS', n: 2, subtype: 'rescue', name: 'Rescue Team 02', caps: ['rescue', 'heavy_equipment'], loc: [72.56, 23.03] },
    { prefix: 'RS', n: 3, subtype: 'rescue', name: 'Rescue Team 03', caps: ['rescue', 'water_rescue'], loc: [72.59, 23.04] },

    // Hospitals
    { prefix: 'HOSP', n: 1, subtype: 'hospital', name: 'City Hospital', caps: ['medical', 'trauma'], loc: [72.58, 23.02] },
    { prefix: 'HOSP', n: 2, subtype: 'hospital', name: 'General Hospital', caps: ['medical'], loc: [72.55, 23.03] },
    { prefix: 'HOSP', n: 3, subtype: 'hospital', name: 'Metro Hospital', caps: ['medical', 'trauma'], loc: [72.60, 23.01] },
  ];

  let created = 0;
  let skipped = 0;

  for (const r of demoResources) {
    const publicId = `${r.prefix}-${String(r.n).padStart(2, '0')}`;

    const exists = await Resource.findOne({ publicId });
    if (exists) {
      skipped++;
      continue;
    }

    await Resource.create({
      publicId,
      type: r.subtype === 'hospital' ? 'hospital' : 'team',
      subtype: r.subtype,
      name: r.name,
      status: 'available',
      capabilities: r.caps,
      location: { type: 'Point', coordinates: r.loc },
      capacity: r.subtype === 'hospital' ? 100 : 6,
    });
    created++;
  }

  logger.info('Resource seed complete', { created, skipped });
  return { created, skipped, total: demoResources.length };
};

const updateResourceLocation = async (resourceId, lat, lng) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new (require('../utils/ApiError'))(404, 'Resource not found', 'RESOURCE_NOT_FOUND');
  }

  // Update coordinates
  resource.location.coordinates = [lng, lat];
  resource.lastUpdated = new Date();
  await resource.save();

  // If assigned to an incident, compute distance + ETA
  let distanceKm = null;
  let etaMinutes = null;
  let progressPercent = null;

  if (resource.assignedIncidentId) {
    const incident = await Incident.findById(resource.assignedIncidentId);
    if (incident?.location?.coordinates) {
      distanceKm = haversineDistance(
        [lng, lat],
        incident.location.coordinates
      );
      etaMinutes = estimateEta(distanceKm, 30); // 30 km/h average

      // Progress = (initial distance - current distance) / initial distance
      // We'd need the starting distance. Store it on assignment.
      // For simplicity, we compute based on remaining distance relative to a 15km max
      // Better: track progress client-side using a stored "startedAt" state.
    }
  }

  // Broadcast with full context
  safeEmit('resource:location:updated', {
    resourceId: resource._id,
    publicId: resource.publicId,
    location: resource.location,
    lastUpdated: resource.lastUpdated,
    distanceKm,
    etaMinutes,
    status: resource.status,
  });

  logger.info(`Resource ${resource.publicId} moved to [${lng}, ${lat}]`, {
    distanceKm,
    etaMinutes,
  });

  return resource;
};

module.exports = {
  recommendResources,
  listResources,
  getResourceById,
  updateResourceStatus,
  updateResourceLocation,
  seedResources,
  CAPABILITY_MAP,
  _internals: {
    calculateCapabilityScore,
    calculateAvailabilityScore,
    calculateDistanceScore,
    CONFIG,
  },
};