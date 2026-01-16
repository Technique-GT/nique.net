import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const idParamSchema = z.object({
  id: objectIdString,
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

export const articleIdParamSchema = z.object({
  articleId: objectIdString,
});
