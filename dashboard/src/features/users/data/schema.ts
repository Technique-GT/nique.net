import { z } from 'zod'

const socialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
})

const userSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  isAdmin: z.boolean(),
  email: z.string().email().optional(),
  googleSub: z.string().optional(),
  profilePictureMediaId: z.string().optional(),
  socialLinks: z.array(socialLinkSchema),
})

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
