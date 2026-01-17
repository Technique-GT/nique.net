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
    // If the backend sends { success: true, data: ... }, return data.
    // Otherwise return the response data as is.
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else if (response.data && response.data.success) {
      // Sometimes just success: true without data
      return response.data;
    }
    return response.data;
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
