import { apiClient } from '@/lib/api-client'

export type AdminArticlesQuery = {
  page?: number
  limit?: number
  search?: string
  status?: 'published' | 'draft' | 'in_review' | 'changes_requested'
  categoryId?: string
  subcategoryId?: string
  isFeatured?: boolean
  isSticky?: boolean
  hideDrafts?: boolean
}

export type BackendArticle = {
  _id: string
  title: string
  slug: string
  imageCaption?: string
  featuredMediaUrl?: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  viewCount?: number
  categoryId?: { _id: string; name: string; slug: string } | string | null
  reviewStatus?: 'draft' | 'in_review' | 'changes_requested' | 'published'
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
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
  const status = query.status
  const categoryId = query.categoryId
  const subcategoryId = query.subcategoryId
  const isFeatured = query.isFeatured
  const isSticky = query.isSticky
  const hideDrafts = query.hideDrafts

  const res = await apiClient.get('/admin/articles', {
    params: { 
      page, 
      limit, 
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(typeof isFeatured === 'boolean' ? { isFeatured } : {}),
      ...(typeof isSticky === 'boolean' ? { isSticky } : {}),
      ...(hideDrafts ? { hideDrafts } : {}),
    },
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

export async function createAdminArticleDraft(): Promise<BackendArticle> {
  const res = await apiClient.post('/admin/articles/draft')
  return res as unknown as BackendArticle
}

export type CreateAdminArticlePayload = {
  title: string
  content: string
  imageCaption?: string
  categoryId: string
  subcategoryId?: string
  tagIds?: string[]
  authors?: string[]
  featuredMediaUrl?: string
  editorState?: any
  published?: boolean
  reviewStatus?: 'draft' | 'in_review' | 'changes_requested' | 'published'
  isFeatured?: boolean
  isSticky?: boolean
}

export async function createAdminArticle(
  payload: CreateAdminArticlePayload,
): Promise<BackendArticle> {
  const res = await apiClient.post('/admin/articles', payload)
  return res as unknown as BackendArticle
}

export async function getAdminArticleById(id: string): Promise<BackendArticle & { content?: string, editorState?: any }> {
  const res = await apiClient.get(`/admin/articles/${id}`)
  return res as unknown as any
}
