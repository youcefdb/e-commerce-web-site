import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { Review, CreateReviewRequest, PaginatedResult } from '@/types/api.types';

interface BackendReview {
  id: string;
  product_id: string;
  user_id: string;
  name: string;
  avatar?: string | null;
  rating: number | string;
  comment: string;
  created_at?: string;
}

interface BackendReviewPage {
  data: BackendReview[];
  page: number;
  totalCount: number;
}

interface ReviewWriteResult {
  id?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

const normalizeReview = (review: BackendReview): Review => ({
  id: review.id,
  productId: review.product_id,
  userId: review.user_id,
  userName: review.name,
  userAvatar: toApiAssetUrl(review.avatar),
  rating: Number(review.rating),
  comment: review.comment,
  createdAt: review.created_at,
});

const normalizeWriteResult = (review: {
  id?: string;
  rating: number | string;
  comment: string;
  created_at?: string;
}): ReviewWriteResult => ({
  id: review.id,
  rating: Number(review.rating),
  comment: review.comment,
  createdAt: review.created_at,
});

export const reviewService = {
  async getReviews(productId: string, page = 1, limit = 20): Promise<PaginatedResult<Review>> {
    const response = await axiosClient.get<BackendReviewPage>(`/api/v1/reviews/${productId}/`, {
      params: { page, limit },
    });
    return {
      page: response.data.page,
      limit,
      totalPages: Math.ceil(response.data.totalCount / limit),
      totalCount: response.data.totalCount,
      data: response.data.data.map(normalizeReview),
    };
  },

  async createReview(productId: string, data: CreateReviewRequest): Promise<ReviewWriteResult> {
    const response = await axiosClient.post<{
      message: string;
      data: { id: string; rating: number | string; comment: string; created_at?: string };
    }>('/api/v1/reviews/', { productId, ...data });
    return normalizeWriteResult(response.data.data);
  },

  async updateReview(productId: string, reviewId: string, data: CreateReviewRequest): Promise<ReviewWriteResult> {
    const response = await axiosClient.patch<{
      message: string;
      data: { rating: number | string; comment: string; created_at?: string };
    }>(`/api/v1/reviews/${reviewId}/`, data);
    return normalizeWriteResult(response.data.data);
  },

  async deleteReview(productId: string, reviewId: string): Promise<void> {
    await axiosClient.delete(`/api/v1/reviews/${reviewId}/`);
  }
};
