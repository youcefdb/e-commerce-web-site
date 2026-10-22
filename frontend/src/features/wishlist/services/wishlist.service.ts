import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { Product } from '@/types/api.types';

const WISHLIST_URL = '/api/v1/whishLists/v1/';
const WISHLIST_ITEM_URL = '/api/v1/whishLists/';
const WISHLIST_PAGE_SIZE = 100;

interface BackendWishlistItem {
  wishlist_item_id: string;
  id: string;
  category_id: string;
  category: string;
  name: string;
  description: string;
  price: number | string;
  image?: string | null;
  stock: number | string;
  rating: number | string;
  num_reviews: number | string;
  created_at: string;
}

interface BackendWishlistPage {
  data: BackendWishlistItem[];
  totalCount: number;
}

export interface WishlistProduct extends Product {
  wishlistItemId: string;
}

const normalizeWishlistItem = (item: BackendWishlistItem): WishlistProduct => ({
  id: item.id,
  categoryId: item.category_id,
  category: item.category,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  image: toApiAssetUrl(item.image) || '',
  stock: Number(item.stock),
  rating: Number(item.rating),
  numReviews: Number(item.num_reviews),
  createdAt: item.created_at,
  wishlistItemId: item.wishlist_item_id,
});

export const wishlistService = {
  async getWishlist(): Promise<WishlistProduct[]> {
    const firstPage = await axiosClient.get<BackendWishlistPage>(WISHLIST_URL, {
      params: { page: 1, limit: WISHLIST_PAGE_SIZE },
    });
    const products = firstPage.data.data.map(normalizeWishlistItem);
    const totalPages = Math.ceil(firstPage.data.totalCount / WISHLIST_PAGE_SIZE);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await axiosClient.get<BackendWishlistPage>(WISHLIST_URL, {
        params: { page, limit: WISHLIST_PAGE_SIZE },
      });
      products.push(...response.data.data.map(normalizeWishlistItem));
    }

    return products;
  },

  async addWishlistItem(productId: string): Promise<string> {
    const response = await axiosClient.post<{ data: { id: string }; count: number }>(WISHLIST_URL, {
      productId,
    });
    return response.data.data.id;
  },

  async removeWishlistItem(wishlistItemId: string): Promise<void> {
    await axiosClient.delete(`${WISHLIST_ITEM_URL}${wishlistItemId}/v1/`);
  },
};
