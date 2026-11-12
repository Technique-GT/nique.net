"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const publication_controller_1 = require("../controllers/publication.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// public to get date
router.get('/', publication_controller_1.getPublications);
// only admins can edit publication dates
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, publication_controller_1.createPublication);
exports.default = router;
