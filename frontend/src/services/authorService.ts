import apiClient, { unwrap } from './apiClient';
import type { AuthorProfile } from '../types/article';

const fetchAuthorByName = async (authorName: string, signal?: AbortSignal): Promise<AuthorProfile> => {
  const response = await apiClient.get(`/authors/${encodeURIComponent(authorName)}`, { signal });
  return unwrap(response.data);
};

export default {
  fetchAuthorByName,
};
