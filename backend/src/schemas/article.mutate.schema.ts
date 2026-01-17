import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const createArticleBodySchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  content: z.string().min(1),
  excerpt: z.string().trim().min(1).optional(),

  categoryId: objectIdString,
  subcategoryId: objectIdString.optional(),
  tagIds: z.array(objectIdString).optional(),

  // Accept either canonical authors or legacy string[]
  authors: z
    .array(
      z.union([
        objectIdString,
        z.object({
          authorId: objectIdString,
          order: z.coerce.number().int().min(0).optional(),
        }),
      ]),
    )
    .optional(),

  featuredMediaId: objectIdString.optional(),
  imageCaption: z.string().optional(),

  editorState: z.any().optional(),
  reviewStatus: z.enum(['draft', 'in_review', 'published']).optional(),

  published: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isSticky: z.boolean().optional(),
});

export const updateArticleBodySchema = createArticleBodySchema.partial();

export const updateArticleStatusBodySchema = z.object({
  status: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isSticky: z.boolean().optional(),
});
