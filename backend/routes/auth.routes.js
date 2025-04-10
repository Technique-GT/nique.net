const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  check('username', 'Username is required').notEmpty().trim(),
  check('username', 'Username must be 3+ characters').isLength({ min: 3 }),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 6+ characters').isLength({ min: 6 }),
  check('firstName', 'First name is required').notEmpty().trim(),
  check('lastName', 'Last name is required').notEmpty().trim(),
  check('bio', 'Bio must be at least 10 characters').isLength({ min: 10 }).trim()
], authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('username', 'Username is required').notEmpty().trim(),
  check('password', 'Password is required').exists()
], authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
router.post('/logout', authMiddleware, authController.logout);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', authMiddleware, authController.getCurrentUser);

// @route   GET /api/auth/check-session
// @desc    Check if user has valid session
// @access  Public
router.get('/check-session', authMiddleware, (req, res) => {
  res.status(200).json({ isAuthenticated: true, user: req.user });
});

module.exports = router;