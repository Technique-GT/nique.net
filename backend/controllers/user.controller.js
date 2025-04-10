const User = require('../models/User.model');
const Article = require('../models/article.model');
const SavedArticle = require('../models/SavedArticle.model');

exports.getAllUsers = async (req, res) => {
  try {
    // Only admin can list all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile unless admin/manager
    if (req.user.id !== user.id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent non-admins from changing roles
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized role change' });
    }

    // Users can only update their own profile unless admin/manager
    if (req.user.id !== id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up user's articles and saved articles
    await Article.deleteMany({ 'authors.user': user._id });
    await SavedArticle.deleteMany({ user: user._id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserArticles = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own articles unless admin/manager
    if (req.user.id !== id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const articles = await Article.find({ 'authors.user': id })
      .populate('authors.user', 'username profilePicture')
      .populate('categories', 'name')
      .sort({ createdAt: -1 });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedArticles = async (req, res) => {
  try {
    const savedArticles = await SavedArticle.find({ user: req.user.id })
      .populate({
        path: 'article',
        populate: [
          { path: 'authors.user', select: 'username profilePicture' },
          { path: 'categories', select: 'name' }
        ]
      });

    res.json(savedArticles.map(item => item.article));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};