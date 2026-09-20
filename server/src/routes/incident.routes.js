const express = require('express');
const ctrl = require('../controllers/incident.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// Optional auth middleware — attaches user if token present, but doesn't block
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
  } catch {
    // invalid token — treat as anonymous
  }
  next();
};

const router = express.Router();

// ─── Public (with optional auth to capture citizen identity) ───
router.post('/', optionalAuth, ctrl.createIncident);  // citizen submission

// ─── Authenticated (any logged-in user) ───
router.get('/my-reports', requireAuth, ctrl.getMyReports);   // citizen: own reports
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