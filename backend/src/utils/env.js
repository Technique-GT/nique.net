"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load variables from `server/.env` for local dev.
dotenv_1.default.config();
// Treat empty strings as undefined so `.env.example` placeholders don't fail validation.
const optionalString = zod_1.z.string().transform((v) => v.trim() || undefined).pipe(zod_1.z.string().min(1).optional());
exports.env = zod_1.z
    .object({
    ATLAS_URI: zod_1.z.string().min(1),
    MONGO_DB_NAME: zod_1.z.string().min(1).default('test'),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(5050),
    JWT_TOKEN: zod_1.z.string().min(1),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GOOGLE_REDIRECT_URI: optionalString,
    CLIENT_URLS: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.string().optional(),
    NODE_ENV: zod_1.z.string().optional(),
    CLOUDFLARE_ZONE_ID: optionalString,
    CLOUDFLARE_API_TOKEN: optionalString,
    CLOUDFLARE_PURGE_ENABLED: zod_1.z.coerce.boolean().optional().default(false),
    PUBLIC_API_BASE_URL: optionalString,
    PUBLIC_CACHE_PURGE_ORIGINS: zod_1.z.string().trim().optional(),
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET_NAME: optionalString,
    R2_PUBLIC_URL: optionalString,
})
    .parse(process.env);
