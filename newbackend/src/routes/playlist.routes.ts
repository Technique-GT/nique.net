import express from 'express';
import {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  setActivePlaylist,
  getActivePlaylist
} from '../controllers/playlist.controller';

const router = express.Router();

router.post('/', createPlaylist);
router.get('/', getPlaylists);
router.get('/active', getActivePlaylist);
router.get('/:id', getPlaylistById);
router.put('/:id', updatePlaylist);
router.delete('/:id', deletePlaylist);
router.put('/:id/set-active', setActivePlaylist);

export default router;