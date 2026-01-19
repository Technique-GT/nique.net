/**
 * Centralized TanStack Query hooks for dashboard data.
 *
 * Persistence policy:
 * - Queries with `meta: { persist: true }` are cached in localStorage and rehydrated on reload.
 * - Use persist for: taxonomy (categories/subcategories/tags), collaborators, small stats.
 * - Do NOT persist: auth, large/fast-changing lists (articles, comments, users).
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import {
  getCategories,
  getSubCategories,
  getTags,
  type Category,
  type SubCategory,
  type Tag,
} from '@/services/taxonomy'
import {
  getCollaborators,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
  type Collaborator,
  type CollaboratorQuery,
} from '@/services/collaborators'
import {
  getUsers,
  type User,
} from '@/services/users'
import {
  getMedia,
  uploadMedia,
  deleteMedia,
  type MediaItem,
  type MediaQuery,
} from '@/services/media'
import {
  getComments,
  getCommentStats,
  updateCommentStatus,
  deleteComment,
  type Comment,
  type CommentsQuery,
  type CommentStats,
} from '@/services/comments'
import {
  getSlivers,
  deleteSliver,
  type Sliver,
  type SliversQuery,
} from '@/services/slivers'
import {
  getAdminArticleById,
  createAdminArticleDraft,
} from '@/services/articles'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// Query Keys (centralized for consistency)
// ============================================================================

export const queryKeys = {
  // Articles
  adminArticle: (id: string) => ['admin-article', id] as const,

  // Taxonomy - persisted
  categories: ['categories'] as const,
  subCategories: ['sub-categories'] as const,
  tags: ['tags'] as const,

  // Collaborators - persisted
  collaborators: (query?: CollaboratorQuery) => ['collaborators', query] as const,

  // Users - NOT persisted (PII)
  users: (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }) =>
    ['users', params] as const,

  // Media - NOT persisted (can be large)
  media: (query?: MediaQuery) => ['media', query] as const,

  // Comments - NOT persisted (fast-changing)
  comments: (query?: CommentsQuery) => ['comments', query] as const,
  commentStats: ['comment-stats'] as const,

  // Slivers - NOT persisted (fast-changing)
  slivers: (query?: SliversQuery) => ['slivers', query] as const,

  // Playlists - persisted (small reference data)
  playlists: ['playlists'] as const,

  // Tags stats - persisted
  tagStats: ['tag-stats'] as const,

  // Category stats - persisted
  categoryStats: ['category-stats'] as const,
  subCategoryStats: ['sub-category-stats'] as const,
}

// ============================================================================
// Taxonomy Hooks (PERSISTED)
// ============================================================================

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: { persist: true },
  })
}

export function useSubCategories() {
  return useQuery({
    queryKey: queryKeys.subCategories,
    queryFn: getSubCategories,
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: getTags,
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

// Combined taxonomy fetch for forms
export function useTaxonomy() {
  const categories = useCategories()
  const subCategories = useSubCategories()
  const tags = useTags()

  return {
    categories: categories.data ?? [],
    subCategories: subCategories.data ?? [],
    tags: tags.data ?? [],
    isLoading: categories.isLoading || subCategories.isLoading || tags.isLoading,
    isError: categories.isError || subCategories.isError || tags.isError,
    refetch: () => {
      categories.refetch()
      subCategories.refetch()
      tags.refetch()
    },
  }
}

// ============================================================================
// Collaborators Hooks (PERSISTED)
// ============================================================================

export function useCollaborators(query?: CollaboratorQuery) {
  return useQuery({
    queryKey: queryKeys.collaborators(query),
    queryFn: () => getCollaborators(query),
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

export function useCreateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCollaborator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
    },
  })
}

export function useUpdateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Collaborator> }) =>
      updateCollaborator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
    },
  })
}

export function useDeleteCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCollaborator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
    },
  })
}

// ============================================================================
// Users Hooks (NOT persisted - PII)
// ============================================================================

export function useUsers(params?: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => getUsers(params),
    staleTime: 30 * 1000, // 30 seconds
    // No meta.persist - users contain PII
  })
}

// ============================================================================
// Media Hooks (NOT persisted - can be large)
// ============================================================================

export function useMedia(query?: MediaQuery) {
  return useQuery({
    queryKey: queryKeys.media(query),
    queryFn: () => getMedia(query),
    staleTime: 30 * 1000,
    // No meta.persist
  })
}

export function useInfiniteMedia(query?: Omit<MediaQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['media-infinite', query],
    queryFn: ({ pageParam = 1 }) => getMedia({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })
}

// ============================================================================
// Comments Hooks (NOT persisted - fast-changing)
// ============================================================================

export function useComments(query?: CommentsQuery) {
  return useQuery({
    queryKey: queryKeys.comments(query),
    queryFn: () => getComments(query),
    staleTime: 15 * 1000, // 15 seconds
    // No meta.persist
  })
}

export function useCommentStats() {
  return useQuery({
    queryKey: queryKeys.commentStats,
    queryFn: getCommentStats,
    staleTime: 30 * 1000,
    meta: { persist: true }, // Stats are small, OK to persist
  })
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      updateCommentStatus(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.commentStats })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.commentStats })
    },
  })
}

// ============================================================================
// Slivers Hooks (NOT persisted - fast-changing)
// ============================================================================

export function useSlivers(query?: SliversQuery) {
  return useQuery({
    queryKey: queryKeys.slivers(query),
    queryFn: () => getSlivers(query),
    staleTime: 30 * 1000,
  })
}

export function useDeleteSliver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSliver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slivers'] })
    },
  })
}

// ============================================================================
// Playlists Hooks (PERSISTED - small reference data)
// ============================================================================

export type Playlist = {
  _id: string
  name: string
  description: string
  spotifyUrl: string
  image: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: async () => {
      const res = await apiClient.get('/playlists')
      return res as unknown as Playlist[]
    },
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Playlist>) => {
      const res = await apiClient.post('/playlists', data)
      return res as unknown as Playlist
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists })
    },
  })
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Playlist> }) => {
      const res = await apiClient.put(`/playlists/${id}`, data)
      return res as unknown as Playlist
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists })
    },
  })
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/playlists/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists })
    },
  })
}

export function useSetActivePlaylist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.put(`/playlists/${id}/set-active`)
      return res as unknown as Playlist
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists })
    },
  })
}

// ============================================================================
// Tag CRUD Mutations
// ============================================================================

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiClient.post('/tags', data)
      return res as unknown as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags })
      queryClient.invalidateQueries({ queryKey: queryKeys.tagStats })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string } }) => {
      const res = await apiClient.put(`/tags/${id}`, data)
      return res as unknown as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tags/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags })
      queryClient.invalidateQueries({ queryKey: queryKeys.tagStats })
    },
  })
}

export function useTagStats() {
  return useQuery({
    queryKey: queryKeys.tagStats,
    queryFn: async () => {
      const res = await apiClient.get('/tags/stats')
      return res as unknown as { totalTags: number }
    },
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

// ============================================================================
// Category CRUD Mutations
// ============================================================================

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiClient.post('/categories', data)
      return res as unknown as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryStats })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string } }) => {
      const res = await apiClient.put(`/categories/${id}`, data)
      return res as unknown as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: queryKeys.categoryStats })
    },
  })
}

export function useCategoryStats() {
  return useQuery({
    queryKey: queryKeys.categoryStats,
    queryFn: async () => {
      const res = await apiClient.get('/categories/stats')
      return res as unknown as { totalCategories: number }
    },
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

// ============================================================================
// SubCategory CRUD Mutations
// ============================================================================

export function useCreateSubCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; categoryId: string }) => {
      const res = await apiClient.post('/sub-categories', data)
      return res as unknown as SubCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories })
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategoryStats })
    },
  })
}

export function useUpdateSubCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; categoryId?: string } }) => {
      const res = await apiClient.put(`/sub-categories/${id}`, data)
      return res as unknown as SubCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories })
    },
  })
}

export function useDeleteSubCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/sub-categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategories })
      queryClient.invalidateQueries({ queryKey: queryKeys.subCategoryStats })
    },
  })
}

export function useSubCategoryStats() {
  return useQuery({
    queryKey: queryKeys.subCategoryStats,
    queryFn: async () => {
      const res = await apiClient.get('/sub-categories/stats')
      return res as unknown as { totalSubCategories: number }
    },
    staleTime: 5 * 60 * 1000,
    meta: { persist: true },
  })
}

// ============================================================================
// Article Hooks
// ============================================================================

export function useAdminArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.adminArticle(id),
    queryFn: () => getAdminArticleById(id),
    enabled: !!id,
    // We want the editor to always reflect current server state (review lock, latest content)
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}

export function useCreateArticleDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminArticleDraft,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] })
      return data
    },
  })
}

// Re-export types for convenience
export type { Category, SubCategory, Tag, Collaborator, User, MediaItem, Comment, CommentStats, Sliver }
