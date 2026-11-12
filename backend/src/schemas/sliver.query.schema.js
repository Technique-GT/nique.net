"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSliversQuerySchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.listSliversQuerySchema = common_schema_1.paginationQuerySchema.extend({
    search: zod_1.z.string().trim().min(1).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'expiresAt', 'text']).optional(),
    sortDir: zod_1.z.enum(['asc', 'desc']).optional(),
});
