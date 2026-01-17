import { apiClient } from '@/lib/api-client'

export type User = {
  _id: string
  name: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get('/users')
  return res as unknown as User[]
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me')
  return res as unknown as User
}
