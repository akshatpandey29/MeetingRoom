const { body } = require('express-validator');
const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const { validateRequest } = require('../middleware/validateRequest');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  validateRequest,
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateRequest,
];

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    return ApiResponse.created(res, { user }, 'Registration successful');
  } catch (error) {
    if (error.status) {
      return ApiResponse.error(res, error.message, error.status);
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.loginUser(req.body);
    return ApiResponse.success(res, {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }, 'Login successful');
  } catch (error) {
    if (error.status) {
      return ApiResponse.error(res, error.message, error.status);
    }
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return ApiResponse.badRequest(res, 'Refresh token required');
    }
    const { user, tokens } = await authService.refreshTokens(token);
    return ApiResponse.success(res, {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }, 'Token refreshed');
  } catch (error) {
    if (error.status) {
      return ApiResponse.error(res, error.message, error.status);
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    return ApiResponse.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  return ApiResponse.success(res, { user: req.user }, 'Profile fetched');
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  registerValidation,
  loginValidation,
};