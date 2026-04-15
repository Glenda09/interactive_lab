import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  requirePasswordReset: boolean;
  roles: string[];
  permissions: string[];
  sessionId?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => void;
  updateSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user
        }),
      updateSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user
        }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null
        })
    }),
    {
      name: "interactive-lab-auth"
    }
  )
);

export function readAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function readRefreshToken() {
  return useAuthStore.getState().refreshToken;
}
