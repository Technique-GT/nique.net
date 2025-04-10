const { checkPermission } = require('../utils/permissions');

exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const roleHierarchy = ['viewer', 'subscriber', 'editor', 'manager', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(req.user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!checkPermission(req.user.role, permission)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};