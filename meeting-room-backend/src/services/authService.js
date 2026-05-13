const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw { status: 409, message: 'Email already registered' };
  }
  const user = await User.create({ name, email, password, role });
  logger.info(`New user registered: ${email}`);
  return user;
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email,
    isActive: true,
  }).select('+password +refreshToken');

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const isValid = await user.validatePassword(password);
  if (!isValid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);
  return { user, tokens };
};

const refreshTokens = async (token) => {
  const decoded = jwt.verify(token, env.jwt.refreshSecret);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    throw { status: 401, message: 'Invalid refresh token' };
  }

  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, tokens };
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  logger.info(`User logged out: ${userId}`);
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
};