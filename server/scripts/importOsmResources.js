const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Resource = require('../src/models/Resource');

const AMENITY_MAP = {
  fire_station: {
    type: 'team',
    subtype: 'fire_team',
    prefix: 'FT',
    capabilities: ['fire_suppression', 'rescue'],
    limit: 20,
  },
  hospital: {
    type: 'hospital',
    subtype: 'hospital',
    prefix: 'HOSP',
    capabilities: ['medical', 'emergency_care'],
    limit: 40,
  },
  police: {
    type: 'team',
    subtype: 'police',
    prefix: 'PU',
    capabilities: ['law_enforcement', 'security'],
    limit: 30,
  },
};

const SKIP_NAME_PATTERNS = [
  /clinic/i,
  /dental/i,
  /eye\s*(care|hospital)/i,
  /ortho/i,
  /fertility/i,
  /ivf/i,
  /ayurved/i,
  /homeopath/i,
  /vet(erinary)?/i,
  /diagnostic/i,
  /pathology/i,
  /pharmacy/i,
  /medical\s*store/i,
  /polyclinic/i,
];

function shouldSkip(name) {
  if (!name) return true;
  return SKIP_NAME_PATTERNS.some((re) => re.test(name));
}

async function main() {
  const rawPath = path.join(__dirname, 'ahmedabad_raw.json');
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const features = raw.features || [];
  console.log('Features in file:', features.length);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const byAmenity = { fire_station: [], hospital: [], police: [] };

  for (const f of features) {
    const amenity = f.properties?.amenity;
    if (!AMENITY_MAP[amenity]) continue;

    if (amenity === 'hospital') {
      const name = f.properties?.name;
      if (!name || shouldSkip(name)) continue;
    }

    byAmenity[amenity].push(f);
  }

  console.log('After filtering:');
  console.log('  Fire stations:', byAmenity.fire_station.length);
  console.log('  Hospitals (real):', byAmenity.hospital.length);
  console.log('  Police stations:', byAmenity.police.length);

  const resources = [];
  const counters = { fire_team: 0, hospital: 0, police: 0 };

  for (const amenity of Object.keys(byAmenity)) {
    const mapping = AMENITY_MAP[amenity];
    const items = byAmenity[amenity].slice(0, mapping.limit);

    for (const f of items) {
      const geom = f.geometry;
      if (!geom) continue;

      let coords = null;
      if (geom.type === 'Point') coords = geom.coordinates;
      else if (geom.type === 'Polygon') coords = geom.coordinates?.[0]?.[0];
      else if (geom.type === 'MultiPolygon') coords = geom.coordinates?.[0]?.[0]?.[0];
      if (!coords || coords.length < 2) continue;

      const lon = coords[0];
      const lat = coords[1];
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) continue;

      counters[mapping.subtype] += 1;
      const publicId = mapping.prefix + '-' + String(counters[mapping.subtype]).padStart(3, '0');

      resources.push({
        publicId: publicId,
        type: mapping.type,
        subtype: mapping.subtype,
        name: f.properties?.name || mapping.subtype + ' ' + publicId,
        status: 'available',
        capabilities: mapping.capabilities,
        location: { type: 'Point', coordinates: [lon, lat] },
        capacity: mapping.type === 'hospital' ? 100 : 1,
        contactNumber: f.properties?.phone || null,
      });
    }
  }

  if (resources.length === 0) {
    console.error('Parsed 0 resources.');
    process.exit(1);
  }

  const delResult = await mongoose.connection.db
    .collection('resources')
    .deleteMany({ publicId: { $regex: /^(FT|HOSP|PU)-/ } });
  console.log('Cleaned', delResult.deletedCount, 'old OSM resources');

  await Resource.insertMany(resources);

  console.log('');
  console.log('Imported', resources.length, 'resources:');
  console.log('  Fire teams:', counters.fire_team);
  console.log('  Hospitals:', counters.hospital);
  console.log('  Police:', counters.police);

  await mongoose.disconnect();
}

main().catch(function (err) { console.error(err); process.exit(1); });