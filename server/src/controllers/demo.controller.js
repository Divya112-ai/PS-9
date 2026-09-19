const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const Incident = require('../models/Incident');
const SourceReport = require('../models/SourceReport');
const Alert = require('../models/Alert');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Resource = require('../models/Resource');
const incidentService = require('../services/incident.service');
const { safeEmit } = require('../sockets/socket');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// POST /api/v1/demo/reset
// Wipes incidents, reports, alerts, events.
// Keeps users & resources.
// ─────────────────────────────────────────────
const resetDemo = asyncHandler(async (req, res) => {
  const [incidents, reports, alerts, events] = await Promise.all([
    Incident.deleteMany({}),
    SourceReport.deleteMany({}),
    Alert.deleteMany({}),
    AnalyticsEvent.deleteMany({}),
  ]);

  // Release all resources back to available
  await Resource.updateMany(
    {},
    { status: 'available', assignedIncidentId: null, lastUpdated: new Date() }
  );

  logger.info('Demo reset', {
    incidentsDeleted: incidents.deletedCount,
    reportsDeleted: reports.deletedCount,
    alertsDeleted: alerts.deletedCount,
    eventsDeleted: events.deletedCount,
  });

  safeEmit('demo:reset', { timestamp: new Date() });

  return successResponse(res, {
    message: 'Demo state reset',
    deleted: {
      incidents: incidents.deletedCount,
      reports: reports.deletedCount,
      alerts: alerts.deletedCount,
      events: events.deletedCount,
    },
  });
});

// ─────────────────────────────────────────────
// POST /api/v1/demo/market-fire
// Runs the Market Fire scenario live over ~90s
// ─────────────────────────────────────────────
const runMarketFire = asyncHandler(async (req, res) => {
  const speed = Math.max(1, parseInt(req.query.speed) || 1);

  const timeline = {
    secondReport: 5,
    dispatch: 15,
    enRoute: 30,
    onScene: 45,
    resolved: 60,
  };

  logger.info('Market Fire demo started', { speed });

  // Respond immediately — the scenario runs in the background
  successResponse(res, {
    message: 'Market Fire demo started',
    speed,
    timeline,
    note: 'Watch the dashboard for live updates over the next ~90 seconds.',
  });

  // ─── Run the simulation in the background ───
  setImmediate(async () => {
    try {
      const CENTER = [72.5714, 23.0225];

      // ═══ T+0: Report 1 ═══
      const r1 = await incidentService.createIncident({
        description:
          'Large fire near central market, people trapped, spreading fast',
        location: { coordinates: CENTER },
        address: 'Central Market, Ahmedabad',
        sourceType: 'citizen',
      });
      const incidentId = r1.incident._id;
      const publicId = r1.incident.publicId;
      logger.info(`[DEMO] T+0: Report 1 → ${publicId}`);

      // ═══ T+5s: Report 2 ═══
      setTimeout(async () => {
        try {
          const r2 = await incidentService.createIncident({
            description:
              'Smoke and fire visible near market, spreading, people running',
            location: {
              coordinates: [CENTER[0] + 0.0003, CENTER[1] + 0.0002],
            },
            address: 'Near Central Market',
            sourceType: 'citizen',
          });
          logger.info(
            `[DEMO] T+5: Report 2 → ${r2.incident.publicId}, dups: ${r2.duplicateCandidates.length}`
          );

          // ═══ T+15s: Dispatch ═══
          setTimeout(async () => {
            try {
              const fireTeam = await Resource.findOne({
                subtype: 'fire_team',
                status: 'available',
              });

              if (fireTeam) {
                await incidentService.assignResource(
                  incidentId,
                  fireTeam._id,
                  { role: 'operator' }
                );
                logger.info(`[DEMO] T+15: Dispatched ${fireTeam.publicId}`);
              }

              // ═══ T+30s: EN_ROUTE ═══
              setTimeout(async () => {
                try {
                  await incidentService.updateStatus(
                    incidentId,
                    'en_route',
                    { role: 'responder' }
                  );
                  logger.info('[DEMO] T+30: EN_ROUTE');

                  // ═══ T+45s: ON_SCENE ═══
                  setTimeout(async () => {
                    try {
                      await incidentService.updateStatus(
                        incidentId,
                        'on_scene',
                        { role: 'responder' }
                      );
                      logger.info('[DEMO] T+45: ON_SCENE');

                      // ═══ T+60s: RESOLVED ═══
                      setTimeout(async () => {
                        try {
                          await incidentService.updateStatus(
                            incidentId,
                            'resolved',
                            { role: 'responder' }
                          );
                          logger.info('[DEMO] T+60: RESOLVED');
                          logger.info('✅ Market Fire demo complete');
                        } catch (err) {
                          logger.error('[DEMO] resolve failed', err);
                        }
                      }, 15000);
                    } catch (err) {
                      logger.error('[DEMO] on_scene failed', err);
                    }
                  }, 15000);
                } catch (err) {
                  logger.error('[DEMO] en_route failed', err);
                }
              }, 15000);
            } catch (err) {
              logger.error('[DEMO] dispatch failed', err);
            }
          }, 10000);
        } catch (err) {
          logger.error('[DEMO] report 2 failed', err);
        }
      }, 5000);
    } catch (err) {
      logger.error('[DEMO] Market Fire scenario failed', err);
    }
  });
});

module.exports = {
  resetDemo,
  runMarketFire,
};