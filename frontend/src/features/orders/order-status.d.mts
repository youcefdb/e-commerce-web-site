import type { OrderStatus } from '@/types/api.types';

export function getAllowedOrderTransitions(status: OrderStatus): OrderStatus[];
export function canCustomerCancelOrder(status: OrderStatus): boolean;
