const User = require('../models/users.model');
const { validationResult } = require('express-validator');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private/Admin
const getAllStaff = async (req, res) => {
  try {
    const staffRoles = ['editor', 'manager', 'admin'];
    const staff = await User.find({ role: { $in: staffRoles } }).select('-password');
    res.status(200).json({ staff });
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ message: 'Server error while retrieving staff' });
  }
};

// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, bio, role, isActive } = req.body;

  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Update fields
    staff.firstName = firstName ?? staff.firstName;
    staff.lastName = lastName ?? staff.lastName;
    staff.bio = bio ?? staff.bio;
    staff.role = role ?? staff.role;
    staff.isActive = typeof isActive === 'boolean' ? isActive : staff.isActive;

    await staff.save();

    const staffData = staff.toObject();
    delete staffData.password;

    res.status(200).json({
      message: 'Staff member updated successfully',
      staff: staffData
    });

  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ message: 'Server error while updating staff' });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ message: 'Server error while deleting staff' });
  }
};

module.exports = {
  getAllStaff,
  updateStaff,
  deleteStaff
};
