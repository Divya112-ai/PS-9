const express = require('express');
const ctrl = require('../controllers/alert.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All alert routes require auth
router.get('/', requireAuth, ctrl.listAlerts);
router.get('/:id', requireAuth, ctrl.getAlert);

// Only operators/admins can acknowledge
router.patch(
  '/:id/acknowledge',
  requireAuth,
  requireRole('operator', 'admin'),
  ctrl.acknowledge
);

module.exports = router;