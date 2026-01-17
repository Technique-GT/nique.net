import { apiClient } from '@/lib/api-client'

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

export type MediaItem = {
  _id: string
  url: string
  altText: string
  createdAt: string
  updatedAt: string
}

export type MediaQuery = {
  page?: number
  limit?: number
  search?: string
}

export async function getMedia(query: MediaQuery = {}): Promise<PaginatedResponse<MediaItem>> {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const search = query.search

  const res = await apiClient.get('/media', {
    params: { page, limit, ...(search ? { search } : {}) },
  })

  // Handle potential unwrap variations
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown })) {
    const r = res as { data?: unknown; pagination?: unknown }
    return {
      data: Array.isArray(r.data) ? (r.data as MediaItem[]) : [],
      pagination: r.pagination as Pagination | undefined,
    }
  }

  if (Array.isArray(res)) {
    return { data: res as MediaItem[] }
  }

  return { data: [] }
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const formData = new FormData()
  formData.append('file', file)

  // Note: apiClient sets Content-Type to application/json by default,
  // so we need to let the browser set it for FormData (multipart/form-data)
  // or explicitly override it. Axios handles FormData automatically if we don't force JSON.
  // However, our apiClient setup forces 'Content-Type': 'application/json' in headers.
  // We need to override that.
  
  const res = await apiClient.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return res as unknown as MediaItem
}

export async function deleteMedia(id: string): Promise<void> {
  await apiClient.delete(`/media/${id}`)
}
