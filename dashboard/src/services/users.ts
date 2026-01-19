import { apiClient } from '@/lib/api-client'

export type User = {
  _id: string
  name: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export type PaginatedUsersResponse = {
  data: User[]
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
}): Promise<PaginatedUsersResponse> {
  const res: any = await apiClient.get('/users', { params })

  // If response is already in the expected format (standard backend response)
  if (res && res.data && res.pagination) {
    return {
      data: res.data as User[],
      pagination: res.pagination
    }
  }

  // Fallback for legacy or direct array responses
  if (Array.isArray(res)) {
    return {
      data: res as User[],
      pagination: {
        total: res.length,
        page: 1,
        pages: 1,
        limit: res.length
      }
    }
  }

  return {
    data: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 10 }
  }
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me')
  return res as unknown as User
}
