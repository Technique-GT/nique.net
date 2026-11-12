"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoryBodySchema = exports.createCategoryBodySchema = void 0;
const zod_1 = require("zod");
exports.createCategoryBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(1).optional(),
});
exports.updateCategoryBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    slug: zod_1.z.string().trim().min(1).optional(),
});
