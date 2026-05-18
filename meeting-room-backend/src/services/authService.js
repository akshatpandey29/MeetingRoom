const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");
const logger = require("../utils/logger");
const { ROLES } = require("../utils/constants");
const emailService = require("./emailService");

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

const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });

  if (existing) {
    throw { status: 409, message: "Email already registered" };
  }

  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.USER,
  });

  await emailService.sendWelcomeEmail({
    to: user.email,
    name: user.name,
  });

  logger.info(`New user registered: ${email}`);

  return user;
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email,
    isActive: true,
  }).select("+password +refreshToken");

  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }

  const isValid = await user.validatePassword(password);

  if (!isValid) {
    throw { status: 401, message: "Invalid email or password" };
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

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    throw { status: 401, message: "Invalid refresh token" };
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

// ── Update Password ───────────────────────────────────────────────────────────
// Used by reset password flow — finds user by ID and sets new password
// bcrypt hashing is handled automatically by the userModel pre-save hook
const updatePassword = async (userId, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  // Set new password — pre-save hook in userModel will hash it automatically
  user.password = newPassword;

  // Save with validation so password length check runs
  await user.save();

  logger.info(`Password updated for user: ${user.email}`);

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  updatePassword,
};