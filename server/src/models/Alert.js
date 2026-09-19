const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['delayed_response', 'escalation', 'info', 'resource_unavailable'],
      default: 'info',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Most dashboards show unacknowledged alerts, newest first
alertSchema.index({ acknowledged: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);