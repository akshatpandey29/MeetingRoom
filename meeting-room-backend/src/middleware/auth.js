const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return ApiResponse.unauthorized(res, 'User not found or inactive');
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    return ApiResponse.unauthorized(res, 'Authentication failed');
  }
};

module.exports = { authenticate };