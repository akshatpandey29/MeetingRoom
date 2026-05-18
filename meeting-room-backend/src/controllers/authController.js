const { body } = require('express-validator');
const crypto = require('crypto');
const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');
const { validateRequest } = require('../middleware/validateRequest');
const { sendEmail } = require('../services/emailService');
const User = require('../models/userModel');
const env = require('../config/env');

const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge,
  path: '/',
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/',
});

const setAuthCookies = (res, tokens) => {
  res.cookie(
    'accessToken',
    tokens.accessToken,
    getCookieOptions(ACCESS_COOKIE_MAX_AGE)
  );

  res.cookie(
    'refreshToken',
    tokens.refreshToken,
    getCookieOptions(REFRESH_COOKIE_MAX_AGE)
  );
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', getClearCookieOptions());
  res.clearCookie('refreshToken', getClearCookieOptions());
};

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

const forgotPasswordValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  validateRequest,
];

const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validateRequest,
];

// ── Register ─────────────────────────────────────────────────────────────────
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

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.loginUser(req.body);
    setAuthCookies(res, tokens);

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

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.token;
    if (!token) {
      return ApiResponse.badRequest(res, 'Refresh token required');
    }

    const { user, tokens } = await authService.refreshTokens(token);
    setAuthCookies(res, tokens);

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

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    clearAuthCookies(res);

    return ApiResponse.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  return ApiResponse.success(res, { user: req.user }, 'Profile fetched');
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success even if email not found — security best practice
    // so attackers can't enumerate which emails exist
    if (!user) {
      return ApiResponse.success(
        res,
        null,
        'If this email exists, a reset link has been sent.'
      );
    }

    // Generate a secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before saving to DB — never store plain token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token + expiry (15 minutes) to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Build reset URL — points to frontend reset page
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`;

    // Send email
    await sendEmail({
      to: email,
      subject: 'RoomBook — Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">RoomBook</h2>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Meeting Room Scheduler</p>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h3 style="color: #0f172a; margin: 0 0 12px;">Reset your password</h3>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Hello ${user.name},<br/><br/>
              We received a request to reset your password. Click the button below to set a new password.
              This link expires in <strong>15 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}"
                style="background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 10px;
                text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you didn't request this, you can safely ignore this email.<br/>
              Your password will not change.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
              © 2026 Plaxonic Technologies · RoomBook
            </p>
          </div>
        </div>
      `,
      text: `Hello ${user.name}, reset your password here: ${resetUrl}. This link expires in 15 minutes.`,
    });

    return ApiResponse.success(
      res,
      null,
      'If this email exists, a reset link has been sent.'
    );

  } catch (error) {
    next(error);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, email } = req.body;

    // Hash the incoming token to compare with stored hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return ApiResponse.error(
        res,
        'Reset link is invalid or has expired. Please request a new one.',
        400
      );
    }

    // Update password using authService so bcrypt hashing is applied
    await authService.updatePassword(user._id, newPassword);

    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'RoomBook — Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">RoomBook</h2>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <h3 style="color: #0f172a;">Password Changed ✓</h3>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Hello ${user.name},<br/><br/>
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            <p style="color: #94a3b8; font-size: 12px;">
              If you did not make this change, contact your administrator immediately.
            </p>
          </div>
        </div>
      `,
      text: `Hello ${user.name}, your password has been changed successfully.`,
    });

    return ApiResponse.success(res, null, 'Password reset successfully. You can now log in.');

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
