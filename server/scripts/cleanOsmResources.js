const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const result = await mongoose.connection.db
    .collection('resources')
    .deleteMany({ publicId: { $regex: /^(FT|HOSP|PU)-/ } });

  console.log(`🗑️  Deleted ${result.deletedCount} OSM resources`);

  const remaining = await mongoose.connection.db.collection('resources').countDocuments();
  console.log(`📊 Remaining resources: ${remaining}`);

  await mongoose.disconnect();
}

main().catch((err) => { console.error('❌', err); process.exit(1); });