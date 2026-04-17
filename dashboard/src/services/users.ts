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
  data: T[]
  pagination: PaginationMeta
}

type ParsedUsersResponse = {
  data: User[]
  pagination?: PaginationMeta
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toPaginationMeta = (value: unknown): PaginationMeta | undefined => {
  if (!isObjectRecord(value)) return undefined

  const { total, page, pages, limit } = value
  if (
    typeof total === 'number'
    && typeof page === 'number'
    && typeof pages === 'number'
    && typeof limit === 'number'
  ) {
    return { total, page, pages, limit }
  }

  return undefined
}

const parseUsersResponse = (value: unknown): ParsedUsersResponse => {
  if (Array.isArray(value)) {
    return { data: value as User[] }
  }

  if (!isObjectRecord(value)) {
    return { data: [] }
  }

  if (!Array.isArray(value.data)) {
    return { data: [] }
  }

  const response = value as PaginatedResponse<User>
  return {
    data: response.data,
    pagination: toPaginationMeta(response.pagination),
  }
}

export async function getUsers(params?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  isAdmin?: boolean
}): Promise<User[]> {
  const res = await apiClient.get('/users', { params })
  const parsed = parseUsersResponse(res)
  return parsed.data
}

export async function getUsersPage(params?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  isAdmin?: boolean
}): Promise<{ data: User[]; pagination: PaginationMeta }> {
  const res = await apiClient.get('/users', { params })
  const parsed = parseUsersResponse(res)

  if (parsed.pagination) {
    return {
      data: parsed.data,
      pagination: parsed.pagination,
    }
  }

  if (parsed.data.length > 0) {
    const page = params?.page ?? 1
    const limit = params?.limit ?? parsed.data.length
    return {
      data: parsed.data,
      pagination: {
        total: parsed.data.length,
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
