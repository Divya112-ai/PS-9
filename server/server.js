require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/sockets/socket');
const { startEscalationCron } = require('./src/services/escalation.service');

// Import models to register schemas
require('./src/models');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Create HTTP server wrapping the Express app
  const httpServer = http.createServer(app);

  // Attach Socket.IO to the HTTP server
  initSocket(httpServer);

  // Start the escalation cron
  startEscalationCron();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO listening on ws://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  });
};

start();