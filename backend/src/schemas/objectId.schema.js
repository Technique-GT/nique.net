"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectIdString = void 0;
const zod_1 = require("zod");
exports.objectIdString = zod_1.z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId');
