// Centralized API base URL for client
// Priority: VITE_API_BASE_URL → dev fallback → window.location.origin
// Ensures no trailing slash and appends `/api` segment when missing.
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')
const ensureApiBase = (origin: string) => {
  const cleaned = stripTrailingSlash(origin)
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

const apiOrigin = import.meta.env.DEV
  ? (configuredBase || 'http://localhost:5050')
  : (configuredBase || window.location.origin)

export const API_BASE_URL = ensureApiBase(apiOrigin)
