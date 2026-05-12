const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../utils/constants');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return ApiResponse.forbidden(res, 'Admin access required');
  }
  next();
};

const userOnly = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }
  next();
};

module.exports = { adminOnly, userOnly };