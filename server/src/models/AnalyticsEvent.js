const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'reported',
        'classified',
        'assigned',
        'en_route',
        'on_scene',
        'resolved',
        'closed',
        'merged',
        'escalated',
      ],
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['citizen', 'responder', 'operator', 'admin', 'system', null],
      default: null,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // e.g., { resourceId: ..., previousStatus: ..., etc. }
    },
  },
  { timestamps: true }
);

// For aggregations like "events in the last hour for this incident"
analyticsEventSchema.index({ incidentId: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);