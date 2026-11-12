"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleIdParamSchema = exports.authorNameParamSchema = exports.slugParamSchema = exports.idParamSchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.idParamSchema = zod_1.z.object({
    id: objectId_schema_1.objectIdString,
});
exports.slugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().trim().min(1),
});
exports.authorNameParamSchema = zod_1.z.object({
    authorName: zod_1.z.string().trim().min(1).max(120),
});
exports.articleIdParamSchema = zod_1.z.object({
    articleId: objectId_schema_1.objectIdString,
});
