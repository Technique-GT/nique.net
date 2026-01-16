import { z } from 'zod';

import { objectIdString } from './objectId.schema';

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: objectIdString.optional(),
  tagId: objectIdString.optional(),
  authorId: objectIdString.optional(),
  search: z.string().trim().min(1).optional(),
  isSticky: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});
