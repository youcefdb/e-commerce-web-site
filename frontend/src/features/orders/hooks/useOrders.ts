import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { CreateOrderRequest, OrderStatus } from '@/types/api.types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api/errors';
import { checkoutIdempotency, isRetryableCheckoutNetworkError } from '../utils/checkout-idempotency';
import {
  handleOrderCancellationError,
  handleOrderCancellationSuccess,
  handleOrderStatusError,
  handleOrderStatusSuccess,
} from '../order-mutation-effects.mjs';

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderService.getOrders(page),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const idempotencyKey = await checkoutIdempotency.getKey(data);
      return orderService.createOrder(data, idempotencyKey);
    },
    retry: (failureCount, error) => failureCount < 2 && isRetryableCheckoutNetworkError(error),
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 3000),
    onSuccess: (data) => {
      checkoutIdempotency.clear();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changes
      toast.success('Order placed successfully!');
      router.push(`/orders?success=true&orderId=${data.data.orderId}`);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, 'Failed to place order'));
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: (result) => {
      handleOrderStatusSuccess(queryClient, toast, result.orderId);
    },
    onError: (error: unknown) => {
      handleOrderStatusError(toast, error, getApiErrorMessage);
    }
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onSuccess: (result) => {
      handleOrderCancellationSuccess(queryClient, toast, result.orderId);
    },
    onError: (error: unknown) => {
      handleOrderCancellationError(toast, error, getApiErrorMessage);
    },
  });
}
