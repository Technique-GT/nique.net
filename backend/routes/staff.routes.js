const express = require('express');
const { body } = require('express-validator');
const {
  getAllStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staff.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // import auth middleware

const router = express.Router();

// Get all staff
router.get('/', authMiddleware, getAllStaff);

// Update a staff member
router.put(
  '/:id',
  authMiddleware,
  [
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('bio').optional().isString(),
    body('role').optional().isIn(['viewer', 'subscriber', 'editor', 'manager', 'admin']),
    body('isActive').optional().isBoolean()
  ],
  updateStaff
);

// Delete a staff member
router.delete('/:id', authMiddleware, deleteStaff);

module.exports = router;
