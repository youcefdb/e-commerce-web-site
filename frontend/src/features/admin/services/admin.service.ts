import { axiosClient } from '@/lib/api/axios-client';
import { AdminStats, Order, User } from '@/types/api.types';

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await axiosClient.get<AdminStats>('/api/v1/admin/stats');
    return response.data;
  },

  async getOrders(): Promise<Order[]> {
    const response = await axiosClient.get<Order[]>('/api/v1/admin/orders');
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await axiosClient.get<User[]>('/api/v1/admin/users');
    return response.data;
  }
};
