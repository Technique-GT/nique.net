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
  email: z.string().email().optional(),
  profilePictureUrl: z.string().trim().min(1).optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

export const updateUserBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  bio: z.string().nullable().optional(),
  isAdmin: z.boolean().optional(),
  email: z.string().email().nullable().optional(),
  profilePictureUrl: z.string().trim().min(1).nullable().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

export const bulkDeleteUsersBodySchema = z.object({
  ids: z.array(objectIdString).min(1),
});
