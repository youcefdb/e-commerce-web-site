import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/store/useAuthStore';

export function useCart() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to add item to cart'));
    }
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartService.updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to update quantity'));
    }
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cartService.removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to remove item'));
    }
  });
}
