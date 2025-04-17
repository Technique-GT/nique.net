const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const staffController = require('../controllers/staff.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Simple admin check middleware
const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Validation rules for updating staff
const updateStaffValidation = [
  check('firstName', 'First name is required').optional().notEmpty(),
  check('lastName', 'Last name is required').optional().notEmpty(),
  check('role', 'Invalid role').optional().isIn(['editor', 'manager', 'admin']),
  check('isActive', 'isActive must be a boolean').optional().isBoolean()
];

// Get all staff members
router.get(
  '/',
  authMiddleware,
  adminCheck,
  staffController.getAllStaff
);

// Update a staff member
router.put(
  '/:id',
  authMiddleware,
  adminCheck,
  updateStaffValidation,
  staffController.updateStaff
);

// Delete a staff member
router.delete(
  '/:id',
  authMiddleware,
  adminCheck,
  staffController.deleteStaff
);

module.exports = router;