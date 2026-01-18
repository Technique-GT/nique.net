import type { AuthUser } from '@/stores/authStore'

export const isAdminUser = (user?: AuthUser | null): boolean =>
  !!user?.isAdmin

export const canManageStaff = (user?: AuthUser | null): boolean =>
  isAdminUser(user)

export const canManageTaxonomy = (user?: AuthUser | null): boolean =>
  isAdminUser(user)

export const canManageMedia = (user?: AuthUser | null): boolean =>
  isAdminUser(user)

export const canAccessAnalytics = (user?: AuthUser | null): boolean =>
  isAdminUser(user)
