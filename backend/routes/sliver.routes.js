const express = require('express');
const router = express.Router();
const sliverController = require('../controllers/sliver.controller');
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

router.post('/', sliverController.createSliver);
router.get('/', requirePermission("viewSliver"), sliverController.getAllSlivers);
router.delete('/:id', requirePermission("deleteSliver"), sliverController.deleteSliver);

module.exports = router;
