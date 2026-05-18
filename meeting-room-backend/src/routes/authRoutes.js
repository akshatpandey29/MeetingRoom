const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

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

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password',
  authLimiter,
  authController.forgotPasswordValidation,
  authController.forgotPassword
);

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password',
  authController.resetPasswordValidation,
  authController.resetPassword
);

module.exports = router;