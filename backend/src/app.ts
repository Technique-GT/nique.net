import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import articleRoutes from './routes/article.routes';
import categoryRoutes from './routes/category.routes';
import commentRoutes from './routes/comment.routes';
import playlistRoutes from './routes/playlist.routes';
import sliverRoutes from './routes/sliver.routes';
import subCategoryRoutes from './routes/subCategory.routes';
import tagRoutes from './routes/tag.routes';
import userRoutes from './routes/user.routes';
import authorRoutes from './routes/author.routes';
import adminArticleRoutes from './routes/admin.articles.routes';
import authRoutes from './routes/auth.routes';
import mediaRoutes from './routes/media.routes';
import notificationRoutes from './routes/notification.routes';

import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { env } from './utils/env';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();
  const isProduction = env.NODE_ENV === 'production';

  // Security: HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
  }));

  // Search engines should not index API responses.
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    next();
  });

  // Security: Rate limiting
  const isTest = process.env.NODE_ENV === 'test';
  
  // Global API rate limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 100000 : 2000, // Higher limit in tests
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
    skip: () => isTest, // Skip rate limiting in tests
  });

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 100000 : 10, // 10 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
    skip: () => isTest, // Skip rate limiting in tests
  });

  // Stricter rate limiter for write operations (comments, uploads)
  const writeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 10000 : 20, // 20 writes per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
    skip: () => isTest, // Skip rate limiting in tests
  });

  // Basic middleware
  app.use(
    pinoHttp({
      logger,
      customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      // Silence logs during tests
      autoLogging: process.env.NODE_ENV !== 'test',
    }),
  );

  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:3000',
    'https://nique.net',
    'https://www.nique.net',
    'https://technique-4t5.pages.dev',
    'https://technique-dashboard.pages.dev',
    'https://dashboard.nique.net',
  ]);

  // Allow branch-preview aliases for known frontend/dashboard projects.
  const allowedPreviewHostPatterns = [
    /^([a-z0-9-]+\.)?technique-4t5\.pages\.dev$/i,
    /^([a-z0-9-]+\.)?technique-dashboard\.pages\.dev$/i,
    /^([a-z0-9-]+\.)?technique-dash-5men\.vercel\.app$/i,
  ];

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedOrigins.has(origin)) return true;

    try {
      const { protocol, hostname } = new URL(origin);
      if (protocol !== 'https:') return false;
      return allowedPreviewHostPatterns.some((pattern) => pattern.test(hostname));
    } catch {
      return false;
    }
  };

  const configuredClientOrigins = (env.CLIENT_URLS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  configuredClientOrigins.forEach((origin) => allowedOrigins.add(origin));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (!isProduction || isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-device-id'],
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  const sendHealthResponse = (_req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  };

  // Apply global rate limiting to all API routes
  app.use('/api/', apiLimiter);

  // Apply stricter rate limiting to auth routes
  app.use('/api/auth', authLimiter);

  // Apply write rate limiting to comment creation and media uploads
  app.use('/api/comments', writeLimiter);
  app.use('/api/admin/media', writeLimiter);

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
  app.use('/api/authors', authorRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/slivers', sliverRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/admin/media', mediaRoutes);
  app.use('/api/notifications', notificationRoutes);

  // API health check
  app.get('/health', sendHealthResponse);
  app.get('/api/health', sendHealthResponse);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
