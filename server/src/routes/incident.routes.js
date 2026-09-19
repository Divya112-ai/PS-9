const express = require('express');
const ctrl = require('../controllers/incident.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Public ───
router.post('/', ctrl.createIncident);  // citizen submission — no auth

// ─── Authenticated (any logged-in user) ───
router.get('/', requireAuth, ctrl.listIncidents);
router.get('/:id', requireAuth, ctrl.getIncident);
router.get('/:id/recommendations', requireAuth, ctrl.getRecommendations);

// ─── Operator / Admin / Responder only ───
router.post(
  '/:id/assign',
  requireAuth,
  requireRole('operator', 'admin'),
  ctrl.assignResource
);

router.post(
  '/:id/merge',
  requireAuth,
  requireRole('operator', 'admin'),
  ctrl.mergeIncidents
);

// Status updates: responders and operators can change status
router.post(
  '/:id/status',
  requireAuth,
  requireRole('operator', 'admin', 'responder'),
  ctrl.updateStatus
);

module.exports = router;