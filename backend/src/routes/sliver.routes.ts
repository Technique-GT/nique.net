import express from "express";

import {
    createSliver,
    deleteSliver,
    getAllSlivers,
} from "../controllers/sliver.controller";
import { adminMiddleware } from "../middleware/admin.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../middleware/validate.middleware";
import { idParamSchema } from "../schemas/params.schema";
import { listSliversQuerySchema } from "../schemas/sliver.query.schema";
import { createSliverBodySchema } from "../schemas/sliver.schema";

const router = express.Router();

router.get(
    "/all",
    authMiddleware,
    adminMiddleware,
    validateQuery(listSliversQuerySchema),
    getAllSlivers,
);

router.post("/", validateBody(createSliverBodySchema), createSliver);

// Protected routes (require authentication + admin)
router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validateParams(idParamSchema),
    deleteSliver,
);

export default router;
