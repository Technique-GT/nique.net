import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['published', 'draft', 'in_review', 'changes_requested']).optional(),
  categoryId: objectIdString.optional(),
  subcategoryId: objectIdString.optional(),
  isFeatured: z.coerce.boolean().optional(),
  isSticky: z.coerce.boolean().optional(),
  hideDrafts: z.coerce.boolean().optional(),
});

export const publishedArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categoryId: objectIdString.optional(),
});
