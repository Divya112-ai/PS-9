require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Incident = require('../models/Incident');
const SourceReport = require('../models/SourceReport');
const Resource = require('../models/Resource');
const Alert = require('../models/Alert');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Counter = require('../models/Counter');
const { seedResources } = require('../services/resource.service');

// Ahmedabad center for realistic coordinates
const CENTER = { lng: 72.5714, lat: 23.0225 };
const offset = (lngDelta = 0, latDelta = 0) => [
  CENTER.lng + lngDelta,
  CENTER.lat + latDelta,
];

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────
const seedUsers = async () => {
  console.log('  → Seeding users...');

  await User.deleteMany({});
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await User.create([
    {
      name: 'System Admin',
      email: 'admin@ps9.local',
      passwordHash,
      role: 'admin',
      organization: 'PS-9 Command Center',
    },
    {
      name: 'Operator One',
      email: 'operator@ps9.local',
      passwordHash,
      role: 'operator',
      organization: 'Ahmedabad Emergency Operations',
    },
    {
      name: 'Operator Two',
      email: 'operator2@ps9.local',
      passwordHash,
      role: 'operator',
      organization: 'Ahmedabad Emergency Operations',
    },
    {
      name: 'Fire Captain A',
      email: 'responder1@ps9.local',
      passwordHash,
      role: 'responder',
      responderType: 'fire',
      organization: 'Ahmedabad Fire Services',
    },
    {
      name: 'Paramedic B',
      email: 'responder2@ps9.local',
      passwordHash,
      role: 'responder',
      responderType: 'medical',
      organization: 'Ahmedabad Ambulance Services',
    },
    {
      name: 'Citizen Demo',
      email: 'citizen@ps9.local',
      passwordHash,
      role: 'citizen',
    },
  ]);

  console.log(`  ✓ Created ${users.length} users`);
  console.log(`    Login with: admin@ps9.local / password123`);
  return users;
};

// ─────────────────────────────────────────────
// Incidents
// ─────────────────────────────────────────────
const seedIncidents = async (users, resources) => {
  console.log('  → Seeding incidents...');

  await Incident.deleteMany({});
  await SourceReport.deleteMany({});
  await Alert.deleteMany({});
  await AnalyticsEvent.deleteMany({});
  await Counter.deleteMany({});

  // ─────────────────────────────────────────────
  // FIX: Reserve counter slots for the 3 seeded incidents + reports
  // so the next auto-generated ID is INC-10004 / REP-10004, not 10001.
  // ─────────────────────────────────────────────
  await Counter.create([
    { _id: 'incident', seq: 3 },
    { _id: 'report', seq: 3 },
  ]);

  const operator = users.find((u) => u.email === 'operator@ps9.local');

  const incidents = [
    // Historical, resolved
    {
      publicId: 'INC-10001',
      type: 'medical',
      severity: 'high',
      priority: 'P2',
      status: 'resolved',
      description: 'Elderly man collapsed at bus stop, difficulty breathing',
      location: { type: 'Point', coordinates: offset(0.01, 0.005) },
      address: 'Lal Darwaja Bus Stop',
      ai: {
        classified: true,
        confidence: 0.91,
        summary: 'Medical emergency at bus stop, patient conscious but in distress.',
        recommendedActions: ['Dispatch ambulance', 'Alert nearest hospital'],
        source: 'ai',
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60 * 1000),
      onSceneAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 7 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000),
      escalationLevel: 0,
      reportedBy: operator._id,
    },
    // Historical, resolved
    {
      publicId: 'INC-10002',
      type: 'accident',
      severity: 'high',
      priority: 'P2',
      status: 'resolved',
      description: 'Two-car collision on ring road, one person injured',
      location: { type: 'Point', coordinates: offset(-0.02, 0.008) },
      address: 'SG Highway Ring Road',
      ai: {
        classified: true,
        confidence: 0.88,
        summary: 'Vehicle collision with minor injuries reported.',
        recommendedActions: ['Dispatch ambulance', 'Traffic control needed'],
        source: 'ai',
      },
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
      assignedAt: new Date(Date.now() - 90 * 60 * 1000 + 90 * 1000),
      onSceneAt: new Date(Date.now() - 90 * 60 * 1000 + 6 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 90 * 60 * 1000 + 25 * 60 * 1000),
      escalationLevel: 0,
      reportedBy: operator._id,
    },
    // Active — a P3 awaiting dispatch
    {
      publicId: 'INC-10003',
      type: 'structural',
      severity: 'medium',
      priority: 'P3',
      status: 'classified',
      description: 'Wall crack reported in residential building, no collapse',
      location: { type: 'Point', coordinates: offset(0.015, -0.01) },
      address: 'Maninagar Residency',
      ai: {
        classified: true,
        confidence: 0.72,
        summary: 'Structural concern reported, no immediate danger.',
        recommendedActions: ['Send engineer for assessment'],
        source: 'ai',
      },
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
      escalationLevel: 0,
      reportedBy: null,
    },
  ];

  const created = await Incident.create(incidents);

  // Create source reports for each
  for (const inc of created) {
    const report = await SourceReport.create({
      publicId: `REP-${inc.publicId.replace('INC-', '')}`,
      incidentId: inc._id,
      sourceType: 'citizen',
      description: inc.description,
      location: inc.location,
    });
    inc.sourceReports.push(report._id);
    await inc.save();
  }

  console.log(`  ✓ Created ${created.length} incidents (2 resolved, 1 active)`);
  return created;
};

// ─────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────
const seedAlerts = async (incidents) => {
  console.log('  → Seeding alerts...');

  const activeIncident = incidents.find((i) => i.status !== 'resolved');
  if (!activeIncident) return;

  await Alert.create([
    {
      incidentId: activeIncident._id,
      type: 'info',
      severity: 'warning',
      message: `⚠️ ${activeIncident.priority} incident ${activeIncident.publicId} awaiting assignment`,
      acknowledged: false,
    },
  ]);

  console.log('  ✓ Created 1 demo alert');
};

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const runSeed = async () => {
  try {
    console.log('🌱 Starting seed...\n');

    console.log('📦 Step 1: Users');
    const users = await seedUsers();

    console.log('\n📦 Step 2: Resources');
    const resourceResult = await seedResources();
    console.log(`  ✓ Resources: created=${resourceResult.created}, skipped=${resourceResult.skipped}`);
    const resources = await Resource.find({});

    console.log('\n📦 Step 3: Incidents');
    const incidents = await seedIncidents(users, resources);

    console.log('\n📦 Step 4: Alerts');
    await seedAlerts(incidents);

    console.log('\n✅ Seed complete!\n');
    console.log('📋 Test credentials:');
    console.log('   Admin:     admin@ps9.local      / password123');
    console.log('   Operator:  operator@ps9.local   / password123');
    console.log('   Responder: responder1@ps9.local / password123');
    console.log('   Citizen:   citizen@ps9.local    / password123');
    console.log('\n🔢 Counters set: next incident = INC-10004, next report = REP-10004');
    console.log('\n🎬 Ready for demo. Run `npm run dev` and open the dashboard.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
};

// Connect then run
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}\n`);
    return runSeed();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });