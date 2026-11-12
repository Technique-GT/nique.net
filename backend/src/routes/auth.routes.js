"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/google', auth_controller_1.googleAuth);
router.get('/google/callback', auth_controller_1.googleAuthCallback);
router.post('/logout', auth_controller_1.logout);
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.getCurrentUser);
// Dev-only: bypass Google OAuth (returns 404 in production)
router.post('/dev-login', auth_controller_1.devLogin);
exports.default = router;
