import { axiosClient, API_BASE_URL, getAccessToken, refreshAccessToken } from '@/lib/api/axios-client';
import type { AxiosError } from 'axios';
import type { AuthResponse, BackendUser, LoginRequest, RegisterRequest } from '@/types/api.types';

interface MessageResponse {
  message: string;
}

const postProtectedAuth = async <Response>(url: string, body: unknown): Promise<Response> => {
  let accessToken = getAccessToken();
  if (!accessToken) accessToken = await refreshAccessToken();

  const send = () => axiosClient.post<Response>(url, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  try {
    const response = await send();
    return response.data;
  } catch (error: unknown) {
    if ((error as AxiosError).response?.status !== 401) throw error;
    accessToken = await refreshAccessToken();
    const response = await send();
    return response.data;
  }
};

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<MessageResponse> {
    const response = await axiosClient.post<MessageResponse>('/auth/register', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await axiosClient.get<MessageResponse>('/auth/verify-email', {
      params: { token, confirm: '1' },
      headers: { Accept: 'application/json' },
    });
    return response.data;
  },

  async requestEmailVerification(credentials: { email: string; password: string }): Promise<MessageResponse> {
    const response = await axiosClient.post<MessageResponse>('/auth/verification/resend', credentials);
    return response.data;
  },

  async beginGoogleLink(currentPassword?: string): Promise<string> {
    const response = await postProtectedAuth<{ url: string }>('/auth/google/link', {
      ...(currentPassword ? { currentPassword } : {}),
    });
    return response.url;
  },

  loginWithGoogle(): void {
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in can only be started in a browser.');
    }
    window.location.assign(new URL('/auth/google', API_BASE_URL).toString());
  },

  async refresh(): Promise<string> {
    return refreshAccessToken();
  },

  async getMe(): Promise<BackendUser> {
    const response = await axiosClient.get<{ data: BackendUser }>('/api/v1/users/me');
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post('/auth/logout');
  }
};
