import { z } from 'zod';
import { booleanQuerySchema, paginationQuerySchema } from './common.schema';

export const listSliversQuerySchema = paginationQuerySchema.extend({
  active: booleanQuerySchema.optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['createdAt', 'expiresAt', 'text']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});
