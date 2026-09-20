const express = require('express');
const ctrl = require('../controllers/resource.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Authenticated users can view resources
router.get('/', requireAuth, ctrl.listResources);
router.get('/:id', requireAuth, ctrl.getResource);

// Only operators/admins can change status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('operator', 'admin', 'responder'),
  ctrl.updateStatus
);

// Only admins can seed
router.post(
  '/seed',
  requireAuth,
  requireRole('admin'),
  ctrl.seedResources
);

router.patch(
  '/:id/location',
  requireAuth,
  requireRole('operator', 'admin'),
  ctrl.updateLocation
);

module.exports = router;