"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommentsQuerySchema = void 0;
const zod_1 = require("zod");
exports.listCommentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    approved: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false')])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    // Plan.md Step 4: GET /api/comments?articleId=...
    articleId: zod_1.z.string().min(1).optional(),
});
