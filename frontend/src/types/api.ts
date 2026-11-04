export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  database: string;
  environment: {
    api_prefix: string;
    frontend_origin: string;
    gemini_configured: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  path?: string;
  details?: unknown;
  extra?: Record<string, unknown>;
}

