import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getStats(),
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminService.getOrders(),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getUsers(),
  });
}
