"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const logger_1 = require("../utils/logger");
const zod_error_1 = require("../utils/zod-error");
const isZodError = (err) => {
    return !!err && typeof err === 'object' && 'issues' in err;
};
const notFoundHandler = (_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, _req, res, _next) => {
    if (isZodError(err)) {
        const issues = (0, zod_error_1.normalizeZodError)(err);
        const ctx = err?.requestContext;
        res.status(400).json({
            success: false,
            message: 'Invalid request',
            ...(ctx ? { context: ctx } : {}),
            errors: issues.map((i) => `${i.path}: ${i.message}`),
            issues,
        });
        return;
    }
    // Mongo duplicate key errors
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
        res.status(409).json({
            success: false,
            message: 'Duplicate key',
        });
        return;
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
