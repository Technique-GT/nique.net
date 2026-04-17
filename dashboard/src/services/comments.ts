import { apiClient } from '@/lib/api-client'

export type CommentStats = {
  totalComments: number
  approvedComments: number
  pendingComments: number
}

export type Comment = {
  _id: string
  articleId: string
  parentCommentId?: string
  content: string
  username: string
  thumbsUp: number
  thumbsDown: number
  approved: boolean
  createdAt: string
  updatedAt: string
}

export type CommentsQuery = {
  page?: number
  limit?: number
  approved?: boolean
  articleId?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination?: { total: number; page: number; pages: number; limit: number }
}

export async function getCommentStats(): Promise<CommentStats> {
  const res = await apiClient.get('/comments/stats')
  return res as unknown as CommentStats
}

export async function getComments(query: CommentsQuery = {}): Promise<PaginatedResponse<Comment>> {
  const params: Record<string, string | number | boolean | undefined> = { ...query }
  if (typeof query.approved === 'boolean') {
    params.approved = query.approved.toString()
  }

  const res = await apiClient.get('/comments', { params })

  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown })) {
    const r = res as { data?: unknown; pagination?: unknown }
    return {
      data: Array.isArray(r.data) ? (r.data as Comment[]) : [],
      pagination: r.pagination as PaginatedResponse<Comment>['pagination'],
    }
  }

  if (Array.isArray(res)) {
    return { data: res as Comment[] }
  }

  return { data: [] }
}

export async function updateCommentStatus(id: string, approved: boolean): Promise<Comment> {
  const res = await apiClient.patch(`/comments/${id}/status`, { approved })
  return res as unknown as Comment
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/comments/${id}`)
}
