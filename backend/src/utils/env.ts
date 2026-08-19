import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from `server/.env` for local dev.
dotenv.config();

// Treat empty strings as undefined so `.env.example` placeholders don't fail validation.
const optionalString = z.string().transform((v) => v.trim() || undefined).pipe(z.string().min(1).optional());

export const env = z
  .object({
    ATLAS_URI: z.string().min(1),
    MONGO_DB_NAME: z.string().min(1).default('test'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5050),
    JWT_TOKEN: z.string().min(1),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: optionalString,
    CLIENT_URLS: z.string().optional(),
    LOG_LEVEL: z.string().optional(),
    NODE_ENV: z.string().optional(),
    CLOUDFLARE_ZONE_ID: optionalString,
    CLOUDFLARE_API_TOKEN: optionalString,
    CLOUDFLARE_PURGE_ENABLED: z.coerce.boolean().optional().default(false),
    PUBLIC_API_BASE_URL: optionalString,
    PUBLIC_CACHE_PURGE_ORIGINS: z.string().trim().optional(),
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET_NAME: optionalString,
    R2_PUBLIC_URL: optionalString,
  })
  .parse(process.env);
