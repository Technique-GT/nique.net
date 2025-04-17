const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controllers');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permissions.util');


const requirePermission = (permission) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    auth(req, res, () => {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Use the existing checkPermission utility
      const hasPermission = checkPermission(req.user.role, permission);
      
      if (!hasPermission) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      next();
    });
  };
};

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/search', categoryController.searchCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes with permission checks
router.post('/', requirePermission('manageCategories'), categoryController.createCategory);
router.put('/:id', requirePermission('manageCategories'), categoryController.updateCategory);
router.delete('/:id', requirePermission('manageCategories'), categoryController.deleteCategory);

module.exports = router;