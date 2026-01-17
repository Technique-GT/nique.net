import { apiClient } from '@/lib/api-client'

export type User = {
  _id: string
  name: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export async function getUsers(params?: {
  page?: number
  limit?: number
  search?: string
  isAdmin?: boolean
}): Promise<User[]> {
  const res: any = await apiClient.get('/users', { params })

  if (Array.isArray(res)) return res as User[]
  if (res && Array.isArray((res as PaginatedResponse<User>).data)) return (res as PaginatedResponse<User>).data

  return []
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me')
  return res as unknown as User
}
