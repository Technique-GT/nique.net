const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const auth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permissions.util');

const requirePermission = (permission) => {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!req.user || !req.user.role) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const hasPermission = checkPermission(req.user.role, permission);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      next();
    });
  };
};

// Public routes
router.get('/', tagController.getAllTags);
router.get('/:id', tagController.getTagById);

// Protected routes with permission checks
router.post('/', requirePermission('manageTags'), tagController.createTag);
router.put('/:id', requirePermission('manageTags'), tagController.updateTag);
router.delete('/:id', requirePermission('manageTags'), tagController.deleteTag);

module.exports = router;