const cron = require('node-cron');
const Incident = require('../models/Incident');
const alertService = require('./alert.service');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// Config — reads from env, falls back to defaults
// ─────────────────────────────────────────────
const readConfig = () => ({
  P1: {
    warningMinutes: parseInt(process.env.ESCALATION_P1_WARNING, 10) || 2,
    criticalMinutes: parseInt(process.env.ESCALATION_P1_CRITICAL, 10) || 5,
  },
  P2: {
    warningMinutes: parseInt(process.env.ESCALATION_P2_WARNING, 10) || 5,
    criticalMinutes: parseInt(process.env.ESCALATION_P2_CRITICAL, 10) || 10,
  },
  P3: {
    warningMinutes: parseInt(process.env.ESCALATION_P3_WARNING, 10) || 15,
    criticalMinutes: parseInt(process.env.ESCALATION_P3_CRITICAL, 10) || 30,
  },
  P4: {
    warningMinutes: parseInt(process.env.ESCALATION_P4_WARNING, 10) || 30,
    criticalMinutes: parseInt(process.env.ESCALATION_P4_CRITICAL, 10) || 60,
  },
});

// ─────────────────────────────────────────────
// Main check — runs every minute
// ─────────────────────────────────────────────
const checkEscalations = async () => {
  if (process.env.ESCALATION_ENABLED === 'false') {
    return;  // silently skip if disabled
  }

  const config = readConfig();
  const startTime = Date.now();

  try {
    // Only active incidents need escalation checks
    const activeIncidents = await Incident.find({
      status: { $nin: ['resolved', 'closed', 'merged'] },
    });

    if (activeIncidents.length === 0) return;

    let escalated = 0;

    for (const incident of activeIncidents) {
      const thresholds = config[incident.priority];
      if (!thresholds) continue;

      const ageMinutes = (Date.now() - new Date(incident.createdAt).getTime()) / 60000;

      // Has a resource already been dispatched? If yes, skip.
      const hasAssignment = incident.assignedResources.length > 0;

      // Figure out the level the incident SHOULD be at
      let targetLevel = 0;
      if (ageMinutes >= thresholds.criticalMinutes) targetLevel = 2;
      else if (ageMinutes >= thresholds.warningMinutes) targetLevel = 1;

      // If a resource was assigned, we don't escalate for delayed response
      // (the assignment already happened). But we still keep the level.
      if (hasAssignment && targetLevel > incident.escalationLevel) {
        // Assignment came before threshold — suppress the escalation
        continue;
      }

      // Never regress, never fire the same level twice
      if (targetLevel <= incident.escalationLevel) continue;

      // Fire the new level
      const severity = targetLevel === 2 ? 'critical' : 'warning';
      const message =
        targetLevel === 2
          ? `🚨 CRITICAL: ${incident.priority} incident ${incident.publicId} has not received a response for ${Math.round(ageMinutes)} minutes`
          : `⚠️ WARNING: ${incident.priority} incident ${incident.publicId} approaching response deadline (${Math.round(ageMinutes)} min)`;

      await alertService.createAlert({
        incidentId: incident._id,
        type: 'delayed_response',
        severity,
        message,
      });

      incident.escalationLevel = targetLevel;
      await incident.save();

      // Broadcast the updated incident
      try {
        const { safeEmit } = require('../sockets/socket');
        safeEmit('incident:updated', incident.toObject());
      } catch {
        // Socket not available — ignore
      }

      escalated++;
      logger.info(`Escalation fired (${severity})`, {
        publicId: incident.publicId,
        priority: incident.priority,
        ageMinutes: Math.round(ageMinutes),
        level: targetLevel,
      });
    }

    if (escalated > 0) {
      logger.info(`Escalation check complete — ${escalated} escalation(s) fired`, {
        activeCount: activeIncidents.length,
        elapsedMs: Date.now() - startTime,
      });
    } else {
      logger.debug('Escalation check complete — no escalations needed', {
        activeCount: activeIncidents.length,
      });
    }
  } catch (err) {
    logger.error('Escalation check failed', err);
  }
};

// ─────────────────────────────────────────────
// Scheduler
// ─────────────────────────────────────────────
let task = null;

const startEscalationCron = () => {
  if (process.env.ESCALATION_ENABLED === 'false') {
    logger.info('Escalation cron disabled by env var');
    return;
  }

  if (task) {
    logger.warn('Escalation cron already running');
    return;
  }

  // Run every minute at second 0: '* * * * *'
  // For quick demo, could use '* * * * * *' (every second) — but not recommended
  task = cron.schedule('* * * * *', checkEscalations, {
    scheduled: true,
    timezone: 'UTC',
  });

  logger.info('Escalation cron started (every minute)');
};

const stopEscalationCron = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info('Escalation cron stopped');
  }
};

module.exports = {
  startEscalationCron,
  stopEscalationCron,
  checkEscalations,  // exported for manual testing
};