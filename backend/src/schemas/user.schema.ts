import { z } from 'zod';
import { objectIdString } from './objectId.schema';

const SOCIAL_PLATFORM_HOSTS = {
  instagram: 'instagram.com',
  linkedin: 'linkedin.com',
} as const;

const isAllowedSocialUrl = (rawUrl: string, platform: keyof typeof SOCIAL_PLATFORM_HOSTS): boolean => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const expected = SOCIAL_PLATFORM_HOSTS[platform];
    return hostname === expected || hostname.endsWith(`.${expected}`);
  } catch {
    return false;
  }
};

export const socialLinkSchema = z.object({
  platform: z
    .enum(['instagram', 'linkedin'])
    .transform((value) => value.toLowerCase() as 'instagram' | 'linkedin'),
  url: z.string().trim().url(),
})
  .superRefine((value, ctx) => {
    if (!isAllowedSocialUrl(value.url, value.platform)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: `URL must be a valid ${value.platform} link`,
      });
    }
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
