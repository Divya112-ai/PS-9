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

module.exports = {
  recommendResources,
  CAPABILITY_MAP,
  _internals: {
    calculateCapabilityScore,
    calculateAvailabilityScore,
    calculateDistanceScore,
    CONFIG,
  },
};