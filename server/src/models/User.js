const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['citizen', 'responder', 'operator', 'admin', 'hospital'],
      default: 'citizen',
    },
    organization: {
      type: String,
      default: null,
    },
    // Responder-specific fields
    responderType: {
      type: String,
      enum: ['fire', 'medical', 'police', 'rescue', null],
      default: null,
    },
    // Link a responder to a resource
    assignedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,  // adds createdAt + updatedAt automatically
  }
);

// Never return passwordHash in JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);