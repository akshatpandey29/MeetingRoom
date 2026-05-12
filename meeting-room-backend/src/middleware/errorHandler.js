const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.conflict(res, `${field} already exists`);
  }

  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, 'Invalid ID format');
  }

  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  );
};

const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(
    res,
    `Route ${req.method} ${req.path} not found`
  );
};

module.exports = { errorHandler, notFoundHandler };