import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { BackendUser, User, UpdateUserRequest, UpdateUserResponse } from '@/types/api.types';

const normalizeUser = (user: BackendUser): User => ({
  ...user,
  createdAt: user.created_at || '',
  avatar: toApiAssetUrl(user.avatar),
  avatarUrl: toApiAssetUrl(user.avatar),
});

export const userService = {
  async getProfile(): Promise<User> {
    const response = await axiosClient.get<{ data: BackendUser }>('/api/v1/users/me');
    return normalizeUser(response.data.data);
  },

  async updateProfile(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await axiosClient.patch<{
      message: string;
      data: { name: string; email: string; updated_at?: string };
    }>('/api/v1/users/me', data);
    return {
      message: response.data.message,
      data: {
        ...response.data.data,
        updatedAt: response.data.data.updated_at,
      },
    };
  },

  async uploadProfileImage(image: File, onProgress?: (progress: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append('image', image);
    // Let the browser set the multipart boundary in Content-Type.
    await axiosClient.post('/api/v1/users/image', formData, {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      },
    });
    onProgress?.(100);
  },

  async removeProfileImage(): Promise<void> {
    await axiosClient.delete('/api/v1/users/me');
  }
};
