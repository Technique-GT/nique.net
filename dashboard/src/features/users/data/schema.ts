import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('writer'),
  z.literal('editor'),
])

// Update to use _id from MongoDB and add id for frontend compatibility
const userSchema = z.object({
  _id: z.string(), // MongoDB _id
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
// Create a type that includes both _id and id for frontend compatibility
export type User = z.infer<typeof userSchema> & { id: string }

export const userListSchema = z.array(userSchema)