import { apiClient } from '@/lib/api-client'

export type User = {
  _id: string
  name: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export type PaginationMeta = {
  total: number
  page: number
  pages: number
  limit: number
}

type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  pagination: PaginationMeta
}

export async function getUsers(params?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  isAdmin?: boolean
}): Promise<User[]> {
  const res: any = await apiClient.get('/users', { params })

  if (Array.isArray(res)) return res as User[]
  if (res && Array.isArray((res as PaginatedResponse<User>).data)) return (res as PaginatedResponse<User>).data

  return []
}

export async function getUsersPage(params?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  isAdmin?: boolean
}): Promise<{ data: User[]; pagination: PaginationMeta }> {
  const res: any = await apiClient.get('/users', { params })

  if (res && Array.isArray((res as PaginatedResponse<User>).data)) {
    const response = res as PaginatedResponse<User>
    return {
      data: response.data,
      pagination: response.pagination,
    }
  }

  if (Array.isArray(res)) {
    const page = params?.page ?? 1
    const limit = params?.limit ?? res.length
    return {
      data: res as User[],
      pagination: {
        total: res.length,
        page,
        pages: 1,
        limit,
      },
    }
  }

  return {
    data: [],
    pagination: {
      total: 0,
      page: params?.page ?? 1,
      pages: 1,
      limit: params?.limit ?? 0,
    },
  }
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/auth/me')
  return res as unknown as User
}
