import apiClient from './apiClient';

export const createStory = async (title: string, content: string) => {
    try {
        const response = await apiClient.post('/stories', { title, content });
        return response.data;
    } catch (error) {
        throw error;
    }
};
