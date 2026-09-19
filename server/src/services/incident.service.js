const Incident = require('../models/Incident');
const SourceReport = require('../models/SourceReport');
const Resource = require('../models/Resource');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { classifyWithAI } = require('./ai.service');
const { findDuplicateCandidates } = require('./duplicate.service');
const { recommendResources } = require('./resource.service');
const { generateIncidentId, generateReportId } = require('../utils/generateId');

// ─────────────────────────────────────────────
// CREATE — the main orchestration
// ─────────────────────────────────────────────
const createIncident = async (payload, actor = null) => {
  const { description, location, address, sourceType = 'citizen' } = payload;

  // 1. Validate
  if (!description || typeof description !== 'string' || !description.trim()) {
    throw ApiError.badRequest('Description is required', 'MISSING_DESCRIPTION');
  }
  if (!location?.coordinates || location.coordinates.length !== 2) {
    throw ApiError.badRequest('Location with [lng, lat] is required', 'MISSING_LOCATION');
  }

  const [lng, lat] = location.coordinates;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw ApiError.badRequest('Invalid coordinates', 'INVALID_COORDINATES');
  }

  // 2. Classify (AI → fallback rules)
  logger.info('Classifying incident', { preview: description.slice(0, 60) });
  const classification = await classifyWithAI(description, location);
  logger.info('Classification result', {
    type: classification.type,
    severity: classification.severity,
    source: classification.source,
  });

  // 3. Find duplicate candidates BEFORE creating
  const duplicateCandidates = await findDuplicateCandidates({
    description,
    location,
  });

  // 4. Create incident
  const incident = await Incident.create({
    publicId: await generateIncidentId(),
    type: classification.type,
    severity: classification.severity,
    priority: classification.priority,
    status: 'classified',
    description: description.trim(),
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    address: address || null,
    ai: {
      classified: true,
      confidence: classification.confidence,
      summary: classification.summary,
      recommendedActions: classification.recommendedActions,
      source: classification.source,
    },
    duplicateCandidates: duplicateCandidates.map((c) => ({
      incidentId: c.incidentId,
      score: c.score,
    })),
    reportedBy: actor?.id || null,
  });

  // 5. Create source report (raw, immutable record)
  const report = await SourceReport.create({
    publicId: await generateReportId(),
    incidentId: incident._id,
    sourceType,
    description: description.trim(),
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    address: address || null,
  });

  // 6. Link report to incident
  incident.sourceReports.push(report._id);
  await incident.save();

  // 7. Log analytics event
  await AnalyticsEvent.create({
    incidentId: incident._id,
    eventType: 'reported',
    actorType: actor?.role || 'citizen',
    actorId: actor?.id || null,
    metadata: { source: classification.source },
  });

  logger.info('Incident created', {
    publicId: incident.publicId,
    type: incident.type,
    priority: incident.priority,
    duplicateCount: duplicateCandidates.length,
  });

  return {
    incident: incident.toObject(),
    duplicateCandidates,
    trackingId: report.publicId,
    classification: {
      source: classification.source,
      confidence: classification.confidence,
      model: classification.model || null,
    },
  };
};

// ─────────────────────────────────────────────
// LIST — with filters
// ─────────────────────────────────────────────
const listIncidents = async (filters = {}) => {
  const query = {};

  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim());
    query.status = { $in: statuses };
  }
  if (filters.severity) {
    const severities = filters.severity.split(',').map((s) => s.trim());
    query.severity = { $in: severities };
  }
  if (filters.priority) {
    const priorities = filters.priority.split(',').map((s) => s.trim());
    query.priority = { $in: priorities };
  }
  if (filters.type) {
    query.type = filters.type;
  }
  if (filters.active === 'true') {
    query.status = { $nin: ['resolved', 'closed', 'merged'] };
  }

  const limit = Math.min(parseInt(filters.limit) || 100, 500);
  const skip = parseInt(filters.skip) || 0;

  const [incidents, total] = await Promise.all([
    Incident.find(query)
      .populate('assignedResources', 'publicId name subtype status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Incident.countDocuments(query),
  ]);

  return { incidents, total, limit, skip };
};

// ─────────────────────────────────────────────
// GET one by ID (accepts ObjectId OR publicId)
// ─────────────────────────────────────────────
const getIncidentById = async (idOrPublicId) => {
  const query = idOrPublicId.startsWith('INC-')
    ? { publicId: idOrPublicId }
    : { _id: idOrPublicId };

  const incident = await Incident.findOne(query)
    .populate('assignedResources', 'publicId name subtype status location capabilities')
    .populate('sourceReports', 'publicId sourceType description attachmentUrl createdAt');

  if (!incident) {
    throw ApiError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');
  }

  return incident;
};

// ─────────────────────────────────────────────
// ASSIGN a resource (dispatch)
// ─────────────────────────────────────────────
const assignResource = async (incidentId, resourceId, actor) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw ApiError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');

  const resource = await Resource.findById(resourceId);
  if (!resource) throw ApiError.notFound('Resource not found', 'RESOURCE_NOT_FOUND');

  if (resource.status !== 'available') {
    throw ApiError.conflict(
      `Resource is ${resource.status}, not available`,
      'RESOURCE_UNAVAILABLE'
    );
  }

  if (incident.status === 'resolved' || incident.status === 'closed') {
    throw ApiError.conflict('Cannot assign to a resolved incident', 'INCIDENT_CLOSED');
  }

  // Update resource
  resource.status = 'assigned';
  resource.assignedIncidentId = incident._id;
  resource.lastUpdated = new Date();
  await resource.save();

  // Update incident
  incident.assignedResources.push(resource._id);
  if (incident.status === 'reported' || incident.status === 'classified') {
    incident.status = 'assigned';
    incident.assignedAt = new Date();
  }
  await incident.save();

  // Analytics
  await AnalyticsEvent.create({
    incidentId: incident._id,
    eventType: 'assigned',
    actorType: actor?.role || 'operator',
    actorId: actor?.id || null,
    metadata: { resourceId: resource._id, resourcePublicId: resource.publicId },
  });

  logger.info('Resource assigned', {
    incident: incident.publicId,
    resource: resource.publicId,
  });

  return { incident, resource };
};

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────
const VALID_STATUS_TRANSITIONS = {
  reported: ['classified', 'merged'],
  classified: ['assigned', 'merged'],
  assigned: ['en_route', 'on_scene', 'merged'],
  en_route: ['on_scene'],
  on_scene: ['resolved'],
  resolved: ['closed'],
  closed: [],
  merged: [],
};

const updateStatus = async (incidentId, newStatus, actor, notes = null) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw ApiError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');

  const allowed = VALID_STATUS_TRANSITIONS[incident.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${incident.status} to ${newStatus}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const previousStatus = incident.status;
  incident.status = newStatus;

  // Set timestamps for milestones
  if (newStatus === 'on_scene' && !incident.onSceneAt) incident.onSceneAt = new Date();
  if (newStatus === 'resolved' && !incident.resolvedAt) incident.resolvedAt = new Date();
  if (newStatus === 'closed' && !incident.closedAt) incident.closedAt = new Date();

  await incident.save();

  // If resolving, also release resources
  if (newStatus === 'resolved' || newStatus === 'closed') {
    await Resource.updateMany(
      { assignedIncidentId: incident._id },
      { $set: { status: 'available', assignedIncidentId: null, lastUpdated: new Date() } }
    );
  }

  // Analytics
  await AnalyticsEvent.create({
    incidentId: incident._id,
    eventType: newStatus,
    actorType: actor?.role || 'operator',
    actorId: actor?.id || null,
    metadata: { previousStatus, notes },
  });

  logger.info('Incident status updated', {
    publicId: incident.publicId,
    from: previousStatus,
    to: newStatus,
  });

  return incident;
};

// ─────────────────────────────────────────────
// MERGE duplicate reports
// ─────────────────────────────────────────────
const mergeIncidents = async (targetId, sourceId, actor) => {
  if (targetId.toString() === sourceId.toString()) {
    throw ApiError.badRequest('Cannot merge incident into itself', 'SELF_MERGE');
  }

  const target = await Incident.findById(targetId);
  const source = await Incident.findById(sourceId);

  if (!target) throw ApiError.notFound('Target incident not found', 'TARGET_NOT_FOUND');
  if (!source) throw ApiError.notFound('Source incident not found', 'SOURCE_NOT_FOUND');

  if (source.status === 'merged') {
    throw ApiError.conflict('Source is already merged', 'ALREADY_MERGED');
  }

  // Move source reports to target
  target.sourceReports.push(...source.sourceReports);

  // Append source description as additional context
  target.description = `${target.description}\n\n[Merged from ${source.publicId}]: ${source.description}`;

  // Merge duplicate candidates (dedupe by incidentId)
  const existingCandidateIds = new Set(
    target.duplicateCandidates.map((c) => c.incidentId.toString())
  );
  for (const dup of source.duplicateCandidates) {
    if (!existingCandidateIds.has(dup.incidentId.toString())) {
      target.duplicateCandidates.push(dup);
    }
  }

  // Remove self from candidate list if present
  target.duplicateCandidates = target.duplicateCandidates.filter(
    (c) => c.incidentId.toString() !== target._id.toString()
  );

  await target.save();

  // Mark source as merged
  source.status = 'merged';
  source.mergedInto = target._id;
  await source.save();

  // Analytics
  await AnalyticsEvent.create({
    incidentId: target._id,
    eventType: 'merged',
    actorType: actor?.role || 'operator',
    actorId: actor?.id || null,
    metadata: { mergedFrom: source.publicId },
  });

  logger.info('Incidents merged', {
    target: target.publicId,
    source: source.publicId,
  });

  return { target, source };
};

// ─────────────────────────────────────────────
// RECOMMENDATIONS — delegate to resource service
// ─────────────────────────────────────────────
const getRecommendations = async (incidentId) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) throw ApiError.notFound('Incident not found', 'INCIDENT_NOT_FOUND');

  return recommendResources(incident);
};

module.exports = {
  createIncident,
  listIncidents,
  getIncidentById,
  assignResource,
  updateStatus,
  mergeIncidents,
  getRecommendations,
};