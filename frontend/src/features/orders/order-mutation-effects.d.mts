type QueryClientLike = {
  invalidateQueries(options: { queryKey: unknown[] }): unknown;
};

type ToastLike = {
  success(message: string): unknown;
  error(message: string): unknown;
};

type ErrorMessageFormatter = (error: unknown, fallback: string) => string;

export function handleOrderStatusSuccess(
  queryClient: QueryClientLike,
  toast: ToastLike,
  orderId: string,
): void;
export function handleOrderStatusError(
  toast: ToastLike,
  error: unknown,
  getErrorMessage: ErrorMessageFormatter,
): void;
export function handleOrderCancellationSuccess(
  queryClient: QueryClientLike,
  toast: ToastLike,
  orderId: string,
): void;
export function handleOrderCancellationError(
  toast: ToastLike,
  error: unknown,
  getErrorMessage: ErrorMessageFormatter,
): void;
