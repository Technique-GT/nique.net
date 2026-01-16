import { z } from 'zod';

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  approved: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  // Plan.md Step 4: GET /api/comments?articleId=...
  articleId: z.string().min(1).optional(),
});
