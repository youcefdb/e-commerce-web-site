import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api/errors';
import { Product } from '@/types/api.types';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { WishlistProduct, wishlistService } from '../services/wishlist.service';

export function useWishlist() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const guestItems = useWishlistStore((state) => state.items);
  const toggleGuestItem = useWishlistStore((state) => state.toggleWishlist);
  const queryClient = useQueryClient();
  const queryKey = ['wishlist', user?.id];

  const wishlistQuery = useQuery({
    queryKey,
    queryFn: () => wishlistService.getWishlist(),
    enabled: isAuthenticated && !!user?.id,
  });

  const addItem = useMutation({
    mutationFn: async (product: Product) => ({
      product,
      wishlistItemId: await wishlistService.addWishlistItem(product.id),
    }),
    onSuccess: ({ product, wishlistItemId }) => {
      queryClient.setQueryData<WishlistProduct[]>(queryKey, (items = []) => {
        if (items.some((item) => item.id === product.id)) return items;
        return [...items, { ...product, wishlistItemId }];
      });
      void queryClient.invalidateQueries({ queryKey });
      toast.success('Added to wishlist');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to add item to wishlist'));
    },
  });

  const removeItem = useMutation({
    mutationFn: async (wishlistItemId: string) => {
      await wishlistService.removeWishlistItem(wishlistItemId);
      return wishlistItemId;
    },
    onSuccess: (wishlistItemId) => {
      queryClient.setQueryData<WishlistProduct[]>(queryKey, (items = []) =>
        items.filter((item) => item.wishlistItemId !== wishlistItemId)
      );
      void queryClient.invalidateQueries({ queryKey });
      toast.success('Removed from wishlist');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to remove item from wishlist'));
    },
  });

  const accountItems = wishlistQuery.data || [];
  const items = isAuthenticated ? accountItems : guestItems;
  const isWishlistUnavailable = isAuthenticated && wishlistQuery.isError;

  const isInWishlist = (productId: string) => items.some((item) => item.id === productId);

  const toggleWishlist = (product: Product) => {
    if (!isAuthenticated) {
      toggleGuestItem(product);
      return;
    }

    const existingItem = accountItems.find((item) => item.id === product.id);
    if (existingItem) {
      removeItem.mutate(existingItem.wishlistItemId);
    } else {
      addItem.mutate(product);
    }
  };

  return {
    items,
    isInWishlist,
    toggleWishlist,
    isLoading: isAuthenticated && wishlistQuery.isLoading,
    isError: isWishlistUnavailable,
    isToggling:
      addItem.isPending
      || removeItem.isPending
      || (isAuthenticated && wishlistQuery.isFetching)
      || isWishlistUnavailable,
  };
}
