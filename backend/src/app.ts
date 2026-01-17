import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import articleRoutes from './routes/article.routes';
import categoryRoutes from './routes/category.routes';
import commentRoutes from './routes/comment.routes';
import collaboratorRoutes from './routes/collab.routes';
import mediaRoutes from './routes/media.routes';
import playlistRoutes from './routes/playlist.routes';
import sliverRoutes from './routes/sliver.routes';
import subCategoryRoutes from './routes/subCategory.routes';
import tagRoutes from './routes/tag.routes';
import userRoutes from './routes/user.routes';
import adminArticleRoutes from './routes/admin.articles.routes';
import authRoutes from './routes/auth.routes';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { env } from './utils/env';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  // Basic middleware
  app.use(
    pinoHttp({
      logger,
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      // Silence logs during tests
      autoLogging: process.env.NODE_ENV !== 'test',
    }),
  );

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:3000',
    'https://technique-dash-5men.vercel.app',
  ];

  if (env.CLIENT_URL) {
    allowedOrigins.push(env.CLIENT_URL);
  }

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Routes
  app.use('/api/articles', articleRoutes);
  app.use('/api/admin', adminArticleRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/sub-categories', subCategoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/collaborators', collaboratorRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/slivers', sliverRoutes);
  app.use('/api/comments', commentRoutes);

  // Simple health check
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
