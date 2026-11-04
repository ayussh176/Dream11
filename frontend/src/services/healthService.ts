import apiClient from './apiClient';
import { HealthCheckResponse } from '../types/api';

export const healthService = {
  async getHealth(): Promise<HealthCheckResponse> {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  },
};

