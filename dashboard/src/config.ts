// Centralized API base URL for client
// Priority: VITE_API_URL → dev fallback (http://localhost:5050 when import.meta.env.DEV) → window.location.origin
// Ensures no trailing slash and appends `/api` segment.
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const apiOrigin = import.meta.env.DEV
  ? ((import.meta.env.VITE_DEV_API_URL as string | undefined)?.trim() || 'http://localhost:5050')
  : ((import.meta.env.VITE_API_URL as string | undefined)?.trim() || window.location.origin)

export const API_BASE_URL = `${stripTrailingSlash(apiOrigin)}/api`
