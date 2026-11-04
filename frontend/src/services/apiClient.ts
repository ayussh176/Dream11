import axios, { AxiosError, AxiosResponse } from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
// If user supplied https://backend-domain.com without /api, append /api
if (rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}

export const apiClient = axios.create({
  baseURL: rawBaseUrl,
  timeout: 20000,
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
