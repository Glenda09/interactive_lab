import { apiClient } from "./client";

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface CourseSummaryResponse {
  id: string;
  code: string;
  title: string;
  status: "published" | "draft" | string;
  modules: number;
  estimatedDurationHours: number;
}

export interface PlatformUserResponse {
  id: string;
  email: string;
  fullName: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  roles: string[];
  permissions: string[];
  requirePasswordReset: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastCredentialIssuedAt: string | null;
  lastCredentialEmailSentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserCredentialDeliveryResponse {
  status: "sent" | "logged" | "failed" | "skipped";
  mode: string;
  message: string;
}

export interface UserMutationResponse {
  user: PlatformUserResponse;
  message: string;
  credentialDelivery?: UserCredentialDeliveryResponse;
}

export async function getHealthCheck() {
  const response = await apiClient.get<HealthCheckResponse>("/v1/health");
  return response.data;
}

export async function getCourses() {
  const response = await apiClient.get<CourseSummaryResponse[]>("/v1/courses");
  return response.data;
}

export async function getUsers() {
  const response = await apiClient.get<PlatformUserResponse[]>("/v1/users");
  return response.data;
}

export async function createUser(payload: {
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  status: string;
  sendCredentialsEmail: boolean;
}) {
  const response = await apiClient.post<UserMutationResponse>("/v1/users", payload);
  return response.data;
}

export async function updateUser(
  id: string,
  payload: {
    fullName: string;
    email: string;
    roles: string[];
    permissions: string[];
    status: string;
  }
) {
  const response = await apiClient.patch<UserMutationResponse>(`/v1/users/${id}`, payload);
  return response.data;
}

export async function inactivateUser(id: string) {
  const response = await apiClient.patch<UserMutationResponse>(`/v1/users/${id}/inactivate`);
  return response.data;
}

export async function sendUserCredentials(id: string) {
  const response = await apiClient.post<UserMutationResponse>(`/v1/users/${id}/send-credentials`);
  return response.data;
}
