import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

export const createSliver = async (content: string) => {
    try {
        const response = await apiClient.post('/slivers', { text: content });
        return response.data;
    } catch (error) {
        throw error;
    }
};
