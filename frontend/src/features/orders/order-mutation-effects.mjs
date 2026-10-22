export function handleOrderStatusSuccess(queryClient, toast, orderId) {
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  toast.success('Order status updated');
}

export function handleOrderStatusError(toast, error, getErrorMessage) {
  toast.error(getErrorMessage(error, 'Failed to update order status'));
}

export function handleOrderCancellationSuccess(queryClient, toast, orderId) {
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  toast.success('Order cancelled and reserved stock released');
}

export function handleOrderCancellationError(toast, error, getErrorMessage) {
  toast.error(getErrorMessage(error, 'This order cannot be cancelled'));
}
