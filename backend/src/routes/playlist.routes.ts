import express from "express";
import {
    createPlaylist,
    deletePlaylist,
    getActivePlaylist,
    getPlaylistById,
    getPlaylists,
    setActivePlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller";
import { adminMiddleware } from "../middleware/admin.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes (read-only)
router.get("/", getPlaylists);
router.get("/active", getActivePlaylist);
router.get("/:id", getPlaylistById);

// Protected routes (require authentication + admin)
router.post("/", authMiddleware, adminMiddleware, createPlaylist);
router.put("/:id", authMiddleware, adminMiddleware, updatePlaylist);
router.delete("/:id", authMiddleware, adminMiddleware, deletePlaylist);
router.put(
    "/:id/set-active",
    authMiddleware,
    adminMiddleware,
    setActivePlaylist,
);

export default router;
