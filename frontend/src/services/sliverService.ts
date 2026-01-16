import apiClient, { unwrap } from './apiClient';

// =============================================================================
// Sliver Endpoints (aligned with backend routes)
// =============================================================================

interface Sliver {
  _id: string;
  text: string;
  expiresAt: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create a new sliver.
 * backend: POST /slivers
 * Body: { text }
 */
export const createSliver = async (content: string): Promise<Sliver> => {
  const response = await apiClient.post('/slivers', { text: content });
  return unwrap(response.data);
};

/**
 * Fetch all active slivers.
 * backend: GET /slivers/active
 */
export const fetchActiveSlivers = async (signal?: AbortSignal): Promise<Sliver[]> => {
  const response = await apiClient.get('/slivers/active', { signal });
  return unwrap(response.data);
};

/**
 * Fetch all slivers.
 * backend: GET /slivers
 */
export const fetchAllSlivers = async (signal?: AbortSignal): Promise<Sliver[]> => {
  const response = await apiClient.get('/slivers', { signal });
  return unwrap(response.data);
};

export default {
  createSliver,
  fetchActiveSlivers,
  fetchAllSlivers,
};
