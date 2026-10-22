import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { Cart, CartItem, CartMutationResult } from '@/types/api.types';

interface BackendCartItem {
  id: string;
  product_id: string;
  name: string;
  price: number | string;
  image?: string | null;
  quantity: number;
  stock: number | string;
}

const normalizeCartItem = (item: BackendCartItem): CartItem => ({
  id: item.id,
  productId: item.product_id,
  name: item.name,
  price: Number(item.price),
  image: toApiAssetUrl(item.image) || '',
  quantity: Number(item.quantity),
  stock: Number(item.stock),
});

export const cartService = {
  async getCart(): Promise<Cart> {
    const response = await axiosClient.get<Omit<Cart, 'items'> & { items: BackendCartItem[] }>('/api/v1/cart');
    return {
      ...response.data,
      items: response.data.items.map(normalizeCartItem),
    };
  },

  async addToCart(productId: string, quantity: number): Promise<CartMutationResult> {
    const response = await axiosClient.post<CartMutationResult>('/api/v1/cart/items', { productId, quantity });
    return response.data;
  },

  async updateCartItem(id: string, quantity: number): Promise<{ data: CartMutationResult['data'] }> {
    const response = await axiosClient.patch<{ data: CartMutationResult['data'] }>(`/api/v1/cart/items/${id}`, { quantity });
    return response.data;
  },

  async removeFromCart(id: string): Promise<CartMutationResult> {
    const response = await axiosClient.delete<CartMutationResult>(`/api/v1/cart/items/${id}`);
    return response.data;
  }
};
