"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authMiddleware = exports.getTokenFromRequest = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const RevokedToken_1 = __importDefault(require("../models/RevokedToken"));
const security_1 = require("../utils/security");
const getTokenFromRequest = (req) => {
    const header = req.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
        return header.slice('Bearer '.length).trim();
    }
    if (typeof req.cookies?.jwt === 'string' && req.cookies.jwt.trim()) {
        return req.cookies.jwt.trim();
    }
    return null;
};
exports.getTokenFromRequest = getTokenFromRequest;
const authMiddleware = async (req, res, next) => {
    const token = (0, exports.getTokenFromRequest)(req);
    if (!token) {
        res.status(401).json({ message: 'No token provided, authorization denied' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_TOKEN);
        req.user = decoded;
        const tokenHash = (0, security_1.hashToken)(token);
        const revoked = await RevokedToken_1.default.exists({ tokenHash });
        if (revoked) {
            res.status(401).json({ message: 'Token has been revoked' });
            return;
        }
        next();
    }
    catch (_err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.authMiddleware = authMiddleware;
exports.protect = exports.authMiddleware;
