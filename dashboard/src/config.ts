// Centralized API base URL for dashboard client.
// Priority:
// 1) VITE_API_BASE_URL
// 2) local dev fallback
// 3) production fallback (api.nique.net)
//
// For preview domains (for example *.pages.dev), using window.location.origin
// would call static hosting /api routes instead of the backend API.
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const ensureApiBase = (origin: string) => {
  const cleaned = stripTrailingSlash(origin)
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

const resolveApiOrigin = () => {
  if (configuredBase) return configuredBase
  if (import.meta.env.DEV) return 'http://localhost:5050'

  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
  if (
    hostname === 'dashboard.nique.net' ||
    hostname === 'nique.net' ||
    hostname === 'www.nique.net' ||
    hostname.endsWith('.pages.dev') ||
    hostname.endsWith('.vercel.app')
  ) {
    return 'https://api.nique.net'
  }

  return 'https://api.nique.net'
}

export const API_BASE_URL = ensureApiBase(resolveApiOrigin())
