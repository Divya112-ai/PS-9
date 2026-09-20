const mongoose = require('mongoose');

const sourceReportSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      // Example: REP-10001
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
      // null when the report hasn't been assigned to an incident yet
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['citizen', 'sensor', 'field_team', 'call_center', 'whatsapp'],
      default: 'citizen',
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
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
      // Cloudinary URL if image was uploaded
    },
    reporterName: {
      type: String,
      default: null,
      // Optional — for non-anonymous reports
    },
    reporterContact: {
      type: String,
      default: null,
      // Phone number — fake/demo only for hackathon
    },

    // WhatsApp-specific fields (populated when sourceType === 'whatsapp')
    whatsapp: {
      messageSid: { type: String, default: null, index: true },
      profileName: { type: String, default: null },
      from: { type: String, default: null },
      to: { type: String, default: null },
      numMedia: { type: Number, default: 0 },
      mediaUrls: { type: [String], default: [] },
      mediaContentTypes: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

sourceReportSchema.index({ location: '2dsphere' });
sourceReportSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('SourceReport', sourceReportSchema);