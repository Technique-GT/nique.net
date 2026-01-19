import { z } from 'zod';

export const createSliverBodySchema = z.object({
  text: z.string().trim().min(1),
});
