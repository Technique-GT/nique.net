import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create a configured axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to read client-side cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Request interceptor to attach the CSRF token header on mutations
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
        } catch {
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

// Response interceptor to unwrap the backend envelope
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    // Most backend endpoints return: { success: true, data: ... }
    // Some also include: pagination (and other metadata). For those, we keep the envelope
    // so callers can read `data` + `pagination`.

    if (body && body.success === true) {
      if (Object.prototype.hasOwnProperty.call(body, 'pagination')) {
        return body
      }

      if (Object.prototype.hasOwnProperty.call(body, 'data')) {
        return body.data
      }

      return body
    }

    return body
  },
  (error) => {
    // Handle 401 Unauthorized globally if needed, or pass it down
    if (error.response?.status === 401) {
      // Optional: Trigger a logout action or redirect if not on login page
      // But usually we let the specific query handle the error

    }
    return Promise.reject(error);
  }
);
