const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API root
app.get('/', (req, res) => {
  res.json({ message: 'PS-9 Emergency Response API', version: '1.0.0' });
});

module.exports = app;