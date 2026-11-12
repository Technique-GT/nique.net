import express from "express";

import {
    createTag,
    deleteTag,
    getTagById,
    getTagBySlug,
    getTagStats,
    getTags,
    updateTag,
} from "../controllers/tag.controller";
import { adminMiddleware } from "../middleware/admin.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    validateBody,
    validateParams,
} from "../middleware/validate.middleware";
import { idParamSchema, slugParamSchema } from "../schemas/params.schema";
import {
    createTagBodySchema,
    updateTagBodySchema,
} from "../schemas/tag.schema";

const router = express.Router();

// Public routes (read-only)
router.get("/", getTags);
router.get("/stats", getTagStats);
router.get("/:id", validateParams(idParamSchema), getTagById);
router.get("/slug/:slug", validateParams(slugParamSchema), getTagBySlug);

// Protected routes (require authentication + admin)
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validateBody(createTagBodySchema),
    createTag,
);
router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validateParams(idParamSchema),
    validateBody(updateTagBodySchema),
    updateTag,
);
router.patch(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validateParams(idParamSchema),
    validateBody(updateTagBodySchema),
    updateTag,
);
router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validateParams(idParamSchema),
    deleteTag,
);
router.delete(
    "/:id/hard",
    authMiddleware,
    adminMiddleware,
    validateParams(idParamSchema),
    deleteTag,
);

export default router;
