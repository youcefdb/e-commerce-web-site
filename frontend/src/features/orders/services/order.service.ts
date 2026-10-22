import { axiosClient } from '@/lib/api/axios-client';
import { OrderSummary, OrderDetailItem, CreateOrderRequest, CreateOrderResponse, OrderStatus, PaginatedResult } from '@/types/api.types';
import { idempotencyKeyHeaders } from '../utils/checkout-idempotency';

interface BackendOrderSummary {
  id: string;
  total_price: number | string;
  status: OrderStatus;
  created_at: string;
}

interface BackendOrderPage {
  data: BackendOrderSummary[];
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

interface BackendOrderDetailItem {
  name: string;
  price: number | string;
  quantity: number | string;
  item_price: number | string;
}

const normalizeOrderSummary = (order: BackendOrderSummary): OrderSummary => ({
  id: order.id,
  total: Number(order.total_price),
  status: order.status,
  createdAt: order.created_at,
});

export const orderService = {
  async createOrder(data: CreateOrderRequest, idempotencyKey: string): Promise<CreateOrderResponse> {
    const response = await axiosClient.post<CreateOrderResponse>('/api/v1/orders', data, {
      headers: idempotencyKeyHeaders(idempotencyKey),
    });
    return response.data;
  },

  async getOrders(page = 1, limit = 20): Promise<PaginatedResult<OrderSummary>> {
    const response = await axiosClient.get<BackendOrderPage>('/api/v1/orders', {
      params: { page, limit },
    });
    return {
      ...response.data,
      data: response.data.data.map(normalizeOrderSummary),
    };
  },

  async getOrder(id: string): Promise<OrderDetailItem[]> {
    const response = await axiosClient.get<{ data: BackendOrderDetailItem[] }>(`/api/v1/orders/${id}`);
    return response.data.data.map((item) => ({
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.item_price),
    }));
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<{ message: string; orderId: string }> {
    const response = await axiosClient.patch<{ message: string }>(`/api/v1/admin/orders/${id}`, { status }, {
      headers: idempotencyKeyHeaders(globalThis.crypto.randomUUID()),
    });
    return { ...response.data, orderId: id };
  },

  async cancelOrder(id: string): Promise<{ message: string; orderId: string }> {
    const response = await axiosClient.post<{ message: string }>(`/api/v1/orders/${id}/cancel`, {}, {
      headers: idempotencyKeyHeaders(globalThis.crypto.randomUUID()),
    });
    return { ...response.data, orderId: id };
  }
};
