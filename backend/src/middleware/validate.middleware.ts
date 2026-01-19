import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

const withContext = (err: ZodError, req: Request, target: ValidationTarget) => {
  (err as any).requestContext = {
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
const validate = (target: ValidationTarget, schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
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

export const validateBody = (schema: ZodTypeAny) => validate('body', schema);
export const validateQuery = (schema: ZodTypeAny) => validate('query', schema);
export const validateParams = (schema: ZodTypeAny) => validate('params', schema);

