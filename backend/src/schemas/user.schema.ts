import { z } from 'zod';
import { objectIdString } from './objectId.schema';

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1),
  bio: z.string().optional(),
  isAdmin: z.boolean().optional(),
  profilePictureMediaId: objectIdString.optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

export const updateUserBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  bio: z.string().nullable().optional(),
  isAdmin: z.boolean().optional(),
  profilePictureMediaId: objectIdString.nullable().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

export const bulkDeleteUsersBodySchema = z.object({
  ids: z.array(objectIdString).min(1),
});
