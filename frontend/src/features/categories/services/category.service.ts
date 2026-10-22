import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { Category } from '@/types/api.types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await axiosClient.get<{
      data: Array<Category & { created_at?: string; image?: string | null }>;
    }>('/api/v1/categories');
    return response.data.data.map((category) => ({
      ...category,
      image: toApiAssetUrl(category.image),
      createdAt: category.created_at,
    }));
  }
};
