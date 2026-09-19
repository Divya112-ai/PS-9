require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Import models to verify schemas register without errors
require('./src/models');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  });
};

start();