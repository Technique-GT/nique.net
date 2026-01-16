import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const createCommentBodySchema = z.object({
  articleId: objectIdString,
  username: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1),
  parentCommentId: objectIdString.optional(),
});

export const updateCommentBodySchema = z.object({
  content: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
});

export const updateCommentStatusBodySchema = z
  .object({
    approved: z.boolean().optional(),
    status: z.string().optional(),
  })
  .refine((v) => v.approved !== undefined || v.status !== undefined, {
    message: 'Either approved or status is required',
  });
