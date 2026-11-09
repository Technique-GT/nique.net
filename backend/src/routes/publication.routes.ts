import express from 'express';
import { createPublication, getPublications } from '../controllers/publication.controller';
import { adminMiddleware } from '../middleware/admin.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// public to get date
router.get('/', getPublications);

// only admins can edit publication dates
router.post('/', authMiddleware, adminMiddleware, createPublication);

export default router;
