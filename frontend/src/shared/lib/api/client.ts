import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "../../config/env";
import {
  AuthUser,
  readAccessToken,
  readRefreshToken,
  useAuthStore
} from "../../../modules/auth/state/useAuthStore";

interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
}

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000
});

const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000
});

let refreshPromise: Promise<AuthSessionResponse> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as RetriableRequestConfig | undefined;
    const refreshToken = readRefreshToken();
    const status = error.response?.status;
    const isAuthEndpoint = requestConfig?.url?.includes("/v1/auth/");

    if (!requestConfig || requestConfig._retry || status !== 401 || isAuthEndpoint || !refreshToken) {
      return Promise.reject(error);
    }

    requestConfig._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<AuthSessionResponse>("/v1/auth/refresh", { refreshToken })
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const session = await refreshPromise;
      useAuthStore.getState().updateSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user
      });

      requestConfig.headers.Authorization = `Bearer ${session.accessToken}`;
      return apiClient(requestConfig);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    }
  }
);
