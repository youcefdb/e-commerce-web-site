import { create } from 'zustand';
import type { BackendUser, LoginRequest, RegisterRequest, User } from '@/types/api.types';
import { authService } from '@/features/auth/services/auth.service';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getAccessToken, setAccessToken, toApiAssetUrl } from '@/lib/api/axios-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<string>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  clearError: () => void;
}

type UserResponse = BackendUser & { createdAt?: string; avatarUrl?: string | null };

// The backend returns created_at while frontend components use createdAt.
const normalizeUser = (user: UserResponse): User => ({
  ...user,
  createdAt: user.createdAt || user.created_at || '',
  avatar: toApiAssetUrl(user.avatar || user.avatarUrl),
  avatarUrl: toApiAssetUrl(user.avatarUrl || user.avatar),
});

let authCheckPromise: Promise<User | null> | null = null;

export const useAuthStore = create<AuthState>((set) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-logout', () => {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false, error: 'Session expired. Please log in again.' });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.login(credentials);
        setAccessToken(response.accessToken);
        const user = normalizeUser(response.user);
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch (err: unknown) {
        setAccessToken(null);
        const message = getApiErrorMessage(err, 'Login failed. Please check your credentials.');
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.register(data);
        set({ isLoading: false });
        return response.message;
      } catch (err: unknown) {
        setAccessToken(null);
        const message = getApiErrorMessage(err, 'Registration failed. Try again.');
        set({ error: message, isLoading: false });
        throw new Error(message);
      }
    },

    loginWithGoogle: () => {
      set({ isLoading: true, error: null });
      try {
        authService.loginWithGoogle();
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, 'Google sign-in could not be started.');
        set({ error: message, isLoading: false });
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await authService.logout();
      } finally {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    },

    checkAuth: () => {
      if (authCheckPromise) return authCheckPromise;

      set({ isLoading: true, error: null });
      authCheckPromise = (async () => {
        try {
          if (!getAccessToken()) {
            setAccessToken(await authService.refresh());
          }

          const user = normalizeUser(await authService.getMe());
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return null;
        } finally {
          authCheckPromise = null;
        }
      })();

      return authCheckPromise;
    }
  };
});
