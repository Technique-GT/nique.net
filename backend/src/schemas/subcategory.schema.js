"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubcategoryBodySchema = exports.createSubcategoryBodySchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
exports.createSubcategoryBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(1).optional(),
    categoryId: objectId_schema_1.objectIdString,
});
exports.updateSubcategoryBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    slug: zod_1.z.string().trim().min(1).optional(),
    categoryId: objectId_schema_1.objectIdString.optional(),
});
