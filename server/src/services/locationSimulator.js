const Resource = require('../models/Resource');
const Incident = require('../models/Incident');
const { safeEmit } = require('../sockets/socket');

// Haversine distance in km
function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Move point a fraction of the way toward target
function stepToward(from, to, fraction) {
  return [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction,
  ];
}

// ─── Tunables ───
// STEP_FRACTION: how much of the remaining distance to cover per tick
// TICK_MS: how often the simulator runs
// Demo mode: 0.20 / 2000 = arrives in ~15-20 seconds
// Realistic: 0.08 / 4000 = arrives in ~40-60 seconds
const STEP_FRACTION = 0.20;
const TICK_MS = 2000;

let timer = null;
let tickCount = 0;

async function tick() {
  tickCount += 1;

  try {
    const moving = await Resource.find({
      status: { $in: ['assigned', 'en_route'] },
      assignedIncidentId: { $ne: null },
    }).populate('assignedIncidentId');

    // Log every 5th tick to avoid spamming the console when nothing is moving
    if (moving.length > 0 || tickCount % 5 === 0) {
      console.log(
        `[sim] tick #${tickCount} — found ${moving.length} moving resource(s)`
      );
    }

    if (moving.length === 0) return;

    for (const resource of moving) {
      const incident = resource.assignedIncidentId;

      console.log(
        `[sim]   ${resource.publicId} (${resource.name}) — status=${resource.status} — incident=${
          incident ? incident.publicId : 'NULL / BROKEN REF'
        } — coords=${JSON.stringify(resource.location.coordinates)}`
      );

      if (!incident) {
        console.log(`[sim]   ↳ skipped: incident reference is NULL`);
        continue;
      }

      if (!incident.location?.coordinates) {
        console.log(`[sim]   ↳ skipped: incident has no coordinates`);
        continue;
      }

      const from = resource.location.coordinates;
      const to = incident.location.coordinates;
      const remainingKm = haversine(from, to);

      console.log(
        `[sim]   ↳ distance to incident: ${remainingKm.toFixed(3)} km`
      );

      // ─── Arrived ───
      if (remainingKm < 0.15) {
        resource.location.coordinates = to;
        resource.status = 'on_scene';
        resource.lastUpdated = new Date();
        await resource.save();

        if (incident.status === 'en_route' || incident.status === 'assigned') {
          incident.status = 'on_scene';
          incident.onSceneAt = new Date();
          await incident.save();
        }

        safeEmit('resource:updated', resource.toObject());
        safeEmit('incident:updated', incident.toObject());
        console.log(
          `[sim]   ✅ ${resource.publicId} ARRIVED at ${incident.publicId}`
        );
        continue;
      }

      // ─── In transit ───
      const nextCoords = stepToward(from, to, STEP_FRACTION);
      resource.location.coordinates = nextCoords;

      // Promote status on first move
      if (resource.status === 'assigned') {
        resource.status = 'en_route';
        if (incident.status === 'assigned') {
          incident.status = 'en_route';
          await incident.save();
          safeEmit('incident:updated', incident.toObject());
        }
      }

      resource.lastUpdated = new Date();
      await resource.save();

      const etaMinutes = Math.max(1, Math.round((remainingKm / 30) * 60));

      safeEmit('resource:location:updated', {
        resourceId: resource._id,
        location: resource.location,
        status: resource.status,
        lastUpdated: resource.lastUpdated,
        distanceKm: remainingKm,
        etaMinutes,
      });

      console.log(
        `[sim]   ➡️  ${resource.publicId} moved to ${JSON.stringify(
          nextCoords
        )} (ETA ${etaMinutes}m)`
      );
    }
  } catch (err) {
    console.error('[locationSimulator] tick failed:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

function startLocationSimulator() {
  if (timer) return;
  console.log(
    `🚑 Location simulator started (tick ${TICK_MS}ms, step ${STEP_FRACTION})`
  );
  timer = setInterval(tick, TICK_MS);
  tick(); // run once immediately
}

function stopLocationSimulator() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('🛑 Location simulator stopped');
  }
}

module.exports = { startLocationSimulator, stopLocationSimulator };