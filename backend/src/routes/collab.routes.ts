import express from 'express';
import {
  createCollaborator,
  getCollaborators,
  getCollaboratorById,
  updateCollaborator,
  deleteCollaborator,
  updateCollaboratorStatus,
} from '../controllers/collab.controller';

const router = express.Router();

router.post('/', createCollaborator);
router.get('/', getCollaborators);
router.get('/:id', getCollaboratorById);
router.put('/:id', updateCollaborator);
router.delete('/:id', deleteCollaborator);
router.patch('/:id/status', updateCollaboratorStatus);

export default router;