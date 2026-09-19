const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      // Example: FT-04, AMB-12, PU-03
    },
    type: {
      type: String,
      enum: ['team', 'vehicle', 'hospital', 'shelter'],
      required: true,
    },
    subtype: {
      type: String,
      enum: ['fire_team', 'ambulance', 'police', 'rescue', 'hospital', 'shelter'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      // "Fire Team 04"
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'en_route', 'on_scene', 'unavailable'],
      default: 'available',
      index: true,  // frequently filtered
    },
    capabilities: {
      type: [String],
      default: [],
      // e.g., ['fire_suppression', 'rescue', 'hazmat']
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
    capacity: {
      type: Number,
      default: 1,
    },
    contactNumber: {
      type: String,
      default: null,
    },
    assignedIncidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Geospatial index — enables $near queries
resourceSchema.index({ location: '2dsphere' });

// Compound index for common filters
resourceSchema.index({ subtype: 1, status: 1 });

module.exports = mongoose.model('Resource', resourceSchema);