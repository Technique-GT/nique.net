"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const category_schema_1 = require("../schemas/category.schema");
const params_schema_1 = require("../schemas/params.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// Public routes (read-only)
router.get('/', category_controller_1.getCategories);
router.get('/stats', category_controller_1.getCategoryStats);
router.get('/:id', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), category_controller_1.getCategoryById);
router.get('/slug/:slug', (0, validate_middleware_1.validateParams)(params_schema_1.slugParamSchema), category_controller_1.getCategoryBySlug);
// Protected routes (require authentication + admin)
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateBody)(category_schema_1.createCategoryBodySchema), category_controller_1.createCategory);
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(category_schema_1.updateCategoryBodySchema), category_controller_1.updateCategory);
router.patch('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(category_schema_1.updateCategoryBodySchema), category_controller_1.updateCategory);
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), category_controller_1.deleteCategory);
router.delete('/:id/hard', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), category_controller_1.hardDeleteCategory);
exports.default = router;
