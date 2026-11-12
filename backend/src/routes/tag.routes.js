"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tag_controller_1 = require("../controllers/tag.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const tag_schema_1 = require("../schemas/tag.schema");
const params_schema_1 = require("../schemas/params.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// Public routes (read-only)
router.get('/', tag_controller_1.getTags);
router.get('/stats', tag_controller_1.getTagStats);
router.get('/:id', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), tag_controller_1.getTagById);
router.get('/slug/:slug', (0, validate_middleware_1.validateParams)(params_schema_1.slugParamSchema), tag_controller_1.getTagBySlug);
// Protected routes (require authentication + admin)
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateBody)(tag_schema_1.createTagBodySchema), tag_controller_1.createTag);
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(tag_schema_1.updateTagBodySchema), tag_controller_1.updateTag);
router.patch('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(tag_schema_1.updateTagBodySchema), tag_controller_1.updateTag);
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), tag_controller_1.deleteTag);
router.delete('/:id/hard', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), tag_controller_1.hardDeleteTag);
exports.default = router;
