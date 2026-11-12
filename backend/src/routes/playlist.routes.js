"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const playlist_controller_1 = require("../controllers/playlist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const router = express_1.default.Router();
// Public routes (read-only)
router.get('/', playlist_controller_1.getPlaylists);
router.get('/active', playlist_controller_1.getActivePlaylist);
router.get('/:id', playlist_controller_1.getPlaylistById);
// Protected routes (require authentication + admin)
router.post('/', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, playlist_controller_1.createPlaylist);
router.put('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, playlist_controller_1.updatePlaylist);
router.delete('/:id', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, playlist_controller_1.deletePlaylist);
router.put('/:id/set-active', auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, playlist_controller_1.setActivePlaylist);
exports.default = router;
