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
