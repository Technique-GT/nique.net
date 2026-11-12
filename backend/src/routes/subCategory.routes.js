"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subCategory_controller_1 = require("../controllers/subCategory.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const subcategory_schema_1 = require("../schemas/subcategory.schema");
const params_schema_1 = require("../schemas/params.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// Public routes (read-only)
router.get('/stats', subCategory_controller_1.getSubCategoryStats);
router.get('/', subCategory_controller_1.getSubCategories);
router.get('/category/:categoryId', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), subCategory_controller_1.getSubCategoriesByCategory);
router.get('/slug/:slug', (0, validate_middleware_1.validateParams)(params_schema_1.slugParamSchema), subCategory_controller_1.getSubCategoryBySlug);
router.get('/:id', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), subCategory_controller_1.getSubCategoryById);
// Protected routes (require authentication + admin)
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateBody)(subcategory_schema_1.createSubcategoryBodySchema), subCategory_controller_1.createSubCategory);
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(subcategory_schema_1.updateSubcategoryBodySchema), subCategory_controller_1.updateSubCategory);
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), subCategory_controller_1.deleteSubCategory);
router.delete('/:id/hard', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), subCategory_controller_1.hardDeleteSubCategory);
exports.default = router;
