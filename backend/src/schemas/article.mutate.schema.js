"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArticleStatusBodySchema = exports.updateArticleBodySchema = exports.createArticleBodySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.createArticleBodySchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(1).optional(),
    content: zod_1.z.string().min(1),
    categoryId: objectId_schema_1.objectIdString,
    subcategoryId: objectId_schema_1.objectIdString.optional(),
    tagIds: zod_1.z.array(objectId_schema_1.objectIdString).optional(),
    // Accept either canonical authors or legacy string[]
    authors: zod_1.z
        .array(zod_1.z.union([
        objectId_schema_1.objectIdString,
        zod_1.z.object({
            authorId: objectId_schema_1.objectIdString,
            order: zod_1.z.coerce.number().int().min(0).optional(),
        }),
    ]))
        .optional(),
    featuredMediaUrl: zod_1.z.string().trim().min(1).optional(),
    imageCaption: zod_1.z.string().optional(),
    editorState: zod_1.z.any().optional(),
    reviewStatus: zod_1.z.enum(['draft', 'in_review', 'changes_requested', 'published']).optional(),
    published: zod_1.z.boolean().optional(),
    allowComments: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    isSticky: zod_1.z.boolean().optional(),
});
exports.updateArticleBodySchema = exports.createArticleBodySchema.partial();
exports.updateArticleStatusBodySchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'published']).optional(),
    isFeatured: zod_1.z.boolean().optional(),
    isSticky: zod_1.z.boolean().optional(),
});
