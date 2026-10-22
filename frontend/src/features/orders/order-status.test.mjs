import assert from 'node:assert/strict';
import test from 'node:test';
import { canCustomerCancelOrder, getAllowedOrderTransitions } from './order-status.mjs';

test('admin actions follow the fulfillment sequence and stop at terminal states', () => {
  assert.deepEqual(getAllowedOrderTransitions('pending'), ['processing', 'cancelled']);
  assert.deepEqual(getAllowedOrderTransitions('processing'), ['shipped']);
  assert.deepEqual(getAllowedOrderTransitions('shipped'), ['delivered']);
  assert.deepEqual(getAllowedOrderTransitions('delivered'), []);
  assert.deepEqual(getAllowedOrderTransitions('cancelled'), []);
  assert.deepEqual(getAllowedOrderTransitions('paid'), ['processing']);
});

test('customer cancellation is offered only while an order is pending', () => {
  assert.equal(canCustomerCancelOrder('pending'), true);
  assert.equal(canCustomerCancelOrder('processing'), false);
  assert.equal(canCustomerCancelOrder('shipped'), false);
  assert.equal(canCustomerCancelOrder('delivered'), false);
  assert.equal(canCustomerCancelOrder('cancelled'), false);
  assert.equal(canCustomerCancelOrder('paid'), false);
});
