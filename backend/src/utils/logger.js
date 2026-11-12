"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const baseOptions = {
    level: process.env.LOG_LEVEL || 'info',
};
exports.logger = process.env.NODE_ENV === 'production'
    ? (0, pino_1.default)(baseOptions)
    : (0, pino_1.default)(baseOptions, pino_1.default.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }));
