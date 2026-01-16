import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from `server/.env` for local dev.
dotenv.config();

export const env = z
  .object({
    ATLAS_URI: z.string().min(1),
    MONGO_DB_NAME: z.string().min(1).default('test'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5050),
    CLIENT_URL: z.string().optional(),
    LOG_LEVEL: z.string().optional(),
    NODE_ENV: z.string().optional(),
  })
  .parse(process.env);
