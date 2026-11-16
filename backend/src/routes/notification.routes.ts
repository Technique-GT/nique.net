import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, notificationController.getNotifications);
router.patch("/:id/read", protect, notificationController.markAsRead);
router.post("/read-all", protect, notificationController.markAllAsRead);

export default router;
