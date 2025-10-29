import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  withCredentials: true,
});

export const createStory = async (title: string, content: string) => {
    try {
        const response = await apiClient.post('/stories', { title, content });
        return response.data;
    } catch (error) {
        throw error;
    }
};
