"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanQuerySchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.booleanQuerySchema = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.literal('true'), zod_1.z.literal('false')])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));
