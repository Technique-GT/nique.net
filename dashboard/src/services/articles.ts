import { apiClient } from '@/lib/api-client'

export type AdminArticlesQuery = {
  page?: number
  limit?: number
  search?: string
}

export type BackendArticle = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  viewCount?: number
  categoryId?: { _id: string; name: string; slug: string } | string | null
}

export type Pagination = {
  total: number
  page: number
  pages: number
  limit: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination?: Pagination
}

export async function getAdminArticlesPage(query: AdminArticlesQuery = {}): Promise<PaginatedResponse<BackendArticle>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 100
  const search = query.search

  const res = await apiClient.get('/admin/articles', {
    params: { page, limit, ...(search ? { search } : {}) },
  })

  // After api-client unwrapping, paginated endpoints return the full envelope:
  // { success: true, data: [...], pagination: {...} }
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown; pagination?: unknown })) {
    const r = res as { data?: unknown; pagination?: unknown }
    return {
      data: Array.isArray(r.data) ? (r.data as BackendArticle[]) : [],
      pagination: r.pagination as Pagination | undefined,
    }
  }

  // Non-paginated fallback (or if interceptor returned data directly)
  if (Array.isArray(res)) {
    return { data: res as BackendArticle[] }
  }

  return { data: [] }
}

export async function getAdminArticlesAll(params: {
  limitPerPage?: number
  maxPages?: number
  search?: string
} = {}): Promise<BackendArticle[]> {
  const limitPerPage = params.limitPerPage ?? 100
  const maxPages = params.maxPages ?? 10

  const all: BackendArticle[] = []

  for (let page = 1; page <= maxPages; page++) {
    const res = await getAdminArticlesPage({ page, limit: limitPerPage, search: params.search })
    const items = Array.isArray(res.data) ? res.data : []
    all.push(...items)

    const pages = res.pagination?.pages
    if (!pages) {
      // If pagination is missing, assume single page.
      break
    }

    if (page >= pages) {
      break
    }
  }

  return all
}
