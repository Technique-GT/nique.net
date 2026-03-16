import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from `server/.env` for local dev.
dotenv.config();

export const env = z
  .object({
    ATLAS_URI: z.string().min(1),
    MONGO_DB_NAME: z.string().min(1).default('test'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5050),
    JWT_TOKEN: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().min(1),
    CLIENT_URL: z.string().optional(),
    LOG_LEVEL: z.string().optional(),
    NODE_ENV: z.string().optional(),
    CLOUDFLARE_ZONE_ID: z.string().trim().min(1).optional(),
    CLOUDFLARE_API_TOKEN: z.string().trim().min(1).optional(),
    CLOUDFLARE_PURGE_ENABLED: z.coerce.boolean().optional().default(false),
    PUBLIC_API_BASE_URL: z.string().trim().min(1).optional(),
    PUBLIC_CACHE_PURGE_ORIGINS: z.string().trim().optional(),
    R2_ACCOUNT_ID: z.string().trim().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
    R2_BUCKET_NAME: z.string().trim().min(1).optional(),
    R2_PUBLIC_URL: z.string().trim().min(1).optional(),
  })
  .parse(process.env);
