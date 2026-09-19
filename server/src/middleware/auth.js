const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * Verify JWT and attach req.user = { id, role }.
 * Throws 401 if no/invalid token.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided', 'NO_TOKEN'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
    }
    return next(ApiError.unauthorized('Invalid token', 'INVALID_TOKEN'));
  }
};

/**
 * Allow only specified roles.
 * Must be used AFTER requireAuth.
 *
 * Usage:
 *   router.get('/admin', requireAuth, requireRole('admin'), handler);
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Not authenticated', 'NOT_AUTHENTICATED'));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Requires role: ${roles.join(' or ')}`,
        'INSUFFICIENT_ROLE'
      )
    );
  }

  next();
};

module.exports = { requireAuth, requireRole };