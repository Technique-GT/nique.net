import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const createSubcategoryBodySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  categoryId: objectIdString,
});

export const updateSubcategoryBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  categoryId: objectIdString.optional(),
});
