"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("../controllers/media.controller");
const admin_middleware_1 = require("../middleware/admin.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ limits: { fileSize: 10 * 1024 * 1024 } });
router.use(auth_middleware_1.authMiddleware);
router.get('/images', media_controller_1.listMediaImages);
router.post('/upload', upload.single('file'), media_controller_1.uploadMedia);
router.get('/:id/usage', admin_middleware_1.adminMiddleware, media_controller_1.getMediaImageUsage);
router.delete('/:id', admin_middleware_1.adminMiddleware, media_controller_1.deleteMediaImage);
exports.default = router;
