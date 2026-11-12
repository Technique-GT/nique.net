"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const comment_schema_1 = require("../schemas/comment.schema");
const comment_admin_query_schema_1 = require("../schemas/comment.admin.query.schema");
const comment_list_query_schema_1 = require("../schemas/comment.list.query.schema");
const comment_query_schema_1 = require("../schemas/comment.query.schema");
const params_schema_1 = require("../schemas/params.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// ==========================================
// PUBLIC ROUTES (no authentication required)
// ==========================================
// Create a new comment (public, but comments require approval)
router.post('/', (0, validate_middleware_1.validateBody)(comment_schema_1.createCommentBodySchema), comment_controller_1.createComment);
// Get approved comments for an article (public)
router.get('/by-article', (0, validate_middleware_1.validateQuery)(comment_list_query_schema_1.listCommentsQuerySchema), comment_controller_1.getCommentsByArticle);
router.get('/article/:articleId', (0, validate_middleware_1.validateParams)(params_schema_1.articleIdParamSchema), (0, validate_middleware_1.validateQuery)(comment_query_schema_1.commentsByArticleQuerySchema), comment_controller_1.getCommentsByArticle);
// Reaction endpoints (public - uses device ID for tracking)
router.patch('/:id/like', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), comment_controller_1.likeComment);
router.patch('/:id/dislike', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), comment_controller_1.dislikeComment);
router.put('/:id/reaction', (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), comment_controller_1.setCommentReaction);
// ==========================================
// ADMIN ROUTES (authentication + admin required)
// ==========================================
// List all comments (admin only - includes pending)
router.get('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateQuery)(comment_admin_query_schema_1.listCommentsQuerySchema), comment_controller_1.getAllComments);
// Comment stats (admin only)
router.get('/stats', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, comment_controller_1.getCommentStats);
// Get single comment (admin only - may include unapproved)
router.get('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), comment_controller_1.getCommentById);
// Update comment content (admin only)
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(comment_schema_1.updateCommentBodySchema), comment_controller_1.updateComment);
// Delete comment (admin only)
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), comment_controller_1.deleteComment);
// Approve/reject comment (admin only)
router.patch('/:id/status', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, (0, validate_middleware_1.validateParams)(params_schema_1.idParamSchema), (0, validate_middleware_1.validateBody)(comment_schema_1.updateCommentStatusBodySchema), comment_controller_1.updateCommentStatus);
exports.default = router;
