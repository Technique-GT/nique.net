import apiClient from './apiClient';

export interface Publication {
  _id: string;
  issueName: string;
  issueType: string;
  publishDate: string;
}

export const getPublications = async (): Promise<Publication[]> => {
  const response = await apiClient.get('/publications');
  return response.data;
};

export default {
  getPublications,
};
