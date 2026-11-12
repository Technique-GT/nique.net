"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommentsQuerySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.listCommentsQuerySchema = zod_1.z.object({
    articleId: objectId_schema_1.objectIdString,
    status: zod_1.z.enum(['approved', 'pending']).optional().default('approved'),
    includeReplies: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false')])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
});
