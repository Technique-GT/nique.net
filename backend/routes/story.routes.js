const express = require('express');
const router = express.Router();
const storyController = require('../controllers/story.controller');
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

router.post('/', storyController.createStory);
router.get('/', requirePermission("viewStory"), storyController.getAllStories);
router.delete('/:id', requirePermission("deleteStory"), storyController.deleteStory);

module.exports = router;