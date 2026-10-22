import assert from 'node:assert/strict';
import test from 'node:test';
import {
  handleOrderStatusError,
  handleOrderStatusSuccess,
  handleOrderCancellationError,
  handleOrderCancellationSuccess,
} from './order-mutation-effects.mjs';

const makeEffects = () => {
  const invalidations = [];
  const notifications = [];
  return {
    invalidations,
    notifications,
    queryClient: { invalidateQueries: ({ queryKey }) => invalidations.push(queryKey) },
    toast: {
      success: (message) => notifications.push({ type: 'success', message }),
      error: (message) => notifications.push({ type: 'error', message }),
    },
  };
};

const errorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  return error?.message || fallback;
};

test('successful status changes refresh order views and show confirmation', () => {
  const effects = makeEffects();
  handleOrderStatusSuccess(effects.queryClient, effects.toast, 'order-1');

  assert.deepEqual(effects.invalidations, [
    ['orders'],
    ['admin', 'orders'],
    ['admin', 'stats'],
    ['order', 'order-1'],
  ]);
  assert.deepEqual(effects.notifications, [
    { type: 'success', message: 'Order status updated' },
  ]);
});

test('rejected status changes show the backend reason without success effects', () => {
  const effects = makeEffects();
  handleOrderStatusError(
    effects.toast,
    { response: { data: { message: 'Order cannot transition from shipped to cancelled' } } },
    errorMessage,
  );

  assert.deepEqual(effects.invalidations, []);
  assert.deepEqual(effects.notifications, [
    { type: 'error', message: 'Order cannot transition from shipped to cancelled' },
  ]);
});

test('successful cancellation refreshes inventory and order views', () => {
  const effects = makeEffects();
  handleOrderCancellationSuccess(effects.queryClient, effects.toast, 'order-2');

  assert.deepEqual(effects.invalidations, [
    ['orders'],
    ['order', 'order-2'],
    ['products'],
    ['admin', 'orders'],
  ]);
  assert.equal(effects.notifications[0].type, 'success');
});

test('rejected cancellation displays a clear fallback or backend reason', () => {
  const effects = makeEffects();
  handleOrderCancellationError(effects.toast, new Error('Order cannot be cancelled'), errorMessage);

  assert.deepEqual(effects.notifications, [
    { type: 'error', message: 'Order cannot be cancelled' },
  ]);
});
