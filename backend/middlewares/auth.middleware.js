const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const skipPaths = ['/api/auth/logout', '/logout'];
    if (skipPaths.includes(req.originalUrl) || skipPaths.includes(req.path)) {
        console.log('[AuthMiddleware] Skipping auth for:', req.originalUrl);
        return next(); // ⛔ Skip token validation for logout
    }

    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Match your sign function
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
