const Category = require('../models/category.model');

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive = true } = req.body;

    // Basic validation
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const category = new Category({ name, description, isActive });
    await category.save();

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all categories with optional pagination
exports.getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const categories = await Category.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a category by its ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update an existing category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, description, isActive } = req.body;
    if (name) category.name = name;
    if (description) category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search for categories by name or description
exports.searchCategories = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const categories = await Category.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
