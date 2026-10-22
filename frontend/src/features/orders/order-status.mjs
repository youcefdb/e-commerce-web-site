const allowedTransitions = Object.freeze({
  pending: Object.freeze(['paid', 'processing', 'cancelled']),
  paid: Object.freeze(['processing', 'shipped']),
  processing: Object.freeze(['shipped']),
  shipped: Object.freeze(['delivered']),
  delivered: Object.freeze([]),
  cancelled: Object.freeze([]),
});

export function getAllowedOrderTransitions(status) {
  return allowedTransitions[status] ?? [];
}

export function canCustomerCancelOrder(status) {
  return status === 'pending';
}
