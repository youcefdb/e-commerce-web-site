import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/review.service';
import { CreateReviewRequest } from '@/types/api.types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/errors';

export function useReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => reviewService.getReviews(productId, page),
    enabled: !!productId,
  });
}

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewService.createReview(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch product to update average rating and review counts
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Review submitted successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to submit review'));
    }
  });
}

export function useUpdateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: CreateReviewRequest }) =>
      reviewService.updateReview(productId, reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Review updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update review'));
    }
  });
}

export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.deleteReview(productId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Review deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete review'));
    }
  });
}
