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
