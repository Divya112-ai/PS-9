const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const resourceRoutes = require('./routes/resource.routes');
const alertRoutes = require('./routes/alert.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const demoRoutes = require('./routes/demo.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',

  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
];

const allowedOrigins = [
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...DEV_ORIGINS,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // (curl, Postman, mobile apps, Twilio webhooks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Body parsers ────────────────────────────────────────────────────────────

// JSON requests from frontend/API
app.use(express.json({ limit: '5mb' }));

// Form-encoded requests from Twilio webhooks
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// ─── Health & root ───────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'PS-9 Emergency Response API',
    version: '1.0.0',
  });
});

// ─── API routes ──────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/incidents', incidentRoutes);

app.use('/api/v1/resources', resourceRoutes);

app.use('/api/v1/alerts', alertRoutes);

app.use('/api/v1/analytics', analyticsRoutes);

app.use('/api/v1/demo', demoRoutes);

// WhatsApp / Twilio webhook
app.use('/api/v1/whatsapp', whatsappRoutes);

// ─── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;