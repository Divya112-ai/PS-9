const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      // Example: INC-10024
    },
    type: {
      type: String,
      enum: ['fire', 'flood', 'medical', 'accident', 'industrial', 'structural', 'other'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['P1', 'P2', 'P3', 'P4'],
      required: true,
      index: true,
    },
    status: {
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
      ],
      default: 'reported',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],  // [lng, lat]
        required: true,
        validate: {
          validator: function (v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Coordinates must be [lng, lat] within valid ranges',
        },
      },
    },
    address: {
      type: String,
      default: null,
    },

    // AI classification results
    ai: {
      classified: { type: Boolean, default: false },
      confidence: { type: Number, min: 0, max: 1, default: 0 },
      summary: { type: String, default: null },
      recommendedActions: { type: [String], default: [] },
      source: {
        type: String,
        enum: ['ai', 'rules', 'rules_fallback', 'manual', null],
        default: null,
      },
    },

    // References to raw reports that contributed to this incident
    sourceReports: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'SourceReport' },
    ],

    // Resources dispatched to this incident
    assignedResources: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    ],

    // Duplicate candidates (potential merges)
    duplicateCandidates: [
      {
        incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
        score: { type: Number, min: 0, max: 1 },
        detectedAt: { type: Date, default: Date.now },
      },
    ],

    // If this incident was merged into another
    mergedInto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },

    // Escalation tracking
    escalationLevel: {
      type: Number,
      default: 0,
      // 0 = none, 1 = warning, 2 = critical
    },

    // Timeline
    assignedAt: { type: Date, default: null },
    onSceneAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    // Reporter (optional — most citizen reports are anonymous)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Geospatial index for duplicate detection ($near queries)
incidentSchema.index({ location: '2dsphere' });

// Compound indexes for dashboard queries
incidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
incidentSchema.index({ status: 1, priority: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);