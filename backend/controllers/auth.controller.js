const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/users.model');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },

    { expiresIn: '7d' }
  );
};


exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'subscriber' } = req.body;

    // Validate role assignment (only admin can assign higher roles)
    if (req.user?.role !== 'admin' && ['editor', 'manager', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'Unauthorized role assignment' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    const token = generateToken(user);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.cookie('jwt', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
};

exports.getCurrentUser = async (req, res) => {

  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    AdminBack
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};