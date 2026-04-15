import { z } from 'zod';

import { objectIdString } from './objectId.schema';

export const idParamSchema = z.object({
  id: objectIdString,
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

export const authorNameParamSchema = z.object({
  authorName: z.string().trim().min(1).max(120),
});

export const articleIdParamSchema = z.object({
  articleId: objectIdString,
});
