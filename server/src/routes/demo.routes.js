const express = require('express');
const ctrl = require('../controllers/demo.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Only admins / operators can run demos
router.use(requireAuth, requireRole('admin', 'operator'));

router.post('/reset', ctrl.resetDemo);
router.post('/market-fire', ctrl.runMarketFire);

module.exports = router;