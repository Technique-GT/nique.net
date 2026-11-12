"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sliver_controller_1 = require("../controllers/sliver.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const sliver_schema_1 = require("../schemas/sliver.schema");
const sliver_query_schema_1 = require("../schemas/sliver.query.schema");
const params_schema_1 = require("../schemas/params.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
router.get('/all', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateQuery)(sliver_query_schema_1.listSliversQuerySchema), sliver_controller_1.getAllSlivers);
router.post('/', (0, validate_middleware_1.validateBody)(sliver_schema_1.createSliverBodySchema), sliver_controller_1.createSliver);
// Protected routes (require authentication + admin)
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), sliver_controller_1.deleteSliver);
exports.default = router;
