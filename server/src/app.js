const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const resourceRoutes = require('./routes/resource.routes');
const alertRoutes = require('./routes/alert.routes');
const analyticsRoutes = require('./routes/analytics.routes');   // ← NEW

const app = express();

// ─── Global middleware ───
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files (serves /public) ───
app.use(express.static('public'));

// ─── Health & root ───
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'PS-9 Emergency Response API', version: '1.0.0' });
});

// ─── API routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/analytics', analyticsRoutes);   // ← NEW

// ─── Error handler (last) ───
app.use(errorHandler);

module.exports = app;