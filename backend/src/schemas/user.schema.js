"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteUsersBodySchema = exports.updateUserBodySchema = exports.createUserBodySchema = exports.socialLinkSchema = void 0;
const zod_1 = require("zod");
const objectId_schema_1 = require("./objectId.schema");
const SOCIAL_PLATFORM_HOSTS = {
    instagram: 'instagram.com',
    linkedin: 'linkedin.com',
    github: 'github.com',
    x: 'x.com',
    youtube: 'youtube.com',
    facebook: 'facebook.com',
};
const isAllowedSocialUrl = (rawUrl, platform) => {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        if (platform === 'website') {
            return true;
        }
        const hostname = parsed.hostname.toLowerCase();
        const expected = SOCIAL_PLATFORM_HOSTS[platform];
        return hostname === expected || hostname.endsWith(`.${expected}`);
    }
    catch {
        return false;
    }
};
exports.socialLinkSchema = zod_1.z.object({
    platform: zod_1.z
        .enum([
        'instagram',
        'linkedin',
        'github',
        'x',
        'youtube',
        'facebook',
        'website',
    ])
        .transform((value) => value.toLowerCase()),
    url: zod_1.z.string().trim().url(),
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
exports.createUserBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    bio: zod_1.z.string().optional(),
    isAdmin: zod_1.z.boolean().optional(),
    email: zod_1.z.string().email().optional(),
    profilePictureUrl: zod_1.z.string().trim().min(1).optional(),
    socialLinks: zod_1.z.array(exports.socialLinkSchema).optional(),
});
exports.updateUserBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    bio: zod_1.z.string().nullable().optional(),
    isAdmin: zod_1.z.boolean().optional(),
    email: zod_1.z.string().email().nullable().optional(),
    profilePictureUrl: zod_1.z.string().trim().min(1).nullable().optional(),
    socialLinks: zod_1.z.array(exports.socialLinkSchema).optional(),
});
exports.bulkDeleteUsersBodySchema = zod_1.z.object({
    ids: zod_1.z.array(objectId_schema_1.objectIdString).min(1),
});
