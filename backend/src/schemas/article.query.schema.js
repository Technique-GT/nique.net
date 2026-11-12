"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishedArticlesQuerySchema = exports.listArticlesQuerySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.listArticlesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().trim().min(1).optional(),
    status: zod_1.z.enum(['published', 'draft', 'in_review', 'changes_requested']).optional(),
    categoryId: objectId_schema_1.objectIdString.optional(),
    subcategoryId: objectId_schema_1.objectIdString.optional(),
    isFeatured: zod_1.z.coerce.boolean().optional(),
    isSticky: zod_1.z.coerce.boolean().optional(),
    hideDrafts: zod_1.z.coerce.boolean().optional(),
});
exports.publishedArticlesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().trim().min(1).optional(),
    categoryId: objectId_schema_1.objectIdString.optional(),
});
