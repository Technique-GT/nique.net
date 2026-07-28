import express from 'express';
import { getPublications, createPublication } from '../controllers/publication.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = express.Router();

// public to get date
router.get('/', getPublications);

// only admins can edit publication dates
router.post('/', authMiddleware, adminMiddleware, createPublication);

export default router;
