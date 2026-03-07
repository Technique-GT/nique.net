// Centralized API base URL for client.
// Priority:
// 1. VITE_API_BASE_URL
// 2. local dev fallback
// 3. production nique.net -> api.nique.net
// 4. same-origin fallback for non-production preview hosts
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

const ensureApiBase = (origin: string) => {
  const cleaned = stripTrailingSlash(origin)
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

const resolveApiOrigin = () => {
  if (configuredBase) {
    return configuredBase
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5050'
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  if (hostname === 'nique.net' || hostname === 'www.nique.net') {
    return 'https://api.nique.net'
  }

  return typeof window !== 'undefined' ? window.location.origin : 'https://api.nique.net'
}

export const API_BASE_URL = ensureApiBase(resolveApiOrigin())
