"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTagBodySchema = exports.createTagBodySchema = void 0;
const zod_1 = require("zod");
exports.createTagBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    slug: zod_1.z.string().trim().min(1).optional(),
});
exports.updateTagBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    slug: zod_1.z.string().trim().min(1).optional(),
});
