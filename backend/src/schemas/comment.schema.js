"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentStatusBodySchema = exports.updateCommentBodySchema = exports.createCommentBodySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.createCommentBodySchema = zod_1.z.object({
    articleId: objectId_schema_1.objectIdString,
    username: zod_1.z.string().trim().min(1).optional(),
    content: zod_1.z.string().trim().min(1),
    parentCommentId: objectId_schema_1.objectIdString.optional(),
});
exports.updateCommentBodySchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1).optional(),
    username: zod_1.z.string().trim().min(1).optional(),
});
exports.updateCommentStatusBodySchema = zod_1.z
    .object({
    approved: zod_1.z.boolean().optional(),
    status: zod_1.z.string().optional(),
})
    .refine((v) => v.approved !== undefined || v.status !== undefined, {
    message: 'Either approved or status is required',
});
