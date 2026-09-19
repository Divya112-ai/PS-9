class ApiError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true;  // distinguishes our errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code) {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code) {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Not found', code) {
    return new ApiError(404, message, code);
  }

  static conflict(message, code) {
    return new ApiError(409, message, code);
  }

  static internal(message = 'Internal server error', code) {
    return new ApiError(500, message, code);
  }
}

module.exports = ApiError;