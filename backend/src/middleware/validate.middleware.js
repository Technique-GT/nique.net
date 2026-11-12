"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const withContext = (err, req, target) => {
    err.requestContext = {
        method: req.method,
        path: req.originalUrl,
        target,
    };
    return err;
};
/**
 * Validation-only middleware.
 * Validates input against schema and rejects bad requests.
 * Uses object property definition to override read-only req properties in Express 5+.
 * Controllers continue reading from req.query/params/body as usual.
 */
const validate = (target, schema) => {
    return (req, _res, next) => {
        const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
            next(withContext(parsed.error, req, target));
            return;
        }
        // For body, we can mutate it directly.
        if (target === 'body') {
            req.body = parsed.data;
        }
        // For query and params in Express 5, we must use defineProperty to override the getter.
        else if (target === 'query') {
            Object.defineProperty(req, 'query', { value: parsed.data, configurable: true });
        }
        else if (target === 'params') {
            Object.defineProperty(req, 'params', { value: parsed.data, configurable: true });
        }
        next();
    };
};
const validateBody = (schema) => validate('body', schema);
exports.validateBody = validateBody;
const validateQuery = (schema) => validate('query', schema);
exports.validateQuery = validateQuery;
const validateParams = (schema) => validate('params', schema);
exports.validateParams = validateParams;
