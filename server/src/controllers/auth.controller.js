const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

const JWT_EXPIRES_IN = '7d';

// ─────────────────────────────────────────────
// Helper: sign a JWT for a user
// ─────────────────────────────────────────────
const signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, organization } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest('Name, email, and password are required', 'MISSING_FIELDS');
  }

  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters', 'WEAK_PASSWORD');
  }

  // Restrict privileged roles — only allow citizen/responder via public registration.
  // operator/admin must be created by an existing admin (or seeded).
  const allowedPublicRoles = ['citizen', 'responder'];
  const finalRole = allowedPublicRoles.includes(role) ? role : 'citizen';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: finalRole,
    organization: organization || null,
  });

  const token = signToken(user);

  return successResponse(
    res,
    {
      token,
      user: user.toJSON(),
    },
    201
  );
});

// ─────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required', 'MISSING_FIELDS');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Same message as wrong password to avoid leaking which emails exist
    throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is disabled', 'ACCOUNT_DISABLED');
  }

  const token = signToken(user);

  return successResponse(res, {
    token,
    user: user.toJSON(),
  });
});

// ─────────────────────────────────────────────
// GET /api/v1/auth/me
// ─────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }
  return successResponse(res, user.toJSON());
});

module.exports = { register, login, getMe };