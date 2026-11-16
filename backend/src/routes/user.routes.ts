import express from "express";

import {
    bulkDeleteUsers,
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    inviteUser,
    updateUser,
} from "../controllers/user.controller";
import {
    getUserArticleCount,
    mergeUsers,
} from "../controllers/user.merge.controller";
import { adminMiddleware } from "../middleware/admin.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    validateBody,
    validateParams,
} from "../middleware/validate.middleware";
import { idParamSchema } from "../schemas/params.schema";
import {
    bulkDeleteUsersBodySchema,
    createUserBodySchema,
    updateUserBodySchema,
} from "../schemas/user.schema";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getUsers);
router.post("/", validateBody(createUserBodySchema), createUser);
router.post("/invite", inviteUser);
router.post(
    "/bulk-delete",
    validateBody(bulkDeleteUsersBodySchema),
    bulkDeleteUsers,
);
router.post("/merge", mergeUsers);

router.get(
    "/:id/article-count",
    validateParams(idParamSchema),
    getUserArticleCount,
);
router.get("/:id", validateParams(idParamSchema), getUserById);

router.put(
    "/:id",
    validateParams(idParamSchema),
    validateBody(updateUserBodySchema),
    updateUser,
);
router.patch(
    "/:id",
    validateParams(idParamSchema),
    validateBody(updateUserBodySchema),
    updateUser,
);

router.delete("/:id", validateParams(idParamSchema), deleteUser);

export default router;
