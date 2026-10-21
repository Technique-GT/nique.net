import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Shared axios instance for calling backend.
 * All services should import this instead of creating their own axios.create().
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Helper to read client-side cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Request interceptor to automatically attach the CSRF token on mutations
apiClient.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(method || '');

    if (isMutation) {
      let csrfToken = getCookie('csrf-token');

      if (!csrfToken) {
        try {
          const response = await axios.get(`${API_BASE_URL}/csrf-token`, {
            withCredentials: true,
          });
          csrfToken = response.data.csrfToken;
        } catch (error) {
          // console.error('Failed to fetch CSRF token:', error);
        }
      }

      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response shape returned by many backend endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

/**
 * Unwrap a wrapped API response.
 * If the response is wrapped ({ success, data }), returns data.
 * Otherwise returns the payload as-is (defensive).
 */
export function unwrap<T>(payload: ApiResponse<T> | T): T {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

/**
 * Extract pagination from a wrapped API response.
 * Returns undefined if not present.
 */
export function extractPagination(
  payload: unknown
): ApiResponse<unknown>['pagination'] | undefined {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'pagination' in payload
  ) {
    return (payload as ApiResponse<unknown>).pagination;
  }
  return undefined;
}

export default apiClient;
