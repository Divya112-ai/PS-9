const Incident = require('../models/Incident');
const Resource = require('../models/Resource');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const logger = require('../utils/logger');

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
    Incident.find({ status: 'resolved', resolvedAt: { $ne: null } }).select('createdAt resolvedAt onSceneAt'),
  ]);

  // Average response time = (onSceneAt - createdAt) for resolved incidents
  let avgResponseTime = 0;
  if (resolvedIncidents.length > 0) {
    const totalMs = resolvedIncidents.reduce((sum, i) => {
      const end = i.onSceneAt || i.resolvedAt;
      return sum + (end.getTime() - i.createdAt.getTime());
    }, 0);
    avgResponseTime = totalMs / resolvedIncidents.length / 60000; // minutes
  }

  // Average resolution time = (resolvedAt - createdAt)
  let avgResolutionTime = 0;
  if (resolvedIncidents.length > 0) {
    const totalMs = resolvedIncidents.reduce((sum, i) => {
      return sum + (i.resolvedAt.getTime() - i.createdAt.getTime());
    }, 0);
    avgResolutionTime = totalMs / resolvedIncidents.length / 60000;
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
  const results = await Incident.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ]);
  return results;
};

// ─────────────────────────────────────────────
// INCIDENTS BY SEVERITY
// ─────────────────────────────────────────────
const getIncidentsBySeverity = async () => {
  const results = await Incident.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, severity: '$_id', count: 1 } },
  ]);
  return results;
};

// ─────────────────────────────────────────────
// INCIDENTS BY PRIORITY
// ─────────────────────────────────────────────
const getIncidentsByPriority = async () => {
  const results = await Incident.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, priority: '$_id', count: 1 } },
  ]);
  return results;
};

// ─────────────────────────────────────────────
// RESPONSE TIME TREND — daily averages
// ─────────────────────────────────────────────
const getResponseTimeTrend = async (days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await Incident.aggregate([
    {
      $match: {
        status: 'resolved',
        resolvedAt: { $ne: null, $gte: since },
      },
    },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        responseMs: { $subtract: ['$resolvedAt', '$createdAt'] },
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
        avgResponseMinutes: { $round: [{ $divide: ['$avgResponseMs', 60000] }, 1] },
      },
    },
  ]);

  return results;
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
// HOTSPOTS — incidents grouped by grid cell
// ─────────────────────────────────────────────
const getHotspots = async () => {
  const results = await Incident.aggregate([
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
          // ~1km grid cells (0.01 degrees ≈ 1.1km)
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

  return results;
};

// ─────────────────────────────────────────────
// EVENT TIMELINE — recent analytics events
// ─────────────────────────────────────────────
const getRecentEvents = async (limit = 50) => {
  const events = await AnalyticsEvent.find()
    .populate('incidentId', 'publicId type severity priority')
    .sort({ createdAt: -1 })
    .limit(limit);

  return events;
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