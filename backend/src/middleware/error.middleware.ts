import type { NextFunction, Request, Response } from 'express';
import type { ZodError } from 'zod';

import { logger } from '../utils/logger';
import { normalizeZodError } from '../utils/zod-error';

type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: string[];
  context?: { method: string; path: string; target: 'body' | 'query' | 'params' };
  issues?: Array<{ path: string; message: string; code: string; expected?: string; received?: string }>;
};

const isZodError = (err: unknown): err is ZodError => {
  return !!err && typeof err === 'object' && 'issues' in err;
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  } satisfies ApiErrorResponse);
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isZodError(err)) {
    const issues = normalizeZodError(err);
    const ctx = (err as any)?.requestContext;

    res.status(400).json({
      success: false,
      message: 'Invalid request',
      ...(ctx ? { context: ctx } : {}),
      errors: issues.map((i) => `${i.path}: ${i.message}`),
      issues,
    } satisfies ApiErrorResponse);
    return;
  }

  // Mongo duplicate key errors
  if (err && typeof err === 'object' && 'code' in err && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate key',
    } satisfies ApiErrorResponse);
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  } satisfies ApiErrorResponse);
};
