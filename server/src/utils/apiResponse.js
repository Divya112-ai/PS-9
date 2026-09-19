/**
 * Send a successful response.
 * @param {Object} res - Express response
 * @param {*} data - Payload to send
 * @param {Number} statusCode - HTTP status (default 200)
 */
const successResponse = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Send an error response.
 * Prefer throwing ApiError instead — this is for edge cases.
 */
const errorResponse = (res, message, statusCode = 500, code = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code: code || `ERR_${statusCode}`,
  });
};

module.exports = { successResponse, errorResponse };