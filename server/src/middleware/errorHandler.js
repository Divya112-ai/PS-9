const logger = require('../utils/logger');

/**
 * Global error handler. Must be registered LAST in Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.method} ${req.originalUrl}] ${err.message}`, err);

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  // Mongoose duplicate key error → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  // Mongoose CastError (bad ObjectId) → 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID',
    });
  }

  // Our own ApiError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Unknown errors → 500
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;