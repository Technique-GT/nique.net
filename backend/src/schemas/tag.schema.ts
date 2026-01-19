import { z } from 'zod';

export const createTagBodySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
});

export const updateTagBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
});
