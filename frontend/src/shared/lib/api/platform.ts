import { apiClient } from "./client";

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

export async function getHealthCheck() {
  const response = await apiClient.get<HealthCheckResponse>("/v1/health");
  return response.data;
}

