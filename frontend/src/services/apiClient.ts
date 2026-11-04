import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.data) {
      // Return structured backend exception
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network connection failed. Ensure backend server is running.',
      },
    });
  }
);

export default apiClient;

