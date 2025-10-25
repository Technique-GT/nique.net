const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller');
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

// CRUD operations with permission checks
router.post('/', requirePermission('createArticle'), articleController.createArticle);
router.get('/', articleController.getAllArticles);
router.get('/feed/paginated', articleController.getArticleFeed);
router.get('/category/:categoryId', articleController.getArticleByCategory);
router.get('/:id', articleController.getArticleById);
router.put('/:id', requirePermission('editAnyArticle'), articleController.updateArticle);
router.delete('/:id', requirePermission('deleteAnyArticle'), articleController.deleteArticle);

// Additional features with permission checks
router.patch('/:id/publish', requirePermission('publishArticle'), articleController.publishArticle);
router.post('/:articleId/toggle-save', articleController.toggleSaveArticle);

module.exports = router;
