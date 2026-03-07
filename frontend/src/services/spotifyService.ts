import apiClient, { unwrap } from './apiClient';

export interface SpotifyPlaylist {
  _id: string;
  name: string;
  description: string;
  spotifyUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fetchActivePlaylist = async (
  signal?: AbortSignal
): Promise<SpotifyPlaylist | null> => {
  const response = await apiClient.get('/playlists/active', { signal });
  return unwrap(response.data);
};

export default {
  fetchActivePlaylist,
};
