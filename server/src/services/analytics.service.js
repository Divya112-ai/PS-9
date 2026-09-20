const Incident = require('../models/Incident');
const Resource = require('../models/Resource');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const logger = require('../utils/logger');

// Use the incident's actual "when it happened" time.
// Fall back to createdAt for older incidents that don't have reportedAt.
const incidentStart = { $ifNull: ['$reportedAt', '$createdAt'] };

// ─────────────────────────────────────────────
// OVERVIEW — KPI cards
// ─────────────────────────────────────────────
const getOverview = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    activeIncidents,
    criticalIncidents,
    pendingAlerts,
    resourcesDeployed,
    totalResources,
    resolvedToday,
    resolvedIncidents,
  ] = await Promise.all([
    Incident.countDocuments({ status: { $nin: ['resolved', 'closed', 'merged'] } }),
    Incident.countDocuments({
      severity: 'critical',
      status: { $nin: ['resolved', 'closed', 'merged'] },
    }),
    require('../models/Alert').countDocuments({ acknowledged: false }),
    Resource.countDocuments({ status: { $nin: ['available'] } }),
    Resource.countDocuments({}),
    Incident.countDocuments({
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $gte: startOfToday },
    }),
    Incident.find({ status: 'resolved', resolvedAt: { $ne: null } })
      .select('reportedAt createdAt resolvedAt onSceneAt'),
  ]);

  // Average response time = (onSceneAt - reportedAt) for resolved incidents
  // Only count valid pairs where onSceneAt >= reportedAt
  let avgResponseTime = 0;
  const validResponses = resolvedIncidents.filter((i) => {
    const start = i.reportedAt || i.createdAt;
    const end = i.onSceneAt || i.resolvedAt;
    return start && end && end.getTime() >= start.getTime();
  });

  if (validResponses.length > 0) {
    const totalMs = validResponses.reduce((sum, i) => {
      const start = (i.reportedAt || i.createdAt).getTime();
      const end = (i.onSceneAt || i.resolvedAt).getTime();
      return sum + (end - start);
    }, 0);
    avgResponseTime = totalMs / validResponses.length / 60000;
  }

  // Average resolution time = (resolvedAt - reportedAt)
  let avgResolutionTime = 0;
  const validResolutions = resolvedIncidents.filter((i) => {
    const start = i.reportedAt || i.createdAt;
    return start && i.resolvedAt && i.resolvedAt.getTime() >= start.getTime();
  });

  if (validResolutions.length > 0) {
    const totalMs = validResolutions.reduce((sum, i) => {
      const start = (i.reportedAt || i.createdAt).getTime();
      return sum + (i.resolvedAt.getTime() - start);
    }, 0);
    avgResolutionTime = totalMs / validResolutions.length / 60000;
  }

  return {
    activeIncidents,
    criticalIncidents,
    pendingAlerts,
    resourcesDeployed,
    totalResources,
    resourceUtilization: totalResources
      ? Math.round((resourcesDeployed / totalResources) * 100)
      : 0,
    resolvedToday,
    avgResponseTimeMinutes: Math.round(avgResponseTime * 10) / 10,
    avgResolutionTimeMinutes: Math.round(avgResolutionTime * 10) / 10,
  };
};

// ─────────────────────────────────────────────
// INCIDENTS BY TYPE
// ─────────────────────────────────────────────
const getIncidentsByType = async () => {
  return Incident.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ]);
};

// ─────────────────────────────────────────────
// INCIDENTS BY SEVERITY
// ─────────────────────────────────────────────
const getIncidentsBySeverity = async () => {
  return Incident.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, severity: '$_id', count: 1 } },
  ]);
};

// ─────────────────────────────────────────────
// INCIDENTS BY PRIORITY
// ─────────────────────────────────────────────
const getIncidentsByPriority = async () => {
  return Incident.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, priority: '$_id', count: 1 } },
  ]);
};

// ─────────────────────────────────────────────
// RESPONSE TIME TREND — daily averages
// Uses reportedAt as the start time, not createdAt
// ─────────────────────────────────────────────
const getResponseTimeTrend = async (days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return Incident.aggregate([
    {
      $match: {
        status: 'resolved',
        resolvedAt: { $ne: null, $gte: since },
        reportedAt: { $ne: null },
      },
    },
    {
      // Only count incidents where the dates make sense
      $match: {
        $expr: { $gte: ['$resolvedAt', '$reportedAt'] },
      },
    },
    {
      $project: {
        date: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: incidentStart,
          },
        },
        responseMs: { $subtract: ['$resolvedAt', '$reportedAt'] },
      },
    },
    {
      $group: {
        _id: '$date',
        count: { $sum: 1 },
        avgResponseMs: { $avg: '$responseMs' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        avgResponseMinutes: {
          $round: [{ $divide: ['$avgResponseMs', 60000] }, 1],
        },
      },
    },
  ]);
};

// ─────────────────────────────────────────────
// RESOURCE UTILIZATION
// ─────────────────────────────────────────────
const getResourceUtilization = async () => {
  const byStatus = await Resource.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  const bySubtype = await Resource.aggregate([
    {
      $group: {
        _id: { subtype: '$subtype', status: '$status' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.subtype',
        statuses: { $push: { status: '$_id.status', count: '$count' } },
        total: { $sum: '$count' },
      },
    },
    { $project: { _id: 0, subtype: '$_id', statuses: 1, total: 1 } },
    { $sort: { subtype: 1 } },
  ]);

  return { byStatus, bySubtype };
};

// ─────────────────────────────────────────────
// HOTSPOTS — incidents grouped by ~1km grid cells
// ─────────────────────────────────────────────
const getHotspots = async () => {
  return Incident.aggregate([
    { $match: { status: { $nin: ['closed', 'merged'] } } },
    {
      $project: {
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        severity: 1,
        type: 1,
        publicId: 1,
      },
    },
    {
      $group: {
        _id: {
          lat: { $round: [{ $multiply: ['$lat', 100] }, 0] },
          lng: { $round: [{ $multiply: ['$lng', 100] }, 0] },
        },
        count: { $sum: 1 },
        incidents: {
          $push: {
            publicId: '$publicId',
            type: '$type',
            severity: '$severity',
          },
        },
      },
    },
    { $match: { count: { $gte: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
    {
      $project: {
        _id: 0,
        lat: { $divide: ['$_id.lat', 100] },
        lng: { $divide: ['$_id.lng', 100] },
        count: 1,
        incidents: 1,
      },
    },
  ]);
};

// ─────────────────────────────────────────────
// EVENT TIMELINE
// ─────────────────────────────────────────────
const getRecentEvents = async (limit = 50) => {
  return AnalyticsEvent.find()
    .populate('incidentId', 'publicId type severity priority')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  getOverview,
  getIncidentsByType,
  getIncidentsBySeverity,
  getIncidentsByPriority,
  getResponseTimeTrend,
  getResourceUtilization,
  getHotspots,
  getRecentEvents,
};