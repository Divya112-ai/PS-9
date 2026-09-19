const Incident = require('../models/Incident');
const { haversineDistanceMeters } = require('../utils/distance');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// Config — tunable for demo
// ─────────────────────────────────────────────
const CONFIG = {
  RADIUS_METERS: 300,
  TIME_WINDOW_MINUTES: 10,
  WEIGHT_LOCATION: 0.40,
  WEIGHT_TIME: 0.20,
  WEIGHT_TEXT: 0.40,
  CANDIDATE_THRESHOLD: 0.75,
  ELIGIBLE_STATUSES: ['reported', 'classified', 'assigned', 'en_route', 'on_scene'],
};

// ─────────────────────────────────────────────
// Text tokenizer
// ─────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
  'from', 'as', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'we',
  'there', 'here', 'can', 'will', 'would', 'should', 'could', 'has', 'have',
  'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'very', 'so', 'near', 'around',
]);

const tokenize = (text) => {
  if (!text || typeof text !== 'string') return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
};

// ─────────────────────────────────────────────
// Jaccard similarity
// ─────────────────────────────────────────────
const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return intersectionSize / unionSize;
};

// ─────────────────────────────────────────────
// Score components
// ─────────────────────────────────────────────
const calculateLocationScore = (coord1, coord2) => {
  const distanceMeters = haversineDistanceMeters(coord1, coord2);
  const score = Math.max(0, 1 - distanceMeters / CONFIG.RADIUS_METERS);
  return { score, distanceMeters: Math.round(distanceMeters) };
};

const calculateTimeScore = (incidentCreatedAt) => {
  const ageMinutes = (Date.now() - new Date(incidentCreatedAt).getTime()) / 60000;
  const score = Math.max(0, 1 - ageMinutes / CONFIG.TIME_WINDOW_MINUTES);
  return { score, ageMinutes: Math.round(ageMinutes * 10) / 10 };
};

// ─────────────────────────────────────────────
// Main: find duplicate candidates
// ─────────────────────────────────────────────
const findDuplicateCandidates = async (newReport) => {
  const { description, location } = newReport;

  if (!description || !location?.coordinates) {
    logger.warn('Duplicate check skipped — missing description or location');
    return [];
  }

  const [lng, lat] = location.coordinates;
  const timeWindowStart = new Date(Date.now() - CONFIG.TIME_WINDOW_MINUTES * 60 * 1000);

  let nearbyIncidents;
  try {
    nearbyIncidents = await Incident.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: CONFIG.RADIUS_METERS,
        },
      },
      createdAt: { $gte: timeWindowStart },
      status: { $in: CONFIG.ELIGIBLE_STATUSES },
    }).limit(20);
  } catch (err) {
    logger.error('Duplicate search failed', err);
    return [];
  }

  if (nearbyIncidents.length === 0) {
    logger.debug('No nearby incidents for duplicate check');
    return [];
  }

  const newTokens = tokenize(description);
  const candidates = [];

  for (const incident of nearbyIncidents) {
    const loc = calculateLocationScore(location.coordinates, incident.location.coordinates);
    const time = calculateTimeScore(incident.createdAt);
    const textScore = jaccardSimilarity(newTokens, tokenize(incident.description));

    const compositeScore =
      loc.score * CONFIG.WEIGHT_LOCATION +
      time.score * CONFIG.WEIGHT_TIME +
      textScore * CONFIG.WEIGHT_TEXT;

    if (compositeScore >= CONFIG.CANDIDATE_THRESHOLD) {
      candidates.push({
        incidentId: incident._id,
        publicId: incident.publicId,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        score: Math.round(compositeScore * 1000) / 1000,
        breakdown: {
          location: Math.round(loc.score * 1000) / 1000,
          time: Math.round(time.score * 1000) / 1000,
          text: Math.round(textScore * 1000) / 1000,
        },
        distanceMeters: loc.distanceMeters,
        ageMinutes: time.ageMinutes,
        createdAt: incident.createdAt,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  logger.info('Duplicate check complete', {
    nearbyCount: nearbyIncidents.length,
    candidateCount: candidates.length,
  });

  return candidates;
};

module.exports = {
  findDuplicateCandidates,
  _internals: {
    tokenize,
    jaccardSimilarity,
    calculateLocationScore,
    calculateTimeScore,
    CONFIG,
  },
};