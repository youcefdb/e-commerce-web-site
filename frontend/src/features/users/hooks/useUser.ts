import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { UpdateUserRequest } from '@/types/api.types';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/errors';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userService.updateProfile(data),
    onSuccess: (result, data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (data.password) {
        // The backend revokes refresh sessions after a password change.
        void useAuthStore.getState().logout().catch(() => {});
      } else {
        // Re-fetch user session to update global Zustand state.
        checkAuth();
      }
      toast.success(data.email ? result.message : 'Profile updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'));
    }
  });
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return useMutation({
    mutationFn: ({ image, onProgress }: { image: File; onProgress?: (progress: number) => void }) =>
      userService.uploadProfileImage(image, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      checkAuth();
      toast.success('Profile photo updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update profile photo'));
    },
  });
}

export function useRemoveProfileImage() {
  const queryClient = useQueryClient();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return useMutation({
    mutationFn: () => userService.removeProfileImage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      checkAuth();
      toast.success('Profile photo removed successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to remove profile photo'));
    },
  });
}
