const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', [...validation], authController.register);
router.post('/login', [...validation], authController.login);
router.post('/logout', authController.logout); // No authMiddleware!

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/check-session', authMiddleware, (req, res) => {
  res.json({ isAuthenticated: true, user: req.user });
});

module.exports = router;