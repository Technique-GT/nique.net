import mongoose from 'mongoose';

import { createApp } from './app';
import { env } from './utils/env';
import { logger } from './utils/logger';

if (env.MONGO_DB_NAME === 'technique' && env.NODE_ENV !== 'production') {
  throw new Error('Refusing to start with MONGO_DB_NAME=technique (read-only safety rule)');
}

const app = createApp();
const PORT = env.PORT;

// Connect to MongoDB
logger.info({ dbName: env.MONGO_DB_NAME }, 'Mongo target database');

mongoose
  .connect(env.ATLAS_URI, { dbName: env.MONGO_DB_NAME })
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server listening');
    });
  })
  .catch((error) => {
    logger.error({ error }, 'MongoDB connection error');
    process.exit(1);
  });
