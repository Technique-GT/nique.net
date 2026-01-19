import { z } from 'zod';

export const commentsByArticleQuerySchema = z.object({
  status: z.enum(['approved', 'pending']).optional().default('approved'),
  includeReplies: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
