import { apiClient } from '@/lib/api-client'

export type MediaImage = {
  _id: string
  key: string
  fileName?: string
  url: string
  contentType?: string
  size: number
  etag?: string
  uploadedAt: string
  lastModified?: string
}

export type MediaImagesResponse = {
  data: MediaImage[]
  pagination: {
    limit: number
    hasMore: boolean
    nextCursor: string | null
  }
}

export type MediaUsageArticle = {
  _id: string
  title: string
  slug: string
  published: boolean
  updatedAt: string
  reviewStatus?: 'draft' | 'in_review' | 'changes_requested' | 'published'
}

export type MediaUsageResponse = {
  data: MediaUsageArticle[]
  pagination: {
    total: number
    page: number
    pages: number
    limit: number
  }
}

export async function getMediaImages(params?: {
  cursor?: string
  limit?: number
  refresh?: boolean
  q?: string
  sortBy?: 'date' | 'size'
  sortDir?: 'asc' | 'desc'
}): Promise<MediaImagesResponse> {
  const res = await apiClient.get('/admin/media/images', {
    params: {
      ...(params?.cursor ? { cursor: params.cursor } : {}),
      ...(typeof params?.limit === 'number' ? { limit: params.limit } : {}),
      ...(params?.refresh ? { refresh: true } : {}),
      ...(params?.q ? { q: params.q } : {}),
      ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params?.sortDir ? { sortDir: params.sortDir } : {}),
    },
  })

  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown; pagination?: unknown })) {
    const typed = res as { data?: unknown; pagination?: unknown }
    return {
      data: Array.isArray(typed.data) ? (typed.data as MediaImage[]) : [],
      pagination: (typed.pagination as MediaImagesResponse['pagination']) ?? {
        limit: params?.limit ?? 24,
        hasMore: false,
        nextCursor: null,
      },
    }
  }

  return {
    data: [],
    pagination: {
      limit: params?.limit ?? 24,
      hasMore: false,
      nextCursor: null,
    },
  }
}

export async function getMediaUsage(
  mediaId: string,
  params?: { page?: number; limit?: number },
): Promise<MediaUsageResponse> {
  const res = await apiClient.get(`/admin/media/${mediaId}/usage`, {
    params: {
      ...(typeof params?.page === 'number' ? { page: params.page } : {}),
      ...(typeof params?.limit === 'number' ? { limit: params.limit } : {}),
    },
  })

  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown; pagination?: unknown })) {
    const typed = res as { data?: unknown; pagination?: unknown }
    return {
      data: Array.isArray(typed.data) ? (typed.data as MediaUsageArticle[]) : [],
      pagination: (typed.pagination as MediaUsageResponse['pagination']) ?? {
        total: 0,
        page: params?.page ?? 1,
        pages: 0,
        limit: params?.limit ?? 10,
      },
    }
  }

  return {
    data: [],
    pagination: {
      total: 0,
      page: params?.page ?? 1,
      pages: 0,
      limit: params?.limit ?? 10,
    },
  }
}

export async function deleteMedia(
  mediaId: string,
  params?: { confirmInUse?: boolean },
): Promise<{ _id: string; key: string; url: string; usageCount: number }> {
  const res = await apiClient.delete(`/admin/media/${mediaId}`, {
    params: {
      ...(params?.confirmInUse ? { confirmInUse: true } : {}),
    },
  })
  return res as unknown as { _id: string; key: string; url: string; usageCount: number }
}
