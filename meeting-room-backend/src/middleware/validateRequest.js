const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.badRequest(
      res,
      'Validation failed',
      errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }))
    );
  }
  next();
};

module.exports = { validateRequest };