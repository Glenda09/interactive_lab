import { apiClient } from "../../../shared/lib/api/client";
import { AuthUser } from "../state/useAuthStore";

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
}

export async function loginRequest(payload: { email: string; password: string }) {
  const response = await apiClient.post<AuthSessionResponse>("/v1/auth/login", payload);
  return response.data;
}

export async function refreshSessionRequest(payload: { refreshToken: string }) {
  const response = await apiClient.post<AuthSessionResponse>("/v1/auth/refresh", payload);
  return response.data;
}

export async function forgotPasswordRequest(payload: { email: string }) {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/v1/auth/forgot-password",
    payload
  );
  return response.data;
}

export async function resetPasswordRequest(payload: { token: string; newPassword: string }) {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/v1/auth/reset-password",
    payload
  );
  return response.data;
}

export async function logoutRequest(payload: { refreshToken: string }) {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/v1/auth/logout",
    payload
  );
  return response.data;
}

export async function changePasswordRequest(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    "/v1/auth/change-password",
    payload
  );
  return response.data;
}
