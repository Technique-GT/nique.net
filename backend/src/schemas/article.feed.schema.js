"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedQuerySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.feedQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    categoryId: objectId_schema_1.objectIdString.optional(),
    tagId: objectId_schema_1.objectIdString.optional(),
    authorId: objectId_schema_1.objectIdString.optional(),
    search: zod_1.z.string().trim().min(1).optional(),
    isSticky: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false')])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
});
