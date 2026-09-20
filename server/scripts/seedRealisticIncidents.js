const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Incident = require('../src/models/Incident');
const Resource = require('../src/models/Resource');

// Incident templates — realistic descriptions per type
const TEMPLATES = {
  fire: {
    descriptions: [
      'Smoke visible from top floor of commercial building',
      'Kitchen fire in restaurant, staff evacuated',
      'Vehicle fire on highway shoulder, no injuries',
      'Electrical fire in residential apartment block',
      'Small brush fire near industrial area',
    ],
    severities: ['medium', 'high', 'critical'],
  },
  medical: {
    descriptions: [
      'Person collapsed on street, unresponsive',
      'Chest pain reported by elderly resident',
      'Multiple people sick after food consumption at event',
      'Road accident victim needs ambulance',
      'Difficulty breathing, possible asthma attack',
    ],
    severities: ['medium', 'high', 'critical'],
  },
  accident: {
    descriptions: [
      'Two-vehicle collision at intersection, injuries reported',
      'Motorcycle skidded on wet road, rider injured',
      'Truck overturned on ring road, blocking traffic',
      'Pedestrian hit near market, conscious but injured',
      'Three-car pileup during morning rush',
    ],
    severities: ['medium', 'high', 'critical'],
  },
  structural: {
    descriptions: [
      'Cracks visible in wall of old residential building',
      'Ceiling plaster fell in school classroom, no injuries',
      'Balcony railing loose on 4th floor apartment',
      'Wall collapse in construction site, workers safe',
      'Water seepage causing structural concern in basement',
    ],
    severities: ['low', 'medium', 'high'],
  },
  flood: {
    descriptions: [
      'Waterlogging on main road, vehicles stuck',
      'Basement flooded after heavy rain',
      'Underpass submerged, traffic diverted',
      'Low-lying residential area flooded waist-deep',
      'Storm drain overflow near market area',
    ],
    severities: ['medium', 'high'],
  },
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function jitter(coord, amount = 0.008) {
  return coord + (Math.random() - 0.5) * amount;
}
function hoursAgo(maxHours) {
  return new Date(Date.now() - Math.random() * maxHours * 60 * 60 * 1000);
}

const PRIORITY_BY_SEVERITY = {
  critical: 'P1',
  high: 'P2',
  medium: 'P3',
  low: 'P4',
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // Grab real Ahmedabad locations as the anchor points
  const resources = await Resource.find({
    publicId: { $regex: /^(HOSP|PU|FT)-/ },
  }).limit(50);

  if (resources.length === 0) {
    console.error('No OSM resources found. Run importOsmResources.js first.');
    process.exit(1);
  }
  console.log('Using', resources.length, 'real resources as anchor points');

  // Figure out the next publicId number
  const last = await Incident.findOne({}).sort({ publicId: -1 }).select('publicId');
  let nextNum = 10000;
  if (last?.publicId) {
    const n = parseInt(last.publicId.replace('INC-', ''), 10);
    if (!isNaN(n)) nextNum = n + 1;
  }

  const types = Object.keys(TEMPLATES);
  const incidents = [];
  const COUNT = 50;

  for (let i = 0; i < COUNT; i++) {
    const anchor = pick(resources);
    const [lon, lat] = anchor.location.coordinates;
    const type = pick(types);
    const tpl = TEMPLATES[type];
    const severity = pick(tpl.severities);
    const description = pick(tpl.descriptions);

    // Randomize status distribution — more resolved in past, more active recently
    const reported = hoursAgo(14 * 24); // last 14 days
    const ageHours = (Date.now() - reported.getTime()) / 3600000;

    let status;
    if (ageHours > 48) status = 'resolved';
    else if (ageHours > 12) status = 'on_scene';
    else if (ageHours > 4) status = 'en_route';
    else if (ageHours > 1) status = 'assigned';
    else if (ageHours > 0.2) status = 'classified';
    else status = 'reported';

    incidents.push({
      publicId: `INC-${nextNum + i}`,
      type,
      severity,
      priority: PRIORITY_BY_SEVERITY[severity],
      status,
      description,
      location: {
        type: 'Point',
        coordinates: [jitter(lon), jitter(lat)],
      },
      ai: {
        classified: true,
        source: 'rules_fallback',
        confidence: 0.7 + Math.random() * 0.25,
        summary: description,
        recommendedActions: [],
      },
      reportedAt: reported,
      assignedAt: ['assigned', 'en_route', 'on_scene', 'resolved'].includes(status)
        ? new Date(reported.getTime() + 5 * 60 * 1000)
        : null,
      onSceneAt: ['on_scene', 'resolved'].includes(status)
        ? new Date(reported.getTime() + 25 * 60 * 1000)
        : null,
      resolvedAt: status === 'resolved'
        ? new Date(reported.getTime() + 45 * 60 * 1000)
        : null,
    });
  }

  await Incident.insertMany(incidents);
  console.log('Inserted', incidents.length, 'realistic incidents');

  // Summary
  const byType = {};
  const bySeverity = {};
  const byStatus = {};
  incidents.forEach((i) => {
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  });
  console.log('By type:', byType);
  console.log('By severity:', bySeverity);
  console.log('By status:', byStatus);

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });