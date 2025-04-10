const jwt = require('jsonwebtoken');
import User from '../models/users.models.js';

const authMiddleware = (req, res, next) => {
    // Assuming your JWT token is stored in a cookie named 'jwt'
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    try {
        // Replace 'your_jwt_secret' with your real JWT secret
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = decoded; // Attach the decoded payload (e.g. user _id, email) to req.user
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;