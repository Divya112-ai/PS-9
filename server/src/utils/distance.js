const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate the distance in kilometers between two [lng, lat] coordinates.
 * Uses the Haversine formula — accurate for short distances.
 */
const haversineDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
    throw new Error('Both coordinates must be [lng, lat]');
  }

  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const EARTH_RADIUS_KM = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Same as above but returns meters (used for duplicate detection).
 */
const haversineDistanceMeters = (coord1, coord2) => {
  return haversineDistance(coord1, coord2) * 1000;
};

/**
 * Approximate ETA in minutes based on distance and average speed.
 * Falls back to 30 km/h if not specified.
 */
const estimateEta = (distanceKm, avgSpeedKmh = 30) => {
  const hours = distanceKm / avgSpeedKmh;
  return Math.max(1, Math.round(hours * 60));
};

module.exports = {
  haversineDistance,
  haversineDistanceMeters,
  estimateEta,
};