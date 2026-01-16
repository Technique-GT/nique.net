const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleAuthCallback);

router.post('/logout', authController.logout); // 🔓 No auth required

// Protected route to get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
