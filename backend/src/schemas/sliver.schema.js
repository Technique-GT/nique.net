"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSliverBodySchema = void 0;
const zod_1 = require("zod");
exports.createSliverBodySchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1),
});
