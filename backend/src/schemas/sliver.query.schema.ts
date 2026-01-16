import { z } from 'zod';

export const listSliversQuerySchema = z.object({
  active: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});
