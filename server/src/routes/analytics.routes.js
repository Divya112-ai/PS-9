const express = require('express');
const ctrl = require('../controllers/analytics.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All analytics requires auth (operator/admin)
router.use(requireAuth, requireRole('operator', 'admin'));

router.get('/overview', ctrl.getOverview);
router.get('/types', ctrl.getTypes);
router.get('/severity', ctrl.getSeverity);
router.get('/priority', ctrl.getPriority);
router.get('/response-time', ctrl.getResponseTime);
router.get('/resources', ctrl.getResources);
router.get('/hotspots', ctrl.getHotspots);
router.get('/events', ctrl.getRecentEvents);

module.exports = router;