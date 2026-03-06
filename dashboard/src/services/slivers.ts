import { apiClient } from '@/lib/api-client'

export type Sliver = {
  _id: string
  text: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export type SliversQuery = {
  page?: number
  limit?: number
  active?: boolean
  search?: string
  sortBy?: 'createdAt' | 'expiresAt' | 'text'
  sortDir?: 'asc' | 'desc'
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination?: { total: number; page: number; pages: number; limit: number }
}

export async function getSlivers(
  query: SliversQuery = {}
): Promise<PaginatedResponse<Sliver>> {
  const params: Record<string, string | number | boolean> = { ...query }
  if (typeof query.active === 'boolean') {
    params.active = query.active.toString()
  }

  const res = await apiClient.get('/slivers/all', { params })

  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown })) {
    const r = res as { data?: unknown; pagination?: PaginatedResponse<Sliver>['pagination'] }
    return {
      data: Array.isArray(r.data) ? (r.data as Sliver[]) : [],
      pagination: r.pagination,
    }
  }

  if (Array.isArray(res)) {
    return { data: res as Sliver[] }
  }

  return { data: [] }
}

export async function deleteSliver(id: string): Promise<void> {
  await apiClient.delete(`/slivers/${id}`)
}
