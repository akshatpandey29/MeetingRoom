const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

router.post('/register',
  authLimiter,
  authController.registerValidation,
  authController.register
);

router.post('/login',
  authLimiter,
  authController.loginValidation,
  authController.login
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

router.post('/forgot-password',
  authLimiter,
  authController.forgotPasswordValidation,
  authController.forgotPassword
);

router.post('/reset-password',
  authController.resetPasswordValidation,
  authController.resetPassword
);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // Decode the JWT token from Google
    const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const { email, name, sub: googleId } = decoded;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in Google token' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // New user — create account
      user = await User.create({
        name,
        email,
        password: `google_oauth_${googleId}_${Date.now()}`,
        role: 'user',
        isActive: true,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is disabled. Please contact admin.' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.jwt.refreshSecret,
      { expiresIn: env.jwt.refreshExpiresIn }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
});

module.exports = router;