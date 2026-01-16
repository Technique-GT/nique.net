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
 * Does NOT replace req.query/params (Express 5+ makes them read-only).
 * Controllers continue reading from req.query/params as strings.
 */
const validate = (target: ValidationTarget, schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      next(withContext(parsed.error, req, target));
      return;
    }

    // For body, we can mutate it (not read-only)
    if (target === 'body') {
      req.body = parsed.data;
    }

    next();
  };
};

export const validateBody = (schema: ZodTypeAny) => validate('body', schema);
export const validateQuery = (schema: ZodTypeAny) => validate('query', schema);
export const validateParams = (schema: ZodTypeAny) => validate('params', schema);

